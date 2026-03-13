import { describe, it, expect } from 'vitest';
import { SecretInPromptRule } from '../../../src/scanner/rules/ai/secret-in-prompt.js';
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
  return { filePath: 'src/agent.ts', content, projectContext: baseContext };
}

describe('SecretInPromptRule', () => {
  const rule = new SecretInPromptRule();

  it('detects env var secrets in prompts', () => {
    const findings = rule.scan(
      makeContext('const prompt = `Use key: ${process.env.API_KEY}`;'),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('critical');
  });

  it('detects JWT_SECRET in prompt', () => {
    const findings = rule.scan(
      makeContext('const systemPrompt = `Auth with ${process.env.JWT_SECRET}`;'),
    );
    expect(findings).toHaveLength(1);
  });

  it('ignores non-sensitive env vars in prompts', () => {
    const findings = rule.scan(
      makeContext('const prompt = `Mode: ${process.env.NODE_ENV}`;'),
    );
    expect(findings).toHaveLength(0);
  });
});
