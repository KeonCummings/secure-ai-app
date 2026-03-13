import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AddGitignoreStrategy } from '../../../src/fixer/strategies/add-gitignore.js';
import type { Finding } from '../../../src/types/index.js';

describe('AddGitignoreStrategy', () => {
  const strategy = new AddGitignoreStrategy();
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'secure-ai-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('adds .env patterns to existing .gitignore', () => {
    writeFileSync(join(tmpDir, '.gitignore'), 'node_modules/\n');

    const finding: Finding = {
      ruleId: 'secrets/dotenv-security',
      severity: 'high',
      message: 'test',
      filePath: '.gitignore',
      line: 1,
      fix: {
        description: 'Add .env to .gitignore',
        strategyId: 'add-gitignore',
        data: { patterns: ['.env', '.env.*'] },
      },
    };

    const result = strategy.apply(finding, tmpDir);
    expect(result.applied).toBe(true);

    const content = readFileSync(join(tmpDir, '.gitignore'), 'utf-8');
    expect(content).toContain('.env');
    expect(content).toContain('.env.*');
  });

  it('does not duplicate existing patterns', () => {
    writeFileSync(join(tmpDir, '.gitignore'), 'node_modules/\n.env\n');

    const finding: Finding = {
      ruleId: 'secrets/dotenv-security',
      severity: 'high',
      message: 'test',
      filePath: '.gitignore',
      line: 1,
      fix: {
        description: 'Add .env to .gitignore',
        strategyId: 'add-gitignore',
        data: { patterns: ['.env', '.env.*'] },
      },
    };

    const result = strategy.apply(finding, tmpDir);
    expect(result.applied).toBe(true);

    const content = readFileSync(join(tmpDir, '.gitignore'), 'utf-8');
    // .env should appear once from original + .env.* added
    const envCount = (content.match(/^\.env$/gm) || []).length;
    expect(envCount).toBe(1);
  });
});
