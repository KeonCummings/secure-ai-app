import type { Finding, FixResult } from '../types/index.js';

export interface FixStrategy {
  id: string;
  name: string;
  apply(finding: Finding, rootDir: string): FixResult;
  preview(finding: Finding, rootDir: string): string;
}
