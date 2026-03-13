import { describe, it, expect } from 'vitest';
import { UnsafeEvalRule } from '../../../src/scanner/rules/general/unsafe-eval.js';
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
  return { filePath: 'src/utils.ts', content, projectContext: baseContext };
}

describe('UnsafeEvalRule', () => {
  const rule = new UnsafeEvalRule();

  it('detects eval()', () => {
    const findings = rule.scan(makeContext('const result = eval(userInput);'));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('high');
  });

  it('detects new Function()', () => {
    const findings = rule.scan(makeContext('const fn = new Function("return " + code);'));
    expect(findings).toHaveLength(1);
  });

  it('ignores eval in comments', () => {
    const findings = rule.scan(makeContext('// eval() is dangerous'));
    expect(findings).toHaveLength(0);
  });

  it('ignores JSON files', () => {
    const ctx: RuleContext = {
      filePath: 'package.json',
      content: '{ "eval": true }',
      projectContext: baseContext,
    };
    expect(rule.scan(ctx)).toHaveLength(0);
  });
});
