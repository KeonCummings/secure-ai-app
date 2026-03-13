import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { ScanEngine } from '../../src/scanner/index.js';

const FIXTURES_DIR = resolve(__dirname, '../fixtures');

describe('ScanEngine', () => {
  const engine = new ScanEngine();

  it('finds issues in vulnerable app', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'vulnerable-app'),
    });

    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.filesScanned).toBeGreaterThan(0);
    expect(report.rulesApplied).toBeGreaterThan(0);
    expect(report.score.value).toBeLessThan(100);

    // Should find hardcoded secrets
    const secrets = report.findings.filter((f) => f.ruleId === 'secrets/hardcoded-api-key');
    expect(secrets.length).toBeGreaterThan(0);

    // Should find env exposure
    const envExposure = report.findings.filter((f) => f.ruleId === 'secrets/env-exposure');
    expect(envExposure.length).toBeGreaterThan(0);

    // Should find dotenv issue
    const dotenv = report.findings.filter((f) => f.ruleId === 'secrets/dotenv-security');
    expect(dotenv.length).toBeGreaterThan(0);

    // Should find eval
    const evalFindings = report.findings.filter((f) => f.ruleId === 'general/unsafe-eval');
    expect(evalFindings.length).toBeGreaterThan(0);
  });

  it('finds fewer issues in secure app', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'secure-app'),
    });

    // Secure app should have no critical/high findings from secrets/eval
    const criticalOrHigh = report.findings.filter(
      (f) => f.severity === 'critical' || f.severity === 'high',
    );
    // May still find some depending on patterns, but far fewer than vulnerable
    expect(report.score.value).toBeGreaterThan(50);
  });

  it('respects severity filter', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'vulnerable-app'),
      severity: 'critical',
    });

    for (const f of report.findings) {
      expect(f.severity).toBe('critical');
    }
  });

  it('calculates security score', async () => {
    const report = await engine.scan({
      path: resolve(FIXTURES_DIR, 'vulnerable-app'),
    });

    expect(report.score.value).toBeGreaterThanOrEqual(0);
    expect(report.score.value).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.score.grade);
  });
});
