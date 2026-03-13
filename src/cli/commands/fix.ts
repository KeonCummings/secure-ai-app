import { resolve, join, dirname, basename } from 'node:path';
import { copyFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import pc from 'picocolors';
import { ScanEngine } from '../../scanner/index.js';
import { FixEngine } from '../../fixer/index.js';
import { loadConfig } from '../config/loader.js';
import type { Severity } from '../../types/index.js';

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

export async function fixCommand(options: {
  path?: string;
  dryRun?: boolean;
  interactive?: boolean;
  backup?: boolean;
  rule?: string[];
}) {
  const rootDir = resolve(options.path ?? '.');
  const config = loadConfig(rootDir);

  // First scan
  const scanner = new ScanEngine();
  const report = await scanner.scan({
    path: rootDir,
    rules: options.rule,
    exclude: config.exclude,
  });

  const fixer = new FixEngine();
  const fixable = fixer.getFixableFindings(report.findings);

  if (fixable.length === 0) {
    console.log(pc.green('No auto-fixable issues found.'));
    return;
  }

  console.log(pc.bold(`Found ${fixable.length} auto-fixable issue(s):`));
  console.log('');

  for (const finding of fixable) {
    const preview = fixer.preview(finding, rootDir);
    console.log(
      `  ${pc.yellow(finding.ruleId)} ${pc.dim(`(${finding.filePath}:${finding.line})`)}`,
    );
    if (preview) {
      console.log(`    ${pc.dim(preview)}`);
    }

    if (options.dryRun) {
      console.log(`    ${pc.cyan('[dry-run] Would apply fix')}`);
      continue;
    }

    if (options.interactive && !(await confirm(`  Apply fix for ${finding.ruleId}?`))) {
      console.log(`    ${pc.dim('Skipped')}`);
      continue;
    }

    if (options.backup) {
      const targetPath = join(rootDir, finding.filePath);
      const backupPath = targetPath + '.bak';
      copyFileSync(targetPath, backupPath);
      console.log(`    ${pc.dim(`Backup: ${backupPath}`)}`);
    }

    const result = fixer.applyFix(finding, rootDir);
    if (result.applied) {
      console.log(`    ${pc.green('Fixed')}`);
      if (result.diff) {
        console.log(`    ${pc.dim(result.diff)}`);
      }
    } else {
      console.log(`    ${pc.red(`Failed: ${result.error}`)}`);
    }
  }

  console.log('');
  if (options.dryRun) {
    console.log(pc.dim('Dry run — no changes applied. Remove --dry-run to apply.'));
  }
}
