import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pc from 'picocolors';
import { detectProjectContext } from '../../scanner/context.js';
import { installPreCommitHook } from '../../git/hooks.js';
import type { ProjectConfig } from '../../types/index.js';

export async function initCommand(options: { hooks?: boolean; path?: string }) {
  const rootDir = resolve(options.path ?? '.');
  console.log(pc.bold('Initializing secure-ai-app...'));
  console.log('');

  // Detect project
  const ctx = detectProjectContext(rootDir);
  console.log(`  Framework: ${pc.cyan(ctx.framework)}`);
  console.log(`  Flowstack SDK: ${ctx.hasFlowstackSdk ? pc.green('detected') : pc.dim('not found')}`);
  console.log(`  .env files: ${ctx.hasDotEnv ? pc.yellow('found') : pc.dim('none')}`);
  console.log(`  .gitignore: ${ctx.hasGitIgnore ? pc.green('present') : pc.red('missing')}`);
  console.log('');

  // Create config
  const configPath = join(rootDir, '.secure-ai-app.json');
  if (existsSync(configPath)) {
    console.log(pc.dim('  Config already exists, skipping.'));
  } else {
    const config: ProjectConfig = {
      severity: 'medium',
      format: 'table',
      exclude: ['node_modules', 'dist', '.next'],
      hooks: { preCommit: options.hooks ?? true },
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(pc.green('  Created .secure-ai-app.json'));
  }

  // Install hooks
  if (options.hooks !== false) {
    const result = installPreCommitHook(rootDir);
    if (result.success) {
      console.log(pc.green(`  ${result.message}`));
    } else {
      console.log(pc.yellow(`  ${result.message}`));
    }
  }

  console.log('');
  console.log(pc.bold('Run ') + pc.cyan('secure-ai-app scan') + pc.bold(' to check for security issues.'));
}
