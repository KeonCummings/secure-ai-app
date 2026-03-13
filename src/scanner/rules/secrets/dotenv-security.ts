import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

export class DotenvSecurityRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'secrets/dotenv-security',
    name: '.env Not in .gitignore',
    description: 'Checks that .env files are listed in .gitignore to prevent secret leaks',
    severity: 'high',
    category: 'secrets',
    fixable: true,
    engine: 'regex',
  };

  scan(context: RuleContext): Finding[] {
    // Only run on .gitignore files
    if (!context.filePath.endsWith('.gitignore')) return [];

    const findings: Finding[] = [];
    const content = context.content;
    const lines = content.split('\n');

    const hasEnvIgnore = lines.some((line) => {
      const trimmed = line.trim();
      return (
        trimmed === '.env' ||
        trimmed === '.env*' ||
        trimmed === '.env.*' ||
        trimmed === '.env.local' ||
        trimmed === '.env.production' ||
        trimmed === '*.env'
      );
    });

    if (!hasEnvIgnore && context.projectContext.hasDotEnv) {
      findings.push(
        this.createFinding(context, {
          line: 1,
          message:
            '.env files exist but are not listed in .gitignore. Secrets may be committed to version control.',
          fix: {
            description: 'Add .env to .gitignore',
            strategyId: 'add-gitignore',
            data: { patterns: ['.env', '.env.*', '.env.local'] },
          },
        }),
      );
    }

    return findings;
  }
}
