/**
 * JSON for an inline <script type="application/ld+json">. JSON.stringify alone lets a string
 * value close the script element ("</script>") or open an HTML comment; escaping <, > and & as
 * \uXXXX keeps every value inside the JSON string, and U+2028/U+2029 are escaped so the output
 * is also safe wherever it is read as JavaScript. JSON.parse returns the original value.
 */
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const UNSAFE = new RegExp(`[<>&${LS}${PS}]`, "g");

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  [LS]: "\\u2028",
  [PS]: "\\u2029",
};

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(UNSAFE, (c) => ESCAPES[c]);
}
