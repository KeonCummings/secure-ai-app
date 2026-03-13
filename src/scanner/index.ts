import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import type { Finding, ScanOptions, ScanReport, SecurityScore, Severity } from '../types/index.js';
import type { RuleContext } from './types.js';
import { RuleRegistry } from './rules/index.js';
import { walkFiles } from './file-walker.js';
import { detectProjectContext } from './context.js';
import { getChangedFiles } from '../git/diff-scanner.js';

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export class ScanEngine {
  private registry = new RuleRegistry();

  async scan(options: ScanOptions): Promise<ScanReport> {
    const start = Date.now();
    const projectContext = detectProjectContext(options.path);
    const rules = this.registry.getEnabled();

    // Filter rules by user selection
    const activeRules = options.rules
      ? rules.filter((r) => options.rules!.includes(r.meta.id))
      : rules;

    // Discover files
    let files = await walkFiles(options.path, options.exclude);

    if (options.changedOnly) {
      const changed = new Set(getChangedFiles(options.path));
      files = files.filter((f) => changed.has(f));
    }

    // Scan each file
    const allFindings: Finding[] = [];

    for (const filePath of files) {
      let content: string;
      try {
        content = readFileSync(filePath, 'utf-8');
      } catch {
        continue;
      }

      const ruleContext: RuleContext = {
        filePath: relative(options.path, filePath),
        content,
        projectContext,
      };

      for (const rule of activeRules) {
        try {
          const findings = rule.scan(ruleContext);
          allFindings.push(...findings);
        } catch {
          // Rule threw — skip silently for now
        }
      }
    }

    // Filter by severity
    const filtered = options.severity
      ? allFindings.filter(
          (f) => SEVERITY_ORDER[f.severity] <= SEVERITY_ORDER[options.severity!],
        )
      : allFindings;

    // Sort: critical first
    filtered.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );

    const duration = Date.now() - start;

    return {
      findings: filtered,
      filesScanned: files.length,
      rulesApplied: activeRules.length,
      duration,
      score: this.calculateScore(filtered),
    };
  }

  private calculateScore(findings: Finding[]): SecurityScore {
    const breakdown = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      breakdown[f.severity]++;
    }

    // Per-rule logarithmic diminishing returns:
    // Group by ruleId, then apply 1 + ln(count) so repeated instances
    // of the same rule don't linearly destroy the score.
    const RULE_WEIGHTS: Record<Severity, number> = { critical: 20, high: 4, medium: 2, low: 1 };

    const byRule = new Map<string, { severity: Severity; count: number }>();
    for (const f of findings) {
      const existing = byRule.get(f.ruleId);
      if (existing) existing.count++;
      else byRule.set(f.ruleId, { severity: f.severity, count: 1 });
    }

    let deduction = 0;
    for (const { severity, count } of byRule.values()) {
      deduction += RULE_WEIGHTS[severity] * (1 + Math.log(count));
    }

    const value = Math.max(0, Math.min(100, Math.round(100 - deduction)));

    let grade: SecurityScore['grade'];
    if (value >= 90) grade = 'A';
    else if (value >= 75) grade = 'B';
    else if (value >= 60) grade = 'C';
    else if (value >= 40) grade = 'D';
    else grade = 'F';

    return { value, grade, breakdown };
  }
}
