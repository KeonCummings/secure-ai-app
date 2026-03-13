import { describe, it, expect } from 'vitest';
import { HardcodedSecretsRule } from '../../../src/scanner/rules/secrets/hardcoded-secrets.js';
import type { RuleContext } from '../../../src/scanner/types.js';
import type { ProjectContext } from '../../../src/types/index.js';

const baseContext: ProjectContext = {
  framework: 'nextjs',
  hasFlowstackSdk: true,
  hasDotEnv: false,
  hasGitIgnore: true,
  rootDir: '/test',
};

function makeContext(content: string, filePath = 'src/config.ts'): RuleContext {
  return { filePath, content, projectContext: baseContext };
}

describe('HardcodedSecretsRule', () => {
  const rule = new HardcodedSecretsRule();

  it('detects OpenAI API keys', () => {
    const findings = rule.scan(
      makeContext('const key = "sk-proj-abc123def456ghi789jkl012mno345pqr678";'),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].ruleId).toBe('secrets/hardcoded-api-key');
  });

  it('detects AWS secret keys', () => {
    const findings = rule.scan(
      makeContext('aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG+bPxRfiCY0123456789"'),
    );
    expect(findings).toHaveLength(1);
  });

  it('detects Flowstack sage_ secrets', () => {
    const findings = rule.scan(
      makeContext('const token = "sage_abcdefghijklmnopqrstuvwxyz";'),
    );
    expect(findings).toHaveLength(1);
  });

  it('ignores process.env references', () => {
    const findings = rule.scan(
      makeContext('const key = process.env.API_KEY;'),
    );
    expect(findings).toHaveLength(0);
  });

  it('ignores markdown files', () => {
    const findings = rule.scan(
      makeContext('api_key = "sk-proj-abc123def456ghi789jkl012mno345pqr678"', 'README.md'),
    );
    expect(findings).toHaveLength(0);
  });

  it('skips comment lines', () => {
    const findings = rule.scan(
      makeContext('// const key = "sk-proj-abc123def456ghi789jkl012mno345pqr678";'),
    );
    expect(findings).toHaveLength(0);
  });

  it('ignores .env files', () => {
    const findings = rule.scan(
      makeContext('PASSWORD="supersecretpassword123"', '.env'),
    );
    expect(findings).toHaveLength(0);
  });

  it('ignores .env.local files', () => {
    const findings = rule.scan(
      makeContext('PASSWORD="supersecretpassword123"', '.env.local'),
    );
    expect(findings).toHaveLength(0);
  });

  it('provides fix suggestion', () => {
    const findings = rule.scan(
      makeContext('const key = "sk-proj-abc123def456ghi789jkl012mno345pqr678";'),
    );
    expect(findings[0].fix).toBeDefined();
    expect(findings[0].fix!.strategyId).toBe('move-to-env');
  });

  it('ignores AWS example access key', () => {
    const findings = rule.scan(
      makeContext('placeholder="AKIAIOSFODNN7EXAMPLE"'),
    );
    expect(findings).toHaveLength(0);
  });

  it('ignores AWS example secret key', () => {
    const findings = rule.scan(
      makeContext('aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"'),
    );
    expect(findings).toHaveLength(0);
  });

  it('ignores passwords in test files', () => {
    const findings = rule.scan(
      makeContext('password: "wrongpassword"', 'test-real-api.cjs'),
    );
    expect(findings).toHaveLength(0);
  });

  it('ignores secrets in .test.ts files', () => {
    const findings = rule.scan(
      makeContext('const key = "sk-proj-abc123def456ghi789jkl012mno345pqr678";', 'src/auth.test.ts'),
    );
    expect(findings).toHaveLength(0);
  });
});
