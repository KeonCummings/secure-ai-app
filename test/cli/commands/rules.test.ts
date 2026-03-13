import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RuleRegistry } from '../../../src/scanner/rules/index.js';

describe('rules command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('lists all registered rules', async () => {
    const { rulesCommand } = await import('../../../src/cli/commands/rules.js');
    await rulesCommand();

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');

    const registry = new RuleRegistry();
    const allRules = registry.getAll();

    expect(allRules.length).toBe(10);

    for (const rule of allRules) {
      expect(output).toContain(rule.meta.id);
    }
  });

  it('shows rule count in header', async () => {
    const { rulesCommand } = await import('../../../src/cli/commands/rules.js');
    await rulesCommand();

    const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Available Rules (10)');
  });
});
