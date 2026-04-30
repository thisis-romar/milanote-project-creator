/**
 * @file assets.ts
 * @description Asset upload abstraction — API path + UI fallback
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 *
 * Phase 4 will implement these. Stubs exist now so the template engine can
 * reference asset cards by their typed interface.
 */

import { existsSync } from 'node:fs';

export interface AssetSource {
  /** Local file path or http(s) URL */
  src: string;
}

export interface UploadedAsset {
  id: string;
  url: string;
}

export type UploadStrategy = 'api' | 'ui';

export interface AssetUploader {
  upload(source: AssetSource): Promise<UploadedAsset>;
  strategy(): UploadStrategy;
}

export function classifySource(src: string): 'url' | 'local' {
  if (/^https?:\/\//i.test(src)) return 'url';
  return 'local';
}

export function assertLocalExists(src: string): void {
  if (classifySource(src) !== 'local') return;
  if (!existsSync(src)) {
    throw new Error(`Asset not found: ${src}`);
  }
}
