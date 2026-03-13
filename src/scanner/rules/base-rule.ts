import type { Finding } from '../../types/index.js';
import type { Rule, RuleMeta, RuleContext } from '../types.js';

export abstract class BaseRule implements Rule {
  abstract readonly meta: RuleMeta;
  abstract scan(context: RuleContext): Finding[];

  protected createFinding(
    context: RuleContext,
    opts: {
      line: number;
      column?: number;
      message: string;
      snippet?: string;
      fix?: Finding['fix'];
    },
  ): Finding {
    return {
      ruleId: this.meta.id,
      severity: this.meta.severity,
      filePath: context.filePath,
      line: opts.line,
      column: opts.column,
      message: opts.message,
      snippet: opts.snippet,
      fix: opts.fix,
    };
  }
}
