import type { Rule } from '../types.js';

// Regex rules (always loaded)
import { HardcodedSecretsRule } from './secrets/hardcoded-secrets.js';
import { EnvExposureRule } from './secrets/env-exposure.js';
import { DotenvSecurityRule } from './secrets/dotenv-security.js';
import { UnsafeEvalRule } from './general/unsafe-eval.js';
import { ConsoleCredentialsRule } from './general/console-credentials.js';

// AST-lite rules (use regex fallback, no heavy ts-morph needed at scan time)
import { MissingAuthGuardRule } from './auth/missing-auth-guard.js';
import { MissingTenantScopeRule } from './tenant/missing-tenant-scope.js';
import { MissingUserScopeRule } from './tenant/missing-user-scope.js';
import { SecretInPromptRule } from './ai/secret-in-prompt.js';
import { UnrestrictedToolsRule } from './ai/unrestricted-tools.js';
import { CredentialsInLocalStorageRule } from './storage/credentials-in-localstorage.js';

const ALL_RULES: Rule[] = [
  new HardcodedSecretsRule(),
  new EnvExposureRule(),
  new DotenvSecurityRule(),
  new UnsafeEvalRule(),
  new ConsoleCredentialsRule(),
  new MissingAuthGuardRule(),
  new MissingTenantScopeRule(),
  new MissingUserScopeRule(),
  new SecretInPromptRule(),
  new UnrestrictedToolsRule(),
  new CredentialsInLocalStorageRule(),
];

export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();

  constructor() {
    for (const rule of ALL_RULES) {
      this.rules.set(rule.meta.id, rule);
    }
  }

  getAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  getById(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  getByCategory(category: string): Rule[] {
    return this.getAll().filter((r) => r.meta.category === category);
  }

  getByEngine(engine: 'regex' | 'ast'): Rule[] {
    return this.getAll().filter((r) => r.meta.engine === engine);
  }

  getEnabled(overrides?: Record<string, 'off' | 'warn' | 'error'>): Rule[] {
    if (!overrides) return this.getAll();
    return this.getAll().filter((r) => overrides[r.meta.id] !== 'off');
  }
}
