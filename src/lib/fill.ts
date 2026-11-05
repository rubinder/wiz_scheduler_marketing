/**
 * Fills {placeholders} in a copy string. An unknown key throws, so a typo in
 * copy fails the build rather than printing "{key}" to readers.
 */
export function fill(s: string, vars: Record<string, string | number>, context = "copy"): string {
  return s.replace(/\{([a-zA-Z0-9]+)\}/g, (_, key: string) => {
    if (!(key in vars)) throw new Error(`${context}: no value for {${key}}`);
    return String(vars[key]);
  });
}
