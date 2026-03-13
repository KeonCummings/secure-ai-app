import { resolve } from 'node:path';
import pc from 'picocolors';
import { installPreCommitHook, removePreCommitHook } from '../../git/hooks.js';

export async function hooksCommand(
  action: 'install' | 'remove',
  options: { path?: string },
) {
  const rootDir = resolve(options.path ?? '.');

  if (action === 'install') {
    const result = installPreCommitHook(rootDir);
    if (result.success) {
      console.log(pc.green(result.message));
    } else {
      console.log(pc.red(result.message));
      process.exit(1);
    }
  } else {
    const result = removePreCommitHook(rootDir);
    if (result.success) {
      console.log(pc.green(result.message));
    } else {
      console.log(pc.red(result.message));
      process.exit(1);
    }
  }
}
