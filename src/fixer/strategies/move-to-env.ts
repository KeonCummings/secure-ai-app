import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding, FixResult } from '../../types/index.js';
import type { FixStrategy } from '../types.js';

export class MoveToEnvStrategy implements FixStrategy {
  id = 'move-to-env';
  name = 'Move Secret to .env';

  apply(finding: Finding, rootDir: string): FixResult {
    const filePath = join(rootDir, finding.filePath);
    const envPath = join(rootDir, '.env');

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const line = lines[finding.line - 1];
      if (!line) {
        return { finding, applied: false, error: 'Line not found' };
      }

      const data = finding.fix?.data as { secretType?: string; matchedValue?: string } | undefined;
      const matchedValue = data?.matchedValue;
      if (!matchedValue) {
        return { finding, applied: false, error: 'No matched value to replace' };
      }

      // Generate env var name
      const envVarName = this.generateEnvVarName(data?.secretType ?? 'SECRET');

      // Add to .env
      const envEntry = `${envVarName}=${matchedValue}\n`;
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf-8');
        writeFileSync(envPath, envContent + envEntry);
      } else {
        writeFileSync(envPath, envEntry);
      }

      // Replace in source with process.env reference
      const newLine = line.replace(
        new RegExp(this.escapeRegex(matchedValue)),
        `process.env.${envVarName}`,
      );
      lines[finding.line - 1] = newLine;
      writeFileSync(filePath, lines.join('\n'));

      return {
        finding,
        applied: true,
        diff: `- ${line.trim()}\n+ ${newLine.trim()}`,
      };
    } catch (err) {
      return {
        finding,
        applied: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  preview(finding: Finding, rootDir: string): string {
    const data = finding.fix?.data as { secretType?: string; matchedValue?: string } | undefined;
    const envVarName = this.generateEnvVarName(data?.secretType ?? 'SECRET');
    return `Will move secret to .env as ${envVarName} and replace with process.env.${envVarName}`;
  }

  private generateEnvVarName(secretType: string): string {
    return secretType
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
