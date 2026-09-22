// Build-time only: reads process.env directly, so it must not be imported by an island.
import fixture from "../content/legal/fixture.json";
import { LEGAL_API_URL } from "./site";

export type LegalKind = "privacy-policy" | "terms" | "dpa";

export interface Processor {
  name: string;
  purpose: string;
  location: string;
  data_processed?: string;
  safeguards?: string;
}

export interface LegalDoc {
  version: string;
  effective_date: string;
  content: string;
  processors?: Processor[];
}

export type LegalSource = "api" | "fixture";

/** `LEGAL_SOURCE=api` fetches at build time; anything else uses the committed snapshot. */
export function legalSource(env: Record<string, string | undefined> = process.env): LegalSource {
  return env.LEGAL_SOURCE === "api" ? "api" : "fixture";
}

interface Options {
  source?: LegalSource;
  apiUrl?: string;
  fetchImpl?: typeof fetch;
}

export async function getLegal(kind: LegalKind, opts: Options = {}): Promise<LegalDoc> {
  const source = opts.source ?? legalSource();
  if (source === "fixture") return fixture[kind] as LegalDoc;

  const apiUrl = opts.apiUrl ?? LEGAL_API_URL;
  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(`${apiUrl}/gdpr/${kind}`);
  } catch (err) {
    throw new Error(`legal ${kind}: ${String(err)}`);
  }
  if (!res.ok) throw new Error(`legal ${kind}: HTTP ${res.status}`);
  const doc = (await res.json()) as Partial<LegalDoc>;
  if (typeof doc.content !== "string" || typeof doc.version !== "string" || typeof doc.effective_date !== "string") {
    throw new Error(`legal ${kind}: unexpected shape`);
  }
  return doc as LegalDoc;
}
