import { describe, it, expect } from 'vitest';
import { DotenvSecurityRule } from '../../../src/scanner/rules/secrets/dotenv-security.js';
import type { RuleContext } from '../../../src/scanner/types.js';
import type { ProjectContext } from '../../../src/types/index.js';

describe('DotenvSecurityRule', () => {
  const rule = new DotenvSecurityRule();

  it('flags .gitignore missing .env when .env exists', () => {
    const ctx: RuleContext = {
      filePath: '.gitignore',
      content: 'node_modules/\ndist/\n',
      projectContext: {
        framework: 'node',
        hasFlowstackSdk: false,
        hasDotEnv: true,
        hasGitIgnore: true,
        rootDir: '/test',
      },
    };
    const findings = rule.scan(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0].fix?.strategyId).toBe('add-gitignore');
  });

  it('passes when .env is in .gitignore', () => {
    const ctx: RuleContext = {
      filePath: '.gitignore',
      content: 'node_modules/\n.env\n.env.*\n',
      projectContext: {
        framework: 'node',
        hasFlowstackSdk: false,
        hasDotEnv: true,
        hasGitIgnore: true,
        rootDir: '/test',
      },
    };
    expect(rule.scan(ctx)).toHaveLength(0);
  });

  it('skips non-.gitignore files', () => {
    const ctx: RuleContext = {
      filePath: 'src/config.ts',
      content: 'something',
      projectContext: {
        framework: 'node',
        hasFlowstackSdk: false,
        hasDotEnv: true,
        hasGitIgnore: true,
        rootDir: '/test',
      },
    };
    expect(rule.scan(ctx)).toHaveLength(0);
  });
});
