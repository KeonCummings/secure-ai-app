import type { ProjectConfig } from '../../types/index.js';

const VALID_SEVERITIES = ['critical', 'high', 'medium', 'low'];
const VALID_FORMATS = ['table', 'json', 'sarif'];
const VALID_LEVELS = ['off', 'warn', 'error'];

export function validateConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof config !== 'object' || config === null) {
    return { valid: false, errors: ['Config must be an object'] };
  }

  const c = config as Record<string, unknown>;

  if (c.severity && !VALID_SEVERITIES.includes(c.severity as string)) {
    errors.push(`Invalid severity: ${c.severity}. Must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }

  if (c.format && !VALID_FORMATS.includes(c.format as string)) {
    errors.push(`Invalid format: ${c.format}. Must be one of: ${VALID_FORMATS.join(', ')}`);
  }

  if (c.rules && typeof c.rules === 'object') {
    for (const [key, val] of Object.entries(c.rules as Record<string, string>)) {
      if (!VALID_LEVELS.includes(val)) {
        errors.push(`Invalid level for rule ${key}: ${val}. Must be one of: ${VALID_LEVELS.join(', ')}`);
      }
    }
  }

  if (c.exclude && !Array.isArray(c.exclude)) {
    errors.push('exclude must be an array of glob patterns');
  }

  return { valid: errors.length === 0, errors };
}
