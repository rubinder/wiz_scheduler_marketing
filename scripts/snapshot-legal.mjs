// Refreshes src/content/legal/fixture.json from the app API's public GDPR endpoints.
// Run: npm run snapshot:legal    (API_URL overrides the default)
// Before the domain cutover the API still lives at the apex:
//   API_URL=https://wizscheduler.com/api/v1 npm run snapshot:legal
import { writeFileSync } from "node:fs";

const API_URL = process.env.API_URL ?? "https://app.wizscheduler.com/api/v1";
const KINDS = ["privacy-policy", "terms", "dpa"];
const out = {};
for (const kind of KINDS) {
  const res = await fetch(`${API_URL}/gdpr/${kind}`);
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.includes("application/json")) {
    throw new Error(`${kind}: HTTP ${res.status} ${type} — if this is HTML you are on a network that hijacks DNS for wizscheduler.com; retry from another network.`);
  }
  out[kind] = await res.json();
}
out.fetched_at = new Date().toISOString();
writeFileSync("src/content/legal/fixture.json", JSON.stringify(out, null, 2) + "\n");
console.log(`snapshot written for ${KINDS.join(", ")}`);
