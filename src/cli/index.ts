import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { scanCommand } from './commands/scan.js';
import { fixCommand } from './commands/fix.js';
import { statusCommand } from './commands/status.js';
import { hooksCommand } from './commands/hooks.js';
import { rulesCommand } from './commands/rules.js';

export function createCli(): Command {
  const program = new Command();

  program
    .name('secure-ai-app')
    .description('Security guardrails for AI-built applications')
    .version('0.1.0');

  program
    .command('init')
    .description('Initialize security scanning for your project')
    .option('-p, --path <path>', 'Project root directory', '.')
    .option('--no-hooks', 'Skip git hook installation')
    .action(initCommand);

  program
    .command('scan')
    .description('Scan project for security issues')
    .option('-p, --path <path>', 'Project root directory', '.')
    .option('-f, --format <format>', 'Output format (table, json, sarif)', 'table')
    .option('-s, --severity <level>', 'Minimum severity to report')
    .option('--changed-only', 'Only scan files changed since last commit')
    .option('-r, --rule <rules...>', 'Only run specific rules')
    .action(scanCommand);

  program
    .command('fix')
    .description('Auto-fix security issues')
    .option('-p, --path <path>', 'Project root directory', '.')
    .option('--dry-run', 'Show what would be fixed without applying')
    .option('-i, --interactive', 'Prompt before each fix')
    .option('--backup', 'Create .bak files before modifying')
    .option('-r, --rule <rules...>', 'Only fix specific rules')
    .action(fixCommand);

  program
    .command('status')
    .description('Show security score summary')
    .option('-p, --path <path>', 'Project root directory', '.')
    .action(statusCommand);

  program
    .command('rules')
    .description('List all available security rules')
    .action(rulesCommand);

  const hooks = program
    .command('hooks')
    .description('Manage git hooks');

  hooks
    .command('install')
    .description('Install pre-commit security hook')
    .option('-p, --path <path>', 'Project root directory', '.')
    .action((opts) => hooksCommand('install', opts));

  hooks
    .command('remove')
    .description('Remove pre-commit security hook')
    .option('-p, --path <path>', 'Project root directory', '.')
    .action((opts) => hooksCommand('remove', opts));

  return program;
}
