import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const CODE_FILE = /\.(tsx?|jsx?)$/;

/**
 * AST-lite rule: Detects environment variables or secret references
 * inside prompt strings passed to AI agent calls.
 */
export class SecretInPromptRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'ai/secret-in-prompt',
    name: 'Secret in AI Prompt',
    description: 'Detects environment variables or secrets interpolated into AI prompts',
    severity: 'critical',
    category: 'ai',
    fixable: false,
    engine: 'ast',
  };

  scan(context: RuleContext): Finding[] {
    if (!CODE_FILE.test(context.filePath)) return [];

    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    // Track whether we're inside a prompt-like context
    let inPromptContext = false;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect prompt-like assignments
      if (/(?:prompt|systemPrompt|system_prompt|instructions|system)\s*[=:]\s*[`'"$]/.test(line)) {
        inPromptContext = true;
        braceDepth = 0;
      }

      // Also detect executeQuery / useAgent with prompt params
      if (/(?:executeQuery|useAgent|sendMessage)\s*\(/.test(line)) {
        inPromptContext = true;
        braceDepth = 0;
      }

      if (inPromptContext) {
        // Count braces for rough scope tracking
        for (const ch of line) {
          if (ch === '{' || ch === '(' || ch === '[') braceDepth++;
          if (ch === '}' || ch === ')' || ch === ']') braceDepth--;
        }

        // Check for env var interpolation in the prompt
        const envMatch = line.match(/\$\{?\s*process\.env\.([A-Z_]+)\s*\}?/);
        if (envMatch) {
          const varName = envMatch[1];
          const isSensitive =
            /SECRET|PASSWORD|KEY|TOKEN|PRIVATE|JWT|CREDENTIAL/i.test(varName);
          if (isSensitive) {
            findings.push(
              this.createFinding(context, {
                line: i + 1,
                message: `Environment variable ${varName} is interpolated into an AI prompt. Secrets sent to LLMs can be leaked via prompt injection.`,
                snippet: line.trim(),
              }),
            );
          }
        }

        // Check for direct variable references that look like secrets
        const secretVarMatch = line.match(
          /\$\{?\s*(apiKey|secret|password|token|privateKey|jwtSecret|passwordSecret)\s*\}?/i,
        );
        if (secretVarMatch) {
          findings.push(
            this.createFinding(context, {
              line: i + 1,
              message: `Variable "${secretVarMatch[1]}" appears to be a secret interpolated into an AI prompt. Secrets sent to LLMs can be leaked.`,
              snippet: line.trim(),
            }),
          );
        }

        if (braceDepth <= 0) {
          inPromptContext = false;
        }
      }
    }

    return findings;
  }
}
