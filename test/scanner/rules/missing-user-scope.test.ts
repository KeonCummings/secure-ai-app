import { describe, it, expect } from 'vitest';
import { MissingUserScopeRule } from '../../../src/scanner/rules/tenant/missing-user-scope.js';
import type { RuleContext } from '../../../src/scanner/types.js';
import type { ProjectContext } from '../../../src/types/index.js';

const flowstackContext: ProjectContext = {
  framework: 'nextjs',
  hasFlowstackSdk: true,
  hasDotEnv: false,
  hasGitIgnore: true,
  rootDir: '/test',
};

const nonFlowstackContext: ProjectContext = {
  ...flowstackContext,
  hasFlowstackSdk: false,
};

function makeContext(
  content: string,
  filePath = 'src/api-client.ts',
  projectContext = flowstackContext,
): RuleContext {
  return { filePath, content, projectContext };
}

describe('MissingUserScopeRule', () => {
  const rule = new MissingUserScopeRule();

  it('detects raw fetch to Flowstack endpoint without X-User-ID', () => {
    const content = `const res = await fetch(\`\${baseUrl}/stream\`, {
  headers: { 'Content-Type': 'application/json' },
});`;
    const findings = rule.scan(makeContext(content));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('high');
    expect(findings[0].ruleId).toBe('tenant/missing-user-scope');
  });

  it('passes raw fetch with X-User-ID', () => {
    const content = `const res = await fetch(\`\${baseUrl}/stream\`, {
  headers: {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
  },
});`;
    const findings = rule.scan(makeContext(content));
    expect(findings).toHaveLength(0);
  });

  it('skips flowstackFetch calls (wrapper handles headers)', () => {
    const content = `const res = await flowstackFetch('/tenants/t1/workspaces', {
  credentials,
});`;
    const findings = rule.scan(makeContext(content));
    expect(findings).toHaveLength(0);
  });

  it('skips non-Flowstack projects', () => {
    const content = `const res = await flowstackFetch('/api/data', {
  headers: { 'Content-Type': 'application/json' },
});`;
    const findings = rule.scan(makeContext(content, 'src/api-client.ts', nonFlowstackContext));
    expect(findings).toHaveLength(0);
  });

  it('skips non-code files', () => {
    const content = `flowstackFetch('/api/data')`;
    const findings = rule.scan(makeContext(content, 'README.md'));
    expect(findings).toHaveLength(0);
  });

  it('exempts auth endpoints (pre-authentication, no user context)', () => {
    const content = `const res = await fetch(\`\${baseUrl}/auth/user\`, {
  headers: { 'Content-Type': 'application/json' },
});`;
    const findings = rule.scan(makeContext(content));
    expect(findings).toHaveLength(0);
  });
});
