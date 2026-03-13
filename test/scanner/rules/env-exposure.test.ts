import { describe, it, expect } from 'vitest';
import { EnvExposureRule } from '../../../src/scanner/rules/secrets/env-exposure.js';
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
  return { filePath: 'src/config.ts', content, projectContext: baseContext };
}

describe('EnvExposureRule', () => {
  const rule = new EnvExposureRule();

  it('detects NEXT_PUBLIC_ on sensitive vars', () => {
    const findings = rule.scan(
      makeContext('const secret = process.env.NEXT_PUBLIC_JWT_SECRET;'),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('high');
  });

  it('detects NEXT_PUBLIC_PASSWORD_SECRET', () => {
    const findings = rule.scan(
      makeContext('const pwd = process.env.NEXT_PUBLIC_PASSWORD_SECRET;'),
    );
    expect(findings).toHaveLength(1);
  });

  it('allows NEXT_PUBLIC_ on non-sensitive vars', () => {
    const findings = rule.scan(
      makeContext('const mode = process.env.NEXT_PUBLIC_FLOWSTACK_MODE;'),
    );
    expect(findings).toHaveLength(0);
  });
});
