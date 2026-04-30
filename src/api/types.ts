/**
 * @file types.ts
 * @description Shared types for the Milanote API layer
 * @version 0.1.0
 * @created 2026-04-29T00:00:00Z
 * @lastUpdated 2026-04-29T00:00:00Z
 */

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
