import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, existsSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installPreCommitHook, removePreCommitHook } from '../../src/git/hooks.js';

describe('git hooks', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'secure-ai-hooks-'));
    // Create a fake .git directory
    mkdirSync(join(tmpDir, '.git', 'hooks'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('installs pre-commit hook', () => {
    const result = installPreCommitHook(tmpDir);
    expect(result.success).toBe(true);

    const hookPath = join(tmpDir, '.git', 'hooks', 'pre-commit');
    expect(existsSync(hookPath)).toBe(true);

    const content = readFileSync(hookPath, 'utf-8');
    expect(content).toContain('# secure-ai-app pre-commit hook');
    expect(content).toContain('secure-ai-app scan');
  });

  it('is idempotent — installing twice returns success', () => {
    installPreCommitHook(tmpDir);
    const result = installPreCommitHook(tmpDir);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Hook already installed');
  });

  it('removes installed hook', () => {
    installPreCommitHook(tmpDir);
    const result = removePreCommitHook(tmpDir);
    expect(result.success).toBe(true);

    const hookPath = join(tmpDir, '.git', 'hooks', 'pre-commit');
    expect(existsSync(hookPath)).toBe(false);
  });

  it('returns failure when no hook exists', () => {
    const result = removePreCommitHook(tmpDir);
    expect(result.success).toBe(false);
  });

  it('returns failure for non-git directory', () => {
    const nonGitDir = mkdtempSync(join(tmpdir(), 'secure-ai-nogit-'));
    const result = installPreCommitHook(nonGitDir);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Not a git repository');
    rmSync(nonGitDir, { recursive: true, force: true });
  });
});
