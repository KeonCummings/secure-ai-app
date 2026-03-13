import type { Finding } from '../../../types/index.js';
import type { RuleMeta, RuleContext } from '../../types.js';
import { BaseRule } from '../base-rule.js';

const CODE_FILE = /\.(tsx?|jsx?)$/;

/**
 * Detects API calls that don't include X-Tenant-ID header.
 *
 * flowstackFetch() is a safe wrapper that injects X-Tenant-ID from credentials,
 * so calls through it are exempt. This rule flags:
 *   - flowstack.*.fetch() calls without the header
 *   - Raw fetch() calls to Flowstack API endpoints without the header
 */
export class MissingTenantScopeRule extends BaseRule {
  readonly meta: RuleMeta = {
    id: 'tenant/missing-tenant-scope',
    name: 'Missing Tenant Scope on API Call',
    description: 'API calls to Flowstack should include X-Tenant-ID header for tenant isolation',
    severity: 'medium',
    category: 'tenant',
    fixable: true,
    engine: 'ast',
  };

  scan(context: RuleContext): Finding[] {
    if (!CODE_FILE.test(context.filePath)) return [];
    if (!context.projectContext.hasFlowstackSdk) return [];

    const findings: Finding[] = [];
    const lines = context.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip flowstackFetch() — the wrapper injects X-Tenant-ID from credentials
      if (/flowstackFetch\s*\(/.test(line)) continue;

      // Flag: flowstack.*.fetch() or raw fetch() to Flowstack API paths
      const isFlowstackDotFetch = /flowstack.*\.fetch\s*\(/.test(line);
      const isRawFetchToApi = /\bfetch\s*\(/.test(line) && this.isFlowstackEndpoint(lines, i);

      if (isFlowstackDotFetch || isRawFetchToApi) {
        const block = lines.slice(i, i + 15).join('\n');
        if (!block.includes('X-Tenant-ID') && !block.includes('x-tenant-id')) {
          findings.push(
            this.createFinding(context, {
              line: i + 1,
              message:
                'Flowstack API call missing X-Tenant-ID header. Data may leak across tenants.',
              snippet: line.trim(),
              fix: {
                description: 'Add X-Tenant-ID header to API call',
                strategyId: 'inject-tenant-scope',
                data: { header: 'X-Tenant-ID' },
              },
            }),
          );
        }
      }
    }

    return findings;
  }

  private isFlowstackEndpoint(lines: string[], index: number): boolean {
    const block = lines.slice(index, index + 5).join('\n');
    return /\/(stream|tenants|upload|datasets|data-sources|conversations)/.test(block)
      || /flowstack|sage-api/.test(block);
  }
}
