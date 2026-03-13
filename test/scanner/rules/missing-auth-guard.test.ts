import { describe, it, expect } from 'vitest';
import { MissingAuthGuardRule } from '../../../src/scanner/rules/auth/missing-auth-guard.js';
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
  filePath: string,
  projectContext = flowstackContext,
): RuleContext {
  return { filePath, content, projectContext };
}

describe('MissingAuthGuardRule', () => {
  const rule = new MissingAuthGuardRule();

  it('detects route without AuthGuard', () => {
    const content = `export default function DashboardPage() {
  return <div>Dashboard</div>;
}`;
    const findings = rule.scan(makeContext(content, 'app/dashboard/page.tsx'));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('high');
    expect(findings[0].ruleId).toBe('auth/missing-auth-guard');
  });

  it('passes route with AuthGuard', () => {
    const content = `import { AuthGuard } from '@flowstack/sdk';
export default function DashboardPage() {
  return <AuthGuard><div>Dashboard</div></AuthGuard>;
}`;
    const findings = rule.scan(makeContext(content, 'app/dashboard/page.tsx'));
    expect(findings).toHaveLength(0);
  });

  it('passes route with useAuthGuard', () => {
    const content = `import { useAuthGuard } from '@flowstack/sdk';
export default function DashboardPage() {
  useAuthGuard();
  return <div>Dashboard</div>;
}`;
    const findings = rule.scan(makeContext(content, 'app/dashboard/page.tsx'));
    expect(findings).toHaveLength(0);
  });

  it('skips non-route files', () => {
    const content = `export default function MyComponent() {
  return <div>Not a route</div>;
}`;
    const findings = rule.scan(makeContext(content, 'src/components/MyComponent.tsx'));
    expect(findings).toHaveLength(0);
  });

  it('skips non-Flowstack projects', () => {
    const content = `export default function DashboardPage() {
  return <div>Dashboard</div>;
}`;
    const findings = rule.scan(makeContext(content, 'app/dashboard/page.tsx', nonFlowstackContext));
    expect(findings).toHaveLength(0);
  });

  it('skips routes with // @public annotation', () => {
    const content = `// @public
export default function AboutPage() {
  return <div>About</div>;
}`;
    const findings = rule.scan(makeContext(content, 'app/about/page.tsx'));
    expect(findings).toHaveLength(0);
  });

  it('skips routes with /* @public */ annotation', () => {
    const content = `/* @public */
export default function PrivacyPage() {
  return <div>Privacy</div>;
}`;
    const findings = rule.scan(makeContext(content, 'app/privacy/page.tsx'));
    expect(findings).toHaveLength(0);
  });
});
