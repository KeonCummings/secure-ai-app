import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding, FixResult } from '../../types/index.js';
import type { FixStrategy } from '../types.js';

export class InjectAuthGuardStrategy implements FixStrategy {
  id = 'inject-auth-guard';
  name = 'Wrap Component with AuthGuard';

  apply(finding: Finding, rootDir: string): FixResult {
    const filePath = join(rootDir, finding.filePath);

    try {
      let content = readFileSync(filePath, 'utf-8');

      // Check if already has AuthGuard
      if (content.includes('AuthGuard') || content.includes('useAuthGuard')) {
        return { finding, applied: false, error: 'AuthGuard already present' };
      }

      // Add import at top
      const importStatement = "import { AuthGuard } from '@flowstack/sdk';\n";
      const hasFlowstackImport = content.includes('@flowstack/sdk');

      if (hasFlowstackImport) {
        // Add AuthGuard to existing import
        content = content.replace(
          /import\s*\{([^}]+)\}\s*from\s*['"]@flowstack\/sdk['"]/,
          (match, imports) => {
            const existing = imports.trim();
            return `import { ${existing}, AuthGuard } from '@flowstack/sdk'`;
          },
        );
      } else {
        // Add new import after last import or at top
        const lastImportIdx = content.lastIndexOf('\nimport ');
        if (lastImportIdx >= 0) {
          const lineEnd = content.indexOf('\n', lastImportIdx + 1);
          content =
            content.slice(0, lineEnd + 1) +
            importStatement +
            content.slice(lineEnd + 1);
        } else {
          content = importStatement + content;
        }
      }

      // Find default export and wrap with AuthGuard
      // Handle: export default function Page() { return <div>... }
      const defaultFnMatch = content.match(
        /export\s+default\s+function\s+(\w+)\s*\([^)]*\)\s*\{/,
      );
      if (defaultFnMatch) {
        const fnName = defaultFnMatch[1];
        // Find the return statement and wrap its JSX
        const returnMatch = content.match(
          new RegExp(`(export\\s+default\\s+function\\s+${fnName}[\\s\\S]*?return\\s*\\(?)\\s*(<)`),
        );
        if (returnMatch) {
          content = content.replace(
            returnMatch[0],
            `${returnMatch[1]}\n    <AuthGuard>\n      ${returnMatch[2]}`,
          );
          // Find the last closing tag before the function's closing brace
          // This is a simplified approach — add </AuthGuard> before the return's close
          const closingParen = content.lastIndexOf(');');
          if (closingParen >= 0) {
            content =
              content.slice(0, closingParen) +
              '\n    </AuthGuard>\n  ' +
              content.slice(closingParen);
          }
        }
      }

      writeFileSync(filePath, content);

      return {
        finding,
        applied: true,
        diff: '+ import { AuthGuard } from \'@flowstack/sdk\'\n+ Wrapped return JSX with <AuthGuard>',
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
    return `Will import AuthGuard from @flowstack/sdk and wrap the component's JSX at ${finding.filePath}`;
  }
}
