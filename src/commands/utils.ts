/**
 * @file utils.ts
 * @description Shared pure helpers for command handlers
 * @version 0.1.0
 * @created 2026-05-04T00:00:00Z
 * @lastUpdated 2026-05-04T00:00:00Z
 */

/** Parse `--var key=value` CLI flags into a Record. Splits only on the first `=`. */
export function parseVarFlags(values: string[] | undefined): Record<string, string> {
  if (!values) return {};
  const out: Record<string, string> = {};
  for (const v of values) {
    const eq = v.indexOf('=');
    if (eq < 0) throw new Error(`Invalid --var (expected key=value): ${v}`);
    out[v.slice(0, eq)] = v.slice(eq + 1);
  }
  return out;
}
