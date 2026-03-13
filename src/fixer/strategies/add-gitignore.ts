import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding, FixResult } from '../../types/index.js';
import type { FixStrategy } from '../types.js';

export class AddGitignoreStrategy implements FixStrategy {
  id = 'add-gitignore';
  name = 'Add Patterns to .gitignore';

  apply(finding: Finding, rootDir: string): FixResult {
    const gitignorePath = join(rootDir, '.gitignore');
    const data = finding.fix?.data as { patterns?: string[] } | undefined;
    const patterns = data?.patterns ?? ['.env', '.env.*', '.env.local'];

    try {
      let content = '';
      if (existsSync(gitignorePath)) {
        content = readFileSync(gitignorePath, 'utf-8');
      }

      const lines = content.split('\n');
      const newPatterns = patterns.filter(
        (p) => !lines.some((l) => l.trim() === p),
      );

      if (newPatterns.length === 0) {
        return { finding, applied: false, error: 'Patterns already in .gitignore' };
      }

      const addition = '\n# Environment files\n' + newPatterns.join('\n') + '\n';
      writeFileSync(gitignorePath, content + addition);

      return {
        finding,
        applied: true,
        diff: `Added to .gitignore:\n${newPatterns.map((p) => `+ ${p}`).join('\n')}`,
      };
    } catch (err) {
      return {
        finding,
        applied: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  preview(finding: Finding, _rootDir: string): string {
    const data = finding.fix?.data as { patterns?: string[] } | undefined;
    const patterns = data?.patterns ?? ['.env', '.env.*', '.env.local'];
    return `Will add to .gitignore: ${patterns.join(', ')}`;
  }
}
