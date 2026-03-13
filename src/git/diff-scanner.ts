import { execSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Returns list of changed files (staged + unstaged) relative to rootDir.
 */
export function getChangedFiles(rootDir: string): string[] {
  try {
    // Staged files
    const staged = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: rootDir,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    // Unstaged modified files
    const unstaged = execSync('git diff --name-only --diff-filter=ACM', {
      cwd: rootDir,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    const unique = [...new Set([...staged, ...unstaged])];
    return unique.map((f) => join(rootDir, f));
  } catch {
    return [];
  }
}
