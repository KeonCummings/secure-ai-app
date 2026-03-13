import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // AWS
  { name: 'AWS Access Key', pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', pattern: /(?:aws_secret_access_key|aws_secret)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/ },

  // OpenAI (sk-... and sk-proj-... formats)
  { name: 'OpenAI API Key', pattern: /sk-(?:proj-)?[A-Za-z0-9]{20,}/ },

  // Flowstack sage_*
  { name: 'Flowstack Secret', pattern: /sage_[A-Za-z0-9]{20,}/ },

  // Generic API key assignments
  { name: 'Generic API Key', pattern: /(?:api[_-]?key|apikey|api[_-]?secret|api[_-]?token)\s*[=:]\s*['"][A-Za-z0-9\-_.]{16,}['"]/ },

  // JWT secrets assigned as string literals
  { name: 'JWT Secret', pattern: /(?:jwt[_-]?secret|jwt[_-]?key)\s*[=:]\s*['"][^'"]{8,}['"]/ },

  // Private keys
  { name: 'Private Key', pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/ },

  // Generic password in code
  { name: 'Hardcoded Password', pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/ },

  // Stripe
  { name: 'Stripe Secret Key', pattern: /sk_(?:live|test)_[0-9a-zA-Z]{24,}/ },

  // GitHub token
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
];

// Files to skip (these commonly contain example/placeholder values)
// Also skip .env files — passwords there ARE environment variables; dotenv-security handles the real risk
const SKIP_FILES = /\.(md|mdx|txt|lock|snap)$|(?:^|[/\\])\.env(?:\.|$)|\.test\.[tj]sx?$|\.spec\.[tj]sx?$|test-.*\.[cm]?js$/;

// Known example/placeholder values that should never be flagged
const EXAMPLE_AWS_KEY = /EXAMPLE$/;

export class HardcodedSecretsRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'secrets/hardcoded-api-key',
    name: 'Hardcoded API Key or Secret',
    description: 'Detects API keys, tokens, and secrets hardcoded in source files',
    severity: 'critical',
    category: 'secrets',
    fixable: true,
    engine: 'regex',
  };

  scan(context: RuleContext): Finding[] {
    if (SKIP_FILES.test(context.filePath)) return [];

    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#') || line.trimStart().startsWith('*')) {
        continue;
      }
      // Skip lines that reference env vars (they're doing it right)
      if (/process\.env\b/.test(line) || /import\.meta\.env\b/.test(line)) {
        continue;
      }

      for (const { name, pattern } of SECRET_PATTERNS) {
        const match = pattern.exec(line);
        if (match) {
          // Skip known AWS example keys
          if (name === 'AWS Access Key' && EXAMPLE_AWS_KEY.test(match[0])) continue;
          if (name === 'AWS Secret Key' && /EXAMPLEKEY['"]?\s*$/.test(match[0])) continue;

          findings.push(
            this.createFinding(context, {
              line: i + 1,
              column: match.index + 1,
              message: `${name} detected in source code. Move to environment variables.`,
              snippet: line.trim(),
              fix: {
                description: `Move ${name.toLowerCase()} to .env file`,
                strategyId: 'move-to-env',
                data: { secretType: name, matchedValue: match[0] },
              },
            }),
          );
          break; // One finding per line
        }
      }
    }

    return findings;
  }
}
