import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

/** Sensitive env var patterns that should NOT be NEXT_PUBLIC_ */
const SENSITIVE_PATTERNS = [
  'SECRET',
  'PASSWORD',
  'PRIVATE',
  'JWT',
  'TOKEN',
  'API_KEY',
  'APIKEY',
  'CREDENTIALS',
  'DATABASE_URL',
  'DB_',
  'STRIPE_SECRET',
];

export class EnvExposureRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'secrets/env-exposure',
    name: 'Sensitive Environment Variable Exposed to Client',
    description: 'Detects NEXT_PUBLIC_ prefix on sensitive environment variables',
    severity: 'high',
    category: 'secrets',
    fixable: false,
    engine: 'regex',
  };

  scan(context: RuleContext): Finding[] {
    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.matchAll(/NEXT_PUBLIC_([A-Z_]+)/g);

      for (const match of matches) {
        const varName = match[1];
        const isSensitive = SENSITIVE_PATTERNS.some((p) => varName.includes(p));

        if (isSensitive) {
          findings.push(
            this.createFinding(context, {
              line: i + 1,
              column: match.index! + 1,
              message: `NEXT_PUBLIC_${varName} exposes a sensitive value to the client bundle. Remove the NEXT_PUBLIC_ prefix and access server-side only.`,
              snippet: line.trim(),
            }),
          );
        }
      }
    }

    return findings;
  }
}
