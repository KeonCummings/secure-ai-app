import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectConfig } from '../../types/index.js';
import { validateConfig } from './schema.js';

const CONFIG_FILENAMES = [
  '.secure-ai-app.json',
  '.secureaiapp.json',
  'secure-ai-app.config.json',
];

export function loadConfig(rootDir: string): ProjectConfig {
  for (const name of CONFIG_FILENAMES) {
    const configPath = join(rootDir, name);
    if (existsSync(configPath)) {
      try {
        const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
        const { valid, errors } = validateConfig(raw);
        if (!valid) {
          console.warn(`Warning: Config validation issues in ${name}:`);
          for (const err of errors) {
            console.warn(`  - ${err}`);
          }
        }
        return raw as ProjectConfig;
      } catch {
        console.warn(`Warning: Could not parse ${name}`);
      }
    }
  }

  return {};
}
