export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type Category = 'secrets' | 'auth' | 'tenant' | 'ai' | 'general' | 'storage';

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  filePath: string;
  line: number;
  column?: number;
  snippet?: string;
  fix?: FixSuggestion;
}

export interface FixSuggestion {
  description: string;
  strategyId: string;
  data?: Record<string, unknown>;
}

export interface ScanReport {
  findings: Finding[];
  filesScanned: number;
  rulesApplied: number;
  duration: number;
  score: SecurityScore;
}

export interface SecurityScore {
  value: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ScanOptions {
  path: string;
  severity?: Severity;
  changedOnly?: boolean;
  format?: 'table' | 'json' | 'sarif';
  rules?: string[];
  exclude?: string[];
}

export interface FixOptions {
  path: string;
  dryRun?: boolean;
  interactive?: boolean;
  backup?: boolean;
  rules?: string[];
}

export interface FixResult {
  finding: Finding;
  applied: boolean;
  diff?: string;
  backupPath?: string;
  error?: string;
}

export interface ProjectConfig {
  rules?: Record<string, 'off' | 'warn' | 'error'>;
  exclude?: string[];
  severity?: Severity;
  format?: 'table' | 'json' | 'sarif';
  hooks?: {
    preCommit?: boolean;
  };
}

export interface ProjectContext {
  framework: 'nextjs' | 'react' | 'node' | 'unknown';
  hasFlowstackSdk: boolean;
  hasDotEnv: boolean;
  hasGitIgnore: boolean;
  packageJson?: Record<string, unknown>;
  rootDir: string;
}
