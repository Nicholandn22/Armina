/**
 * Centralized debug utility for Armina.
 * - Always logs to console.error in all environments.
 * - Also dispatches a custom DOM event so the DebugPanel can show it live.
 *
 * Usage: debugError("FaucetPage", error)
 */
export function debugError(context: string, error: unknown): void {
  const short = (error as any)?.shortMessage || (error as any)?.message || String(error);
  console.error(`[Armina:${context}]`, error);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("armina:error", {
        detail: { context, short, full: String(error), ts: new Date().toISOString() },
      })
    );
  }
}

/**
 * Log debug info (non-error). Only prints in development OR when ?debug=1 is active.
 */
export function debugLog(context: string, ...args: unknown[]): void {
  const isDebug =
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.search.includes("debug=1"));
  if (isDebug) console.log(`[Armina:${context}]`, ...args);
}
