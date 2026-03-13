import { resolve } from 'node:path';
import pc from 'picocolors';
import { ScanEngine } from '../../scanner/index.js';
import { FixEngine } from '../../fixer/index.js';
import { loadConfig } from '../config/loader.js';
import { formatReport } from '../output/formatters.js';

export async function statusCommand(options: { path?: string }) {
  const rootDir = resolve(options.path ?? '.');
  const config = loadConfig(rootDir);

  const engine = new ScanEngine();
  const report = await engine.scan({
    path: rootDir,
    exclude: config.exclude,
  });

  const fixer = new FixEngine();
  const fixable = fixer.getFixableFindings(report.findings);

  console.log(pc.bold('Security Status'));
  console.log('');

  // Score
  const { score } = report;
  const gradeColor =
    score.grade === 'A'
      ? pc.green
      : score.grade === 'B'
        ? pc.cyan
        : score.grade === 'C'
          ? pc.yellow
          : pc.red;

  console.log(`  Score:    ${gradeColor(`${score.value}/100 (${score.grade})`)}`);
  console.log(`  Files:    ${report.filesScanned} scanned`);
  console.log(`  Rules:    ${report.rulesApplied} applied`);
  console.log(`  Issues:   ${report.findings.length} found`);
  console.log(`  Fixable:  ${fixable.length} auto-fixable`);
  console.log('');

  // Breakdown
  if (report.findings.length > 0) {
    if (score.breakdown.critical > 0)
      console.log(`  ${pc.red(`${score.breakdown.critical} critical`)}`);
    if (score.breakdown.high > 0)
      console.log(`  ${pc.yellow(`${score.breakdown.high} high`)}`);
    if (score.breakdown.medium > 0)
      console.log(`  ${pc.cyan(`${score.breakdown.medium} medium`)}`);
    if (score.breakdown.low > 0)
      console.log(`  ${pc.dim(`${score.breakdown.low} low`)}`);
    console.log('');
    console.log(
      pc.dim('Run ') +
        pc.cyan('secure-ai-app scan') +
        pc.dim(' for details, or ') +
        pc.cyan('secure-ai-app fix') +
        pc.dim(' to auto-fix.'),
    );
  }
}
