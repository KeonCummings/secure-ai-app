# secure-ai-app

Built for teams shipping fast with AI code generation — where the code works but the security review didn't happen.

Scans your codebase for hardcoded secrets, missing auth guards, tenant isolation gaps, unsafe eval, and AI-specific risks like secrets leaking into prompts. Auto-fixes what it can. Blocks commits that fail.

## Install

```bash
npm install -g @secure-ai-app/cli
```

Or run directly:

```bash
npx secure-ai-app scan
```

## Quick Start

```bash
# Initialize config + install pre-commit hook
secure-ai-app init

# Scan your project
secure-ai-app scan

# Auto-fix what's fixable
secure-ai-app fix

# Check your score
secure-ai-app status
```

## What it looks like

```
$ secure-ai-app scan

src/config.ts
  [X] L2 OpenAI API Key detected in source code. Move to environment variables. (secrets/hardcoded-api-key)
  [!] L6 NEXT_PUBLIC_JWT_SECRET exposes a sensitive value to the client bundle. (secrets/env-exposure)

src/agent.ts
  [X] L2 Environment variable API_KEY is interpolated into an AI prompt. (ai/secret-in-prompt)
  [!] L12 eval() can execute arbitrary code. Use safer alternatives. (general/unsafe-eval)
  [~] L5 useAgent() has no tool restrictions. (ai/unrestricted-tools)

src/api-client.ts
  [!] L3 Flowstack API call missing X-User-ID header. (tenant/missing-user-scope)
  [~] L3 Flowstack API call missing X-Tenant-ID header. (tenant/missing-tenant-scope)

Security Score: 0/100 (F) | 3 critical, 5 high, 4 medium
7 files scanned | 10 rules applied | 11ms
```

## Commands

### `scan`

Scan a project for security issues.

```bash
secure-ai-app scan [options]
```

| Flag | Description |
|------|-------------|
| `-p, --path <path>` | Project root directory (default: `.`) |
| `-f, --format <format>` | Output format: `table`, `json`, `sarif` (default: `table`) |
| `-s, --severity <level>` | Minimum severity to report: `critical`, `high`, `medium`, `low` |
| `--changed-only` | Only scan files changed since last commit |
| `-r, --rule <rules...>` | Only run specific rule IDs |

Exits with code 1 if any critical or high findings exist — useful in CI.

```bash
# Only critical issues, as JSON
secure-ai-app scan --severity critical --format json

# Only scan what changed (fast pre-commit check)
secure-ai-app scan --changed-only

# SARIF output for GitHub Code Scanning
secure-ai-app scan --format sarif > results.sarif
```

### `fix`

Auto-fix security issues where a strategy exists.

```bash
secure-ai-app fix [options]
```

| Flag | Description |
|------|-------------|
| `-p, --path <path>` | Project root directory (default: `.`) |
| `--dry-run` | Preview fixes without applying them |
| `-i, --interactive` | Prompt y/N before each fix |
| `--backup` | Create `.bak` files before modifying |
| `-r, --rule <rules...>` | Only fix specific rule IDs |

```bash
# See what would change
secure-ai-app fix --dry-run

# Fix one at a time
secure-ai-app fix --interactive

# Fix everything, keep backups
secure-ai-app fix --backup
```

### `status`

One-line security score summary.

```bash
secure-ai-app status
```

Shows score (0-100, graded A-F), total findings, and how many are auto-fixable.

### `init`

Set up a project: creates `.secure-ai-app.json` config and installs the pre-commit hook.

```bash
secure-ai-app init [options]
```

| Flag | Description |
|------|-------------|
| `-p, --path <path>` | Project root directory (default: `.`) |
| `--no-hooks` | Skip git hook installation |

### `hooks install` / `hooks remove`

Manage the pre-commit hook independently.

```bash
secure-ai-app hooks install
secure-ai-app hooks remove
```

The hook runs `secure-ai-app scan --changed-only --severity high` before each commit. If issues are found, the commit is blocked. Use `--no-verify` to bypass.

## Rules

10 built-in rules across 4 categories:

| ID | Severity | Fixable | What it catches |
|----|----------|---------|-----------------|
| `secrets/hardcoded-api-key` | critical | yes | OpenAI, AWS, Flowstack, and generic API keys/tokens hardcoded in source |
| `secrets/env-exposure` | high | no | `NEXT_PUBLIC_` prefix on sensitive env vars (secrets, passwords, JWTs) |
| `secrets/dotenv-security` | high | yes | `.env` files not listed in `.gitignore` |
| `general/unsafe-eval` | high | no | `eval()` and `new Function()` calls |
| `general/console-credentials` | medium | no | `console.log()` calls that may expose passwords, tokens, or keys |
| `auth/missing-auth-guard` | high | yes | Next.js route components without `AuthGuard` or `useAuthGuard()` |
| `tenant/missing-tenant-scope` | medium | yes | Flowstack API calls missing `X-Tenant-ID` header |
| `tenant/missing-user-scope` | high | yes | Flowstack API calls missing `X-User-ID` header |
| `ai/secret-in-prompt` | critical | no | Environment variables or secrets interpolated into AI prompt strings |
| `ai/unrestricted-tools` | medium | no | AI agent calls without a tool whitelist |

All rules run by default. Seven are universal (secrets, eval, console logging, prompt injection, tool access). Three provide deep SDK-aware analysis for [Flowstack](https://github.com/...) projects — auth guards, tenant scoping, and user scoping — and are automatically skipped in projects that don't use the SDK. Secret detection is context-aware: it skips comments, markdown, and `process.env` references.

## Configuration

`secure-ai-app init` creates `.secure-ai-app.json` in your project root:

```json
{
  "severity": "medium",
  "format": "table",
  "exclude": [
    "node_modules",
    "dist",
    ".next",
    "build",
    "coverage"
  ],
  "hooks": {
    "preCommit": true
  }
}
```

### Options

| Key | Type | Description |
|-----|------|-------------|
| `severity` | `"critical" \| "high" \| "medium" \| "low"` | Minimum severity to report |
| `format` | `"table" \| "json" \| "sarif"` | Default output format |
| `exclude` | `string[]` | Glob patterns to skip |
| `rules` | `Record<string, "off" \| "warn" \| "error">` | Override individual rules |
| `hooks.preCommit` | `boolean` | Whether `init` installs the pre-commit hook |

### Disabling a rule

```json
{
  "rules": {
    "general/console-credentials": "off"
  }
}
```

## CI Integration

### GitHub Actions

```yaml
- name: Security scan
  run: npx secure-ai-app scan --format sarif > results.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

### Pre-commit hook

The hook is installed automatically by `secure-ai-app init`. It runs a fast scan on changed files only:

```bash
npx secure-ai-app scan --changed-only --severity high
```

If it finds critical or high issues, the commit is blocked.

## Programmatic API

The scanner and fixer are also available as a library:

```ts
import { ScanEngine, FixEngine, detectProjectContext } from '@secure-ai-app/cli';

const engine = new ScanEngine();
const report = await engine.scan({
  path: '/path/to/project',
  severity: 'high',
});

console.log(report.score);     // { value: 75, grade: 'B', breakdown: { ... } }
console.log(report.findings);  // Finding[]

const fixer = new FixEngine();
const fixable = fixer.getFixableFindings(report.findings);
const results = fixer.applyAll(fixable, '/path/to/project');
```

## Scoring

Security score starts at 100 and deducts per finding:

| Severity | Deduction |
|----------|-----------|
| Critical | -20 |
| High | -10 |
| Medium | -5 |
| Low | -2 |

Grades: A (90+), B (75+), C (60+), D (40+), F (<40).

## Development

```bash
git clone <repo>
cd secure-ai-app
npm install
npm run build
npm test
```

### Project structure

```
src/
  cli/          CLI commands, config loading, output formatters
  scanner/      Scan engine, file walker, project context detection
    rules/      All 10 rules organized by category
  fixer/        Fix engine + strategies (move-to-env, add-gitignore, inject-auth-guard, inject-tenant-scope)
  git/          Pre-commit hook management, diff scanner
  types/        Shared types
test/
  fixtures/     Two mini projects (vulnerable-app, secure-app) for integration tests
  scanner/      Rule unit tests + scan engine integration test
  fixer/        Fix strategy tests
  cli/          CLI integration tests
  git/          Hook install/remove tests
```

### Adding a rule

1. Create a class extending `BaseRule` in the appropriate `src/scanner/rules/<category>/` directory
2. Implement `meta` (id, severity, category, etc.) and `scan(context: RuleContext): Finding[]`
3. Register it in `src/scanner/rules/index.ts`
4. Add tests in `test/scanner/rules/`
5. Optionally add a fix strategy in `src/fixer/strategies/`

## License

MIT
