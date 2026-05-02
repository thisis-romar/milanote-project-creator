/**
 * @file types.ts
 * @description Shared types for the Milanote API layer
 * @version 0.2.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T00:00:00Z
 *
 * Zod schemas added in v0.2.0 are derived from confirmed shapes observed during the
 * automated probe session on 2026-05-02 (see knowledge/audit/2026-05-02-automated-probe.md).
 */

import { z } from 'zod';

// ─── Link Preview API ────────────────────────────────────────────────────────
// Endpoint: POST https://upload.milanote.com/api/link
// Observed: 2026-05-02 probe session — confirmed shape

export const LinkPreviewRequestSchema = z.object({
  url: z.string().url(),
  elementId: z.string(),
  environmentFolder: z.string().default('p'),
  userId: z.string(),
  locale: z.string().default('en-au'),
});
export type LinkPreviewRequest = z.infer<typeof LinkPreviewRequestSchema>;

export const LinkPreviewProviderSchema = z.object({
  url: z.string(),
  name: z.string(),
  display: z.string(),
});

export const LinkPreviewResponseSchema = z.object({
  image: z.record(z.unknown()).default({}),
  mediaType: z.string(),
  link: z.object({
    url: z.string(),
    title: z.string().optional(),
  }),
  elementType: z.literal('LINK'),
  description: z.string().optional(),
  provider: LinkPreviewProviderSchema.optional(),
});
export type LinkPreviewResponse = z.infer<typeof LinkPreviewResponseSchema>;

// ─── Milanote Element IDs ─────────────────────────────────────────────────────
// Element IDs follow the pattern observed in the DOM: alphanumeric strings like
// "1WjfGy1UBJED9j". They are assigned by the collab server (WebSocket), not HTTP.

export const MilanoteElementIdSchema = z.string().min(1);
export type MilanoteElementId = z.infer<typeof MilanoteElementIdSchema>;

// ─── Collab WebSocket origin note ────────────────────────────────────────────
// All element create/update/delete mutations flow through wss://collab.milanote.com.
// There are no HTTP REST endpoints for these operations in the observed traffic.
// The link preview endpoint above is a side-effect of creating a Link card, not the
// create operation itself.
// See: knowledge/milanote/reference/api/collab-websocket.md

// ─── Probe types ─────────────────────────────────────────────────────────────

/**
 * A single XHR/fetch round-trip captured during a probe session.
 *
 * `responseBody` is truncated at 50KB and may end with `...[truncated]`.
 * `postData` is the raw request body (string or null for GET/etc.).
 */
export interface CapturedRequest {
  timestamp: number;
  method: string;
  url: string;
  pathname: string;
  resourceType: string;
  requestHeaders: Record<string, string>;
  postData: string | null;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  responseTime?: number;
}

export interface ProbeResult {
  startedAt: string;
  endedAt: string;
  totalRequests: number;
  capturedRequests: CapturedRequest[];
}

/**
 * Aggregated summary of a probe session — counts by method, top paths, status histogram.
 */
export interface ProbeSummary {
  totalRequests: number;
  byMethod: Record<string, number>;
  byStatus: Record<string, number>;
  topPaths: Array<{ path: string; count: number; methods: string[] }>;
  candidateMutations: CapturedRequest[];
}
