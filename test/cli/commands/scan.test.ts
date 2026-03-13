import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { ScanEngine } from '../../../src/scanner/index.js';
import { formatReport } from '../../../src/cli/output/formatters.js';

const FIXTURES_DIR = resolve(__dirname, '../../fixtures');

describe('scan command integration', () => {
  const engine = new ScanEngine();

  it('finds critical/high issues in vulnerable app and would exit 1', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'vulnerable-app'),
    });

    const hasCritical = report.findings.some(
      (f) => f.severity === 'critical' || f.severity === 'high',
    );
    expect(hasCritical).toBe(true);

    // Should find expected rule IDs
    const ruleIds = new Set(report.findings.map((f) => f.ruleId));
    expect(ruleIds.has('secrets/hardcoded-api-key')).toBe(true);
  });

  it('secure app has better score', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'secure-app'),
    });

    expect(report.score.value).toBeGreaterThan(50);
  });

  it('--format json produces valid JSON', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'vulnerable-app'),
      format: 'json',
    });

    const output = formatReport(report, 'json');
    const parsed = JSON.parse(output);
    expect(parsed.findings).toBeDefined();
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(parsed.score).toBeDefined();
  });

  it('--severity critical returns only critical findings', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'vulnerable-app'),
      severity: 'critical',
    });

    for (const f of report.findings) {
      expect(f.severity).toBe('critical');
    }
  });
});
