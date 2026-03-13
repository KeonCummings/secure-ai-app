import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const CODE_FILE = /\.(tsx?|jsx?)$/;
const DTS_FILE = /\.d\.ts$/;

/**
 * Detects useAgent() calls without a tool_whitelist or allowedTools constraint,
 * which means the AI agent has unrestricted access to all registered tools.
 */
export class UnrestrictedToolsRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'ai/unrestricted-tools',
    name: 'Unrestricted Agent Tool Access',
    description: 'AI agent calls should specify allowed tools to limit blast radius',
    severity: 'medium',
    category: 'ai',
    fixable: false,
    engine: 'ast',
  };

  scan(context: RuleContext): Finding[] {
    if (!CODE_FILE.test(context.filePath)) return [];
    if (DTS_FILE.test(context.filePath)) return [];
    if (!context.projectContext.hasFlowstackSdk) return [];

    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();

      // Skip comment lines
      if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue;

      // Detect useAgent() or executeQuery() calls
      const callMatch = line.match(/\b(useAgent|executeQuery)\s*\(/);
      if (!callMatch) continue;

      // Skip if the match is inside a string literal or JSDoc @tag
      if (/@\w+.*\b(useAgent|executeQuery)/.test(trimmed)) continue;

      // Look ahead for tool_whitelist, allowedTools, or tools config
      const block = lines.slice(i, i + 20).join('\n');
      const hasToolRestriction =
        /tool_whitelist|allowedTools|allowed_tools|tools\s*:/i.test(block);

      if (!hasToolRestriction) {
        findings.push(
          this.createFinding(context, {
            line: i + 1,
            message: `${callMatch[1]}() has no tool restrictions. The AI agent can invoke any registered tool. Add a tool_whitelist to limit access.`,
            snippet: line.trim(),
          }),
        );
      }
    }

    return findings;
  }
}
