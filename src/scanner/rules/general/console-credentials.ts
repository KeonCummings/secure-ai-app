import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const SENSITIVE_NAMES = [
  'password', 'passwd', 'pwd',
  'secret', 'apikey', 'api_key', 'apiSecret', 'api_secret',
  'token', 'accessToken', 'access_token', 'refreshToken', 'refresh_token',
  'credentials', 'privateKey', 'private_key',
  'jwtSecret', 'jwt_secret', 'passwordSecret', 'password_secret',
];

const SKIP_FILES = /\.(json|env|ya?ml|gitignore|md|mdx)$/;

/**
 * Extract template literal interpolations (`${...}`) from a string,
 * then remove all string literal content (single/double/backtick)
 * so only code tokens remain.
 */
function extractCodeTokens(argsContent: string): string {
  // 1. Collect interpolation contents from template literals
  const interpolations: string[] = [];
  const interpRe = /\$\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = interpRe.exec(argsContent)) !== null) {
    interpolations.push(m[1]);
  }

  // 2. Remove all string literals (single-quoted, double-quoted, backtick)
  //    For backticks, keep interpolation expressions but remove the template text
  let stripped = argsContent;
  // Remove single and double quoted strings
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, '');
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, '');
  // Remove backtick strings but preserve interpolation contents
  stripped = stripped.replace(/`(?:[^`\\$]|\\.|\$(?!\{)|\$\{[^}]*\})*`/g, (match) => {
    // Extract just the interpolation expressions
    const parts: string[] = [];
    const re = /\$\{([^}]+)\}/g;
    let im: RegExpExecArray | null;
    while ((im = re.exec(match)) !== null) {
      parts.push(im[1]);
    }
    return parts.join(' ');
  });

  // 3. Remove boolean coercion patterns (!!expr) — these expose true/false, not the actual value
  stripped = stripped.replace(/!!\s*[\w.]+/g, '');

  // 4. Combine: stripped code + interpolation contents
  return stripped + ' ' + interpolations.join(' ');
}

export class ConsoleCredentialsRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'general/console-credentials',
    name: 'Credentials Logged to Console',
    description: 'Detects console.log() calls that may expose sensitive data',
    severity: 'medium',
    category: 'general',
    fixable: false,
    engine: 'regex',
  };

  scan(context: RuleContext): Finding[] {
    if (SKIP_FILES.test(context.filePath)) return [];

    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const consoleMatch = /console\.\w+\s*\((.+)\)/.exec(line);
      if (!consoleMatch) continue;

      const argsContent = consoleMatch[1];
      const codeTokens = extractCodeTokens(argsContent).toLowerCase();

      for (const name of SENSITIVE_NAMES) {
        // Use word boundary check to avoid substring matches in unrelated words
        const nameRe = new RegExp(`(?:^|[^a-z])${name.toLowerCase()}(?:$|[^a-z])`);
        if (nameRe.test(codeTokens)) {
          findings.push(
            this.createFinding(context, {
              line: i + 1,
              message: `console output may contain sensitive data (${name}). Remove or redact before production.`,
              snippet: line.trim(),
            }),
          );
          break;
        }
      }
    }

    return findings;
  }
}
