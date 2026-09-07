/**
 * Temporary local preview: skip session gates so the app can be browsed
 * without signing in.
 *
 * Honored only when Next inlines NEXT_PUBLIC_DEV_BYPASS_AUTH=true
 * (default in `next dev`; forced off in production builds).
 */
export function isDevAuthBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
}
