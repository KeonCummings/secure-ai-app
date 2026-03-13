import type { Finding, Severity, Category, ProjectContext } from '../types/index.js';

export interface RuleMeta {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  category: Category;
  fixable: boolean;
  engine: 'regex' | 'ast';
}

export interface RuleContext {
  filePath: string;
  content: string;
  projectContext: ProjectContext;
  /** Lazy-loaded ts-morph SourceFile — only available for .ts/.tsx/.js/.jsx files */
  getSourceFile?: () => import('ts-morph').SourceFile;
}

export interface Rule {
  meta: RuleMeta;
  scan(context: RuleContext): Finding[];
}
