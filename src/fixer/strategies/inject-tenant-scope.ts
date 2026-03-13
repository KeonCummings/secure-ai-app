import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding, FixResult } from '../../types/index.js';
import type { FixStrategy } from '../types.js';

export class InjectTenantScopeStrategy implements FixStrategy {
  id = 'inject-tenant-scope';
  name = 'Inject Tenant/User Scope Header';

  apply(finding: Finding, rootDir: string): FixResult {
    const filePath = join(rootDir, finding.filePath);
    const data = finding.fix?.data as { header?: string } | undefined;
    const header = data?.header ?? 'X-Tenant-ID';

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const line = lines[finding.line - 1];
      if (!line) {
        return { finding, applied: false, error: 'Line not found' };
      }

      // Find the headers object in the surrounding context
      const surroundingLines = lines.slice(
        Math.max(0, finding.line - 1),
        Math.min(lines.length, finding.line + 15),
      );
      const block = surroundingLines.join('\n');

      // Look for a headers: { } block
      const headersMatch = block.match(/headers\s*:\s*\{/);
      if (headersMatch) {
        // Find the line with headers: { and insert after it
        for (let i = finding.line - 1; i < Math.min(lines.length, finding.line + 15); i++) {
          if (/headers\s*:\s*\{/.test(lines[i])) {
            const indent = lines[i].match(/^\s*/)?.[0] ?? '';
            const envVar = header === 'X-Tenant-ID' ? 'TENANT_ID' : 'USER_ID';
            const insertion = `${indent}  '${header}': process.env.${envVar},`;
            lines.splice(i + 1, 0, insertion);
            writeFileSync(filePath, lines.join('\n'));
            return {
              finding,
              applied: true,
              diff: `+ ${insertion.trim()}`,
            };
          }
        }
      }

      return {
        finding,
        applied: false,
        error: 'Could not locate headers block. Add the header manually.',
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
    const data = finding.fix?.data as { header?: string } | undefined;
    const header = data?.header ?? 'X-Tenant-ID';
    return `Will inject '${header}' header into the API call at line ${finding.line}`;
  }
}
