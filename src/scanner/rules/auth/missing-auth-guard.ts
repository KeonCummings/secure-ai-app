import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const CODE_FILE = /\.(tsx?|jsx?)$/;

/**
 * Detects route/page components that don't use AuthGuard.
 * Checks default exports in Next.js route files for AuthGuard usage.
 */
export class MissingAuthGuardRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'auth/missing-auth-guard',
    name: 'Missing Auth Guard on Route',
    description: 'Route components should be wrapped with AuthGuard or use useAuthGuard()',
    severity: 'high',
    category: 'auth',
    fixable: true,
    engine: 'ast',
  };

  scan(context: RuleContext): Finding[] {
    if (!CODE_FILE.test(context.filePath)) return [];
    if (!context.projectContext.hasFlowstackSdk) return [];

    // Only check route files
    if (!this.isRouteFile(context.filePath)) return [];

    const content = context.content;

    // Check if file is explicitly marked as public
    if (/\/\/\s*@public|\/\*\s*@public\s*\*\//.test(content)) {
      return [];
    }

    // Check if AuthGuard or useAuthGuard is referenced anywhere
    if (content.includes('AuthGuard') || content.includes('useAuthGuard')) {
      return [];
    }

    // Check if there's a default export (it's a page component)
    const hasDefaultExport =
      /export\s+default\s+/.test(content);

    if (!hasDefaultExport) return [];

    // Find the line of the default export
    const lines = content.split('\n');
    let exportLine = 1;
    for (let i = 0; i < lines.length; i++) {
      if (/export\s+default\s+/.test(lines[i])) {
        exportLine = i + 1;
        break;
      }
    }

    return [
      this.createFinding(context, {
        line: exportLine,
        message:
          'Route component has no AuthGuard. Unauthenticated users can access this page.',
        fix: {
          description: 'Wrap component with AuthGuard',
          strategyId: 'inject-auth-guard',
        },
      }),
    ];
  }

  private isRouteFile(filePath: string): boolean {
    // Next.js App Router: app/**/page.tsx (relative or absolute paths)
    if (/(^|\/)app\/.*\/page\.[tj]sx?$/.test(filePath)) return true;
    // Next.js Pages Router: pages/**/*.tsx (exclude _app, _document, api)
    if (/(^|\/)pages\/(?!_|api\/).*\.[tj]sx?$/.test(filePath)) return true;
    return false;
  }
}
