import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const HOOK_MARKER = '# secure-ai-app pre-commit hook';

const HOOK_CONTENT = `#!/bin/sh
${HOOK_MARKER}
# Run security scan on staged files before commit

npx secure-ai-app scan --changed-only --severity high

if [ $? -ne 0 ]; then
  echo ""
  echo "\\033[31mSecurity issues found. Fix them or use --no-verify to skip.\\033[0m"
  echo "Run 'secure-ai-app fix' to auto-fix where possible."
  exit 1
fi
`;

export function installPreCommitHook(rootDir: string): { success: boolean; message: string } {
  const hooksDir = join(rootDir, '.git', 'hooks');
  const hookPath = join(hooksDir, 'pre-commit');

  if (!existsSync(join(rootDir, '.git'))) {
    return { success: false, message: 'Not a git repository' };
  }

  if (!existsSync(hooksDir)) {
    mkdirSync(hooksDir, { recursive: true });
  }

  // Check if hook already exists
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf-8');
    if (existing.includes(HOOK_MARKER)) {
      return { success: true, message: 'Hook already installed' };
    }
    // Append to existing hook
    writeFileSync(hookPath, existing + '\n' + HOOK_CONTENT);
    chmodSync(hookPath, '755');
    return { success: true, message: 'Hook appended to existing pre-commit' };
  }

  writeFileSync(hookPath, HOOK_CONTENT);
  chmodSync(hookPath, '755');
  return { success: true, message: 'Pre-commit hook installed' };
}

export function removePreCommitHook(rootDir: string): { success: boolean; message: string } {
  const hookPath = join(rootDir, '.git', 'hooks', 'pre-commit');

  if (!existsSync(hookPath)) {
    return { success: false, message: 'No pre-commit hook found' };
  }

  const content = readFileSync(hookPath, 'utf-8');
  if (!content.includes(HOOK_MARKER)) {
    return { success: false, message: 'Hook not managed by secure-ai-app' };
  }

  // If the entire file is our hook, remove it
  if (content.trim().startsWith('#!/bin/sh\n' + HOOK_MARKER) || content.trim().startsWith('#!/bin/sh\r\n' + HOOK_MARKER)) {
    unlinkSync(hookPath);
    return { success: true, message: 'Pre-commit hook removed' };
  }

  // Otherwise remove our section (from marker through "exit 1\nfi\n")
  const cleaned = content.replace(new RegExp(`\n?${HOOK_MARKER}[\\s\\S]*?exit 1\nfi\n`, 'g'), '');
  writeFileSync(hookPath, cleaned);
  return { success: true, message: 'Hook section removed from pre-commit' };
}
