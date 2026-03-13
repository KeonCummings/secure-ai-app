import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const SKIP_FILES = /\.(json|env|ya?ml|gitignore|md|mdx|css|svg|png|jpg)$/;

/**
 * Detects credentials, API keys, tokens, or secrets being stored in
 * localStorage or sessionStorage. These are accessible to any JavaScript
 * running on the page, making them trivially exfiltrable via XSS, malicious
 * npm packages, or compromised third-party scripts.
 *
 * Preferred alternatives:
 * - httpOnly cookies (server sets, JS can never read)
 * - In-memory only (React ref / module-level variable)
 */
export class CredentialsInLocalStorageRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'storage/credentials-in-localstorage',
    name: 'Credentials Stored in Browser Storage',
    description: 'Detects API keys, tokens, or secrets stored in localStorage/sessionStorage where XSS can exfiltrate them',
    severity: 'high',
    category: 'storage',
    fixable: false,
    engine: 'regex',
  };

  scan(context: RuleContext): Finding[] {
    if (SKIP_FILES.test(context.filePath)) return [];

    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    // Sensitive key names that indicate credential storage
    const sensitiveKeyPatterns = [
      /api[_-]?key/i,
      /token/i,
      /secret/i,
      /credential/i,
      /password/i,
      /session[_-]?id/i,
      /auth/i,
      /jwt/i,
      /bearer/i,
      /private[_-]?key/i,
    ];

    // Pattern 1: localStorage.setItem('sensitive_key', value)
    // Pattern 2: sessionStorage.setItem('sensitive_key', value)
    const setItemRe = /(localStorage|sessionStorage)\s*\.\s*setItem\s*\(\s*(['"`])([^'"`]+)\2/;

    // Pattern 3: localStorage['sensitive_key'] = value
    // Pattern 4: localStorage.sensitive_key = value
    const directAssignRe = /(localStorage|sessionStorage)\s*(?:\[\s*(['"`])([^'"`]+)\2\s*\]|\.\s*(\w+))\s*=/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check setItem pattern
      const setItemMatch = setItemRe.exec(line);
      if (setItemMatch) {
        const storageType = setItemMatch[1];
        const keyName = setItemMatch[3];

        for (const pattern of sensitiveKeyPatterns) {
          if (pattern.test(keyName)) {
            findings.push(
              this.createFinding(context, {
                line: i + 1,
                message: `${storageType}.setItem() stores sensitive data ("${keyName}"). Browser storage is readable by any script on the page — use httpOnly cookies or in-memory storage instead.`,
                snippet: line.trim(),
              }),
            );
            break;
          }
        }
        continue;
      }

      // Check direct assignment pattern
      const directMatch = directAssignRe.exec(line);
      if (directMatch) {
        const storageType = directMatch[1];
        const keyName = directMatch[3] || directMatch[4];
        if (!keyName) continue;

        for (const pattern of sensitiveKeyPatterns) {
          if (pattern.test(keyName)) {
            findings.push(
              this.createFinding(context, {
                line: i + 1,
                message: `${storageType} stores sensitive data ("${keyName}"). Browser storage is readable by any script on the page — use httpOnly cookies or in-memory storage instead.`,
                snippet: line.trim(),
              }),
            );
            break;
          }
        }
      }
    }

    return findings;
  }
}
