import type { Finding, FixOptions, FixResult } from '../types/index.js';
import type { FixStrategy } from './types.js';
import { MoveToEnvStrategy } from './strategies/move-to-env.js';
import { AddGitignoreStrategy } from './strategies/add-gitignore.js';
import { InjectTenantScopeStrategy } from './strategies/inject-tenant-scope.js';
import { InjectAuthGuardStrategy } from './strategies/inject-auth-guard.js';

export class FixEngine {
  private strategies: Map<string, FixStrategy> = new Map();

  constructor() {
    const all: FixStrategy[] = [
      new MoveToEnvStrategy(),
      new AddGitignoreStrategy(),
      new InjectTenantScopeStrategy(),
      new InjectAuthGuardStrategy(),
    ];
    for (const s of all) {
      this.strategies.set(s.id, s);
    }
  }

  getFixableFindings(findings: Finding[]): Finding[] {
    return findings.filter(
      (f) => f.fix && this.strategies.has(f.fix.strategyId),
    );
  }

  preview(finding: Finding, rootDir: string): string | null {
    if (!finding.fix) return null;
    const strategy = this.strategies.get(finding.fix.strategyId);
    if (!strategy) return null;
    return strategy.preview(finding, rootDir);
  }

  applyFix(finding: Finding, rootDir: string): FixResult {
    if (!finding.fix) {
      return { finding, applied: false, error: 'No fix suggestion' };
    }
    const strategy = this.strategies.get(finding.fix.strategyId);
    if (!strategy) {
      return { finding, applied: false, error: `Unknown strategy: ${finding.fix.strategyId}` };
    }
    return strategy.apply(finding, rootDir);
  }

  applyAll(findings: Finding[], rootDir: string): FixResult[] {
    const fixable = this.getFixableFindings(findings);
    return fixable.map((f) => this.applyFix(f, rootDir));
  }
}
