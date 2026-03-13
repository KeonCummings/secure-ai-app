import fg from 'fast-glob';
import ignore from 'ignore';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createIgnore = (ignore as any).default ?? ignore;
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_IGNORE = [
  'node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '.git/**',
  'coverage/**',
  '**/Pods/**',
  '*.min.js',
  '*.map',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

const SCANNABLE_EXTENSIONS = [
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'json', 'env', 'env.*', 'yaml', 'yml',
];

export async function walkFiles(
  rootDir: string,
  additionalExclude: string[] = [],
): Promise<string[]> {
  const ig = createIgnore();

  // Load .gitignore
  const gitignorePath = join(rootDir, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  ig.add(DEFAULT_IGNORE);
  ig.add(additionalExclude);

  const patterns = SCANNABLE_EXTENSIONS.map((ext) => `**/*.${ext}`);
  // Also pick up dotenv files
  patterns.push('**/.env', '**/.env.*');
  // And .gitignore itself (for dotenv-security rule)
  patterns.push('**/.gitignore');

  const files = await fg(patterns, {
    cwd: rootDir,
    absolute: true,
    dot: true,
    followSymbolicLinks: false,
    ignore: DEFAULT_IGNORE.concat(additionalExclude),
  });

  // Apply .gitignore filtering (relative paths)
  return files.filter((f) => {
    const relative = f.slice(rootDir.length + 1);
    return !ig.ignores(relative);
  });
}
