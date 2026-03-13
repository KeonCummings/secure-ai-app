import pc from 'picocolors';
import type { Finding, ScanReport, SecurityScore, Severity } from '../../types/index.js';

const SEVERITY_COLORS: Record<Severity, (s: string) => string> = {
  critical: pc.red,
  high: pc.yellow,
  medium: pc.cyan,
  low: pc.dim,
};

const SEVERITY_ICONS: Record<Severity, string> = {
  critical: 'X',
  high: '!',
  medium: '~',
  low: '-',
};

export function formatTable(report: ScanReport): string {
  const lines: string[] = [];

  if (report.findings.length === 0) {
    lines.push(pc.green('No security issues found.'));
  } else {
    // Group by file
    const byFile = new Map<string, Finding[]>();
    for (const f of report.findings) {
      const existing = byFile.get(f.filePath) ?? [];
      existing.push(f);
      byFile.set(f.filePath, existing);
    }

    for (const [file, findings] of byFile) {
      lines.push('');
      lines.push(pc.underline(file));
      for (const f of findings) {
        const color = SEVERITY_COLORS[f.severity];
        const icon = SEVERITY_ICONS[f.severity];
        lines.push(
          `  ${color(`[${icon}]`)} ${pc.dim(`L${f.line}`)} ${f.message} ${pc.dim(`(${f.ruleId})`)}`,
        );
        if (f.snippet) {
          lines.push(`       ${pc.dim(f.snippet)}`);
        }
      }
    }
  }

  lines.push('');
  lines.push(formatScoreLine(report.score));
  lines.push(
    pc.dim(
      `${report.filesScanned} files scanned | ${report.rulesApplied} rules applied | ${report.duration}ms`,
    ),
  );

  return lines.join('\n');
}

export function formatJson(report: ScanReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatSarif(report: ScanReport): string {
  const sarif = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'secure-ai-app',
            version: '0.1.0',
            rules: report.findings
              .map((f) => f.ruleId)
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((id) => ({
                id,
                shortDescription: { text: id },
              })),
          },
        },
        results: report.findings.map((f) => ({
          ruleId: f.ruleId,
          level: f.severity === 'critical' || f.severity === 'high' ? 'error' : 'warning',
          message: { text: f.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: f.filePath },
                region: { startLine: f.line, startColumn: f.column ?? 1 },
              },
            },
          ],
        })),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

function formatScoreLine(score: SecurityScore): string {
  const gradeColor =
    score.grade === 'A'
      ? pc.green
      : score.grade === 'B'
        ? pc.cyan
        : score.grade === 'C'
          ? pc.yellow
          : pc.red;

  const breakdown = [
    score.breakdown.critical > 0 ? pc.red(`${score.breakdown.critical} critical`) : null,
    score.breakdown.high > 0 ? pc.yellow(`${score.breakdown.high} high`) : null,
    score.breakdown.medium > 0 ? pc.cyan(`${score.breakdown.medium} medium`) : null,
    score.breakdown.low > 0 ? pc.dim(`${score.breakdown.low} low`) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `Security Score: ${gradeColor(`${score.value}/100 (${score.grade})`)}${breakdown ? ` | ${breakdown}` : ''}`;
}

export function formatReport(report: ScanReport, format: string): string {
  switch (format) {
    case 'json':
      return formatJson(report);
    case 'sarif':
      return formatSarif(report);
    default:
      return formatTable(report);
  }
}
