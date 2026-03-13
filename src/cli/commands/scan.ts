import { resolve } from 'node:path';
import pc from 'picocolors';
import { ScanEngine } from '../../scanner/index.js';
import { loadConfig } from '../config/loader.js';
import { formatReport } from '../output/formatters.js';
import type { Severity } from '../../types/index.js';

export async function scanCommand(options: {
  path?: string;
  format?: string;
  severity?: string;
  changedOnly?: boolean;
  rule?: string[];
}) {
  const rootDir = resolve(options.path ?? '.');
  const config = loadConfig(rootDir);

  const engine = new ScanEngine();
  const report = await engine.scan({
    path: rootDir,
    format: (options.format ?? config.format ?? 'table') as 'table' | 'json' | 'sarif',
    severity: (options.severity ?? config.severity) as Severity | undefined,
    changedOnly: options.changedOnly,
    rules: options.rule,
    exclude: config.exclude,
  });

  const format = options.format ?? config.format ?? 'table';
  const output = formatReport(report, format);
  console.log(output);

  // Exit with non-zero if critical/high findings exist
  const hasCritical = report.findings.some(
    (f) => f.severity === 'critical' || f.severity === 'high',
  );
  if (hasCritical) {
    process.exit(1);
  }
}
