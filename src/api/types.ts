/**
 * @file types.ts
 * @description Shared types for the Milanote API layer
 * @version 0.3.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-05-02T15:34:43Z
 *
 * Zod schemas added in v0.2.0 are derived from confirmed shapes observed during the
 * automated probe session on 2026-05-02 (see knowledge/audit/2026-05-02-automated-probe.md).
 *
 * v0.3.0 adds CapturedWsFrame + WsLifecycleEvent for WebSocket capture in src/api/probe.ts,
 * since Milanote's element create/update/delete operations flow over wss://collab.milanote.com
 * rather than HTTP.
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
  capturedWsFrames: CapturedWsFrame[];
  capturedWsEvents: WsLifecycleEvent[];
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
  wsFrameCounts: { sent: number; received: number; total: number };
  wsByUrl: Array<{ url: string; sent: number; received: number }>;
  wsSampleSent: CapturedWsFrame[];
}

// ─── WebSocket capture ───────────────────────────────────────────────────────
// Milanote's collab server (wss://collab.milanote.com) carries all element
// create/update/delete operations — see knowledge/milanote/reference/api/collab-websocket.md
//
// Text frames are stored as-is (truncated at 50 KB).
// Binary frames are base64-encoded into the `payload` field with payloadType='binary'.

export interface CapturedWsFrame {
  /** ms epoch */
  timestamp: number;
  /** Per-connection ID — group frames by this to reconstruct a session */
  wsId: string;
  direction: 'sent' | 'received';
  url: string;
  payload: string;
  payloadType: 'text' | 'binary';
  payloadBytes: number;
  truncated?: boolean;
}

export interface WsLifecycleEvent {
  timestamp: number;
  wsId: string;
  url: string;
  kind: 'open' | 'close' | 'error';
  /** Populated when kind === 'error' */
  error?: string;
}
