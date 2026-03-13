import { describe, it, expect } from 'vitest';
import { UnrestrictedToolsRule } from '../../../src/scanner/rules/ai/unrestricted-tools.js';
import type { RuleContext } from '../../../src/scanner/types.js';
import type { ProjectContext } from '../../../src/types/index.js';

const baseContext: ProjectContext = {
  framework: 'nextjs',
  hasFlowstackSdk: true,
  hasDotEnv: false,
  hasGitIgnore: true,
  rootDir: '/test',
};

function makeContext(content: string): RuleContext {
  return { filePath: 'src/chat.tsx', content, projectContext: baseContext };
}

describe('UnrestrictedToolsRule', () => {
  const rule = new UnrestrictedToolsRule();

  it('detects useAgent without tool restrictions', () => {
    const findings = rule.scan(
      makeContext(`const { sendMessage } = useAgent({
  template: 'support',
  systemPrompt: 'hello',
});`),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('medium');
  });

  it('passes when allowedTools is specified', () => {
    const findings = rule.scan(
      makeContext(`const { sendMessage } = useAgent({
  template: 'support',
  allowedTools: ['search'],
});`),
    );
    expect(findings).toHaveLength(0);
  });

  it('skips non-Flowstack projects', () => {
    const ctx: RuleContext = {
      filePath: 'src/chat.tsx',
      content: 'const x = useAgent({ template: "support" });',
      projectContext: { ...baseContext, hasFlowstackSdk: false },
    };
    expect(rule.scan(ctx)).toHaveLength(0);
  });

  it('skips useAgent in JSDoc comments', () => {
    const findings = rule.scan(
      makeContext(`/**
 * useAgent() hook provides streaming chat.
 * @see useAgent() for details
 */
export function ChatWrapper() {}`),
    );
    expect(findings).toHaveLength(0);
  });

  it('skips useAgent in .d.ts type declarations', () => {
    const ctx: RuleContext = {
      filePath: 'src/hooks/useAgent.d.ts',
      content: 'export declare function useAgent(config: AgentConfig): AgentResult;',
      projectContext: baseContext,
    };
    expect(rule.scan(ctx)).toHaveLength(0);
  });
});
