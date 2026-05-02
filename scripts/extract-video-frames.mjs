#!/usr/bin/env node
/**
 * @file extract-video-frames.mjs
 * @description Extract deduplicated keyframes from a Milanote tutorial video using videostil
 * @version 1.0.0
 * @created 2026-05-02T16:25:20Z
 * @lastUpdated 2026-05-02T16:25:20Z
 *
 * Usage: node scripts/extract-video-frames.mjs <video-path> [--slug <name>]
 *
 * Output:
 *   knowledge/milanote/reference/videos/frames/<slug>/frame_00001.png
 *   knowledge/milanote/reference/videos/frames/<slug>/manifest.json
 *
 * Requires: ffmpeg in PATH
 *   Windows: winget install Gyan.FFmpeg
 *   Mac:     brew install ffmpeg
 *
 * Settings tuned for Milanote screen-recordings:
 *   fps=2, threshold=0.01, algo=dp → ~30–80 unique frames per 5–10min tutorial
 */

import { extractFrames } from 'videostil';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node scripts/extract-video-frames.mjs <video-path> [--slug <name>]');
  process.exit(1);
}

const videoPath = args[0];
const slugIdx = args.indexOf('--slug');
const slug = slugIdx >= 0 ? args[slugIdx + 1] : basename(videoPath, extname(videoPath));

const outDir = join('knowledge', 'milanote', 'reference', 'videos', 'frames', slug);
mkdirSync(outDir, { recursive: true });

console.log(`Extracting frames from: ${videoPath}`);
console.log(`Output dir:             ${outDir}`);

const frames = await extractFrames(videoPath, { fps: 2, threshold: 0.01, algo: 'dp' });
console.log(`Unique frames found: ${frames.length}`);

const manifest = [];
for (const frame of frames) {
  const fileName = `frame_${String(frame.index).padStart(5, '0')}.png`;
  writeFileSync(join(outDir, fileName), Buffer.from(frame.base64, 'base64'));
  manifest.push({ fileName, timestamp: frame.timestamp, index: frame.index });
}

writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Done. ${frames.length} frames → ${outDir}/`);
