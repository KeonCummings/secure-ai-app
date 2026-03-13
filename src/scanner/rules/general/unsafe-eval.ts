import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const SKIP_FILES = /\.(json|env|ya?ml|gitignore|md|mdx)$/;

export class UnsafeEvalRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'general/unsafe-eval',
    name: 'Unsafe eval() or new Function()',
    description: 'Detects use of eval() and new Function() which can lead to code injection',
    severity: 'high',
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
      const trimmed = line.trimStart();

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')) continue;

      // Check for eval()
      if (/\beval\s*\(/.test(line)) {
        findings.push(
          this.createFinding(context, {
            line: i + 1,
            message: 'eval() can execute arbitrary code. Use safer alternatives like JSON.parse().',
            snippet: line.trim(),
          }),
        );
      }

      // Check for new Function()
      if (/new\s+Function\s*\(/.test(line)) {
        findings.push(
          this.createFinding(context, {
            line: i + 1,
            message: 'new Function() creates code from strings. This is equivalent to eval().',
            snippet: line.trim(),
          }),
        );
      }
    }

    return findings;
  }
}
