import pc from 'picocolors';
import { RuleRegistry } from '../../scanner/rules/index.js';
import type { Severity } from '../../types/index.js';

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

export async function rulesCommand(): Promise<void> {
  const registry = new RuleRegistry();
  const rules = registry.getAll();

  console.log(`\nAvailable Rules (${rules.length})\n`);

  for (const rule of rules) {
    const { id, severity, fixable, description } = rule.meta;
    const color = SEVERITY_COLORS[severity];
    const icon = SEVERITY_ICONS[severity];
    const fixLabel = fixable ? pc.green('fixable') : '';
    const severityLabel = color(severity.padEnd(10));

    console.log(
      `  ${color(`[${icon}]`)} ${id.padEnd(36)} ${severityLabel} ${fixLabel.padEnd(10)} ${pc.dim(description)}`,
    );
  }

  console.log('');
}
