export const SITE_URL = "https://wizscheduler.com";
export const APP_URL: string = import.meta.env.PUBLIC_APP_URL ?? "https://app.wizscheduler.com";
export const API_URL: string = import.meta.env.PUBLIC_API_URL ?? `${APP_URL}/api/v1`;
export const CHECKER_ENABLED: boolean = import.meta.env.PUBLIC_CHECKER_ENABLED === "true";
export const NYC_PRESET = "nyc-fair-workweek";

/** Absolute link into the app, optionally tagged with a signup preset. */
export function appLink(path: string, preset?: string): string {
  const url = new URL(path, APP_URL);
  if (preset) url.searchParams.set("preset", preset);
  return url.toString();
}
