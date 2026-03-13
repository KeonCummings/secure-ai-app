import { describe, it, expect } from 'vitest';
import { ConsoleCredentialsRule } from '../../../src/scanner/rules/general/console-credentials.js';
import type { RuleContext } from '../../../src/scanner/types.js';
import type { ProjectContext } from '../../../src/types/index.js';

const baseContext: ProjectContext = {
  framework: 'node',
  hasFlowstackSdk: false,
  hasDotEnv: false,
  hasGitIgnore: true,
  rootDir: '/test',
};

function makeContext(content: string): RuleContext {
  return { filePath: 'src/debug.ts', content, projectContext: baseContext };
}

describe('ConsoleCredentialsRule', () => {
  const rule = new ConsoleCredentialsRule();

  it('detects console.log with password variable', () => {
    const findings = rule.scan(makeContext('console.log("Password:", password);'));
    expect(findings).toHaveLength(1);
  });

  it('detects console.log with token variable', () => {
    const findings = rule.scan(makeContext('console.log("token:", accessToken);'));
    expect(findings).toHaveLength(1);
  });

  it('detects template literal interpolation with sensitive var', () => {
    const findings = rule.scan(makeContext('console.log(`Auth token: ${token}`);'));
    expect(findings).toHaveLength(1);
  });

  it('detects sensitive variable as standalone argument', () => {
    const findings = rule.scan(makeContext('console.debug(password);'));
    expect(findings).toHaveLength(1);
  });

  it('ignores sensitive keywords inside string literals only', () => {
    const findings = rule.scan(makeContext("console.error('[JWT] Token expired');"));
    expect(findings).toHaveLength(0);
  });

  it('ignores string-only credential mentions in error messages', () => {
    const findings = rule.scan(makeContext("console.error('[Storage] Failed to clear credentials:', error);"));
    expect(findings).toHaveLength(0);
  });

  it('ignores double-quoted string-only mentions', () => {
    const findings = rule.scan(makeContext('console.warn("Invalid password format");'));
    expect(findings).toHaveLength(0);
  });

  it('ignores backtick string without interpolation', () => {
    const findings = rule.scan(makeContext('console.log(`Token validation failed`);'));
    expect(findings).toHaveLength(0);
  });

  it('ignores console.log with safe data', () => {
    const findings = rule.scan(makeContext('console.log("User name:", name);'));
    expect(findings).toHaveLength(0);
  });

  it('ignores boolean coercion with !! operator', () => {
    const findings = rule.scan(makeContext('console.log({ hasApiKey: !!credentials.apiKey });'));
    expect(findings).toHaveLength(0);
  });

  it('still detects direct credential access without !!', () => {
    const findings = rule.scan(makeContext('console.log(credentials.apiKey);'));
    expect(findings).toHaveLength(1);
  });
});
