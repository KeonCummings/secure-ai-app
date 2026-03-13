import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectContext } from '../types/index.js';

export function detectProjectContext(rootDir: string): ProjectContext {
  const ctx: ProjectContext = {
    framework: 'unknown',
    hasFlowstackSdk: false,
    hasDotEnv: false,
    hasGitIgnore: existsSync(join(rootDir, '.gitignore')),
    rootDir,
  };

  // Read package.json
  const pkgPath = join(rootDir, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      ctx.packageJson = pkg;

      const allDeps = {
        ...((pkg.dependencies ?? {}) as Record<string, string>),
        ...((pkg.devDependencies ?? {}) as Record<string, string>),
      };

      // Detect framework
      if (allDeps['next']) {
        ctx.framework = 'nextjs';
      } else if (allDeps['react']) {
        ctx.framework = 'react';
      } else {
        ctx.framework = 'node';
      }

      // Detect Flowstack SDK
      if (allDeps['@flowstack/sdk'] || allDeps['flowstack-sdk']) {
        ctx.hasFlowstackSdk = true;
      }
    } catch {
      // Invalid package.json — skip
    }
  }

  // Check for .env files
  ctx.hasDotEnv =
    existsSync(join(rootDir, '.env')) ||
    existsSync(join(rootDir, '.env.local')) ||
    existsSync(join(rootDir, '.env.production'));

  return ctx;
}
