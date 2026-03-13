// Public library API
export { ScanEngine } from './scanner/index.js';
export { FixEngine } from './fixer/index.js';
export { RuleRegistry } from './scanner/rules/index.js';
export { detectProjectContext } from './scanner/context.js';
export { walkFiles } from './scanner/file-walker.js';

// Types
export type {
  Finding,
  FixSuggestion,
  ScanReport,
  SecurityScore,
  ScanOptions,
  FixOptions,
  FixResult,
  ProjectConfig,
  ProjectContext,
  Severity,
  Category,
} from './types/index.js';

export type { Rule, RuleMeta, RuleContext } from './scanner/types.js';
