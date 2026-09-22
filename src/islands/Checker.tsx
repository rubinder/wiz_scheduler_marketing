import { useId, useState } from "react";
import { m } from "../theme";
import type { Copy } from "../i18n/en";
import { guessMapping, parseCsv, parsePasted, parseXlsx, toShiftRows } from "../lib/checker/parse";
import { buildRequest, checkSchedule, defaultTimezone, MAX_SHIFTS } from "../lib/checker/request";
import type { CheckResponse, ColumnMapping, Finding, ParsedTable } from "../lib/checker/types";

type CheckerCopy = Copy["checker"];

interface Props {
  copy: CheckerCopy;
  apiUrl: string;
  enabled: boolean;
  registerUrl: string;
  sampleUrl: string;
  /** Test seam; production uses the global fetch. */
  fetchImpl?: typeof fetch;
}

type ErrorKey = "errNoRows" | "errMapping" | "errParse" | "errTooMany" | "errBusy" | "errUnavailable";

const EMPTY: ParsedTable = { headers: [], rows: [] };
const UNSET: ColumnMapping = { employee: -1, start: -1, end: -1 };

function fmt(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}

export default function Checker({ copy: c, apiUrl, enabled, registerUrl, sampleUrl, fetchImpl }: Props) {
  const ids = { paste: useId(), file: useId(), emp: useId(), start: useId(), end: useId(), pub: useId(), tz: useId() };
  const [table, setTable] = useState<ParsedTable>(EMPTY);
  const [mapping, setMapping] = useState<ColumnMapping>(UNSET);
  const [publishedAt, setPublishedAt] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);

  if (!enabled) {
    return (
      <div className={`${m.surface} border ${m.rule.heavy} p-8 max-w-2xl`}>
        <h2 className={`${m.text.display} font-display text-2xl font-semibold mb-3`}>{c.comingSoonTitle}</h2>
        <p className={`${m.text.muted} mb-6`}>{c.comingSoonDesc}</p>
        <a href={registerUrl} className={m.btn.primary}>{c.fixCta}</a>
      </div>
    );
  }

  const load = (t: ParsedTable) => {
    setTable(t);
    setMapping(t.headers.length ? guessMapping(t.headers) : UNSET);
    setResult(null);
    setError(null);
  };

  const onPaste = (text: string) => load(text.trim() ? parsePasted(text) : EMPTY);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const lower = file.name.toLowerCase();
      load(lower.endsWith(".xlsx") || lower.endsWith(".xls") ? parseXlsx(await file.arrayBuffer()) : parseCsv(await file.text()));
    } catch {
      load(EMPTY);
      setError("errParse");
    }
  };

  const onCheck = async () => {
    setResult(null);
    if (table.rows.length === 0) return setError("errNoRows");
    if (mapping.employee < 0 || mapping.start < 0 || mapping.end < 0) return setError("errMapping");
    const { rows } = toShiftRows(table, mapping);
    const built = buildRequest(rows, { timezone, publishedAt });
    if (!built.ok) return setError(built.reason === "too_many" ? "errTooMany" : "errNoRows");
    setError(null);
    setBusy(true);
    const out = await checkSchedule(apiUrl, built.request, fetchImpl);
    setBusy(false);
    if (!out.ok) return setError(out.reason === "busy" ? "errBusy" : "errUnavailable");
    setResult(out.data);
  };

  const errorText = error ? c[error].replace("{max}", String(MAX_SHIFTS)) : null;

  const select = (id: string, label: string, key: keyof ColumnMapping) => (
    <div>
      <label htmlFor={id} className={m.label}>{label}</label>
      <select
        id={id}
        className={m.input}
        value={String(mapping[key])}
        onChange={(e) => setMapping({ ...mapping, [key]: Number(e.target.value) })}
      >
        <option value="-1">{c.colUnset}</option>
        {table.headers.map((h, i) => (
          <option key={i} value={String(i)}>{h}</option>
        ))}
      </select>
    </div>
  );

  const findingLine = (f: Finding, i: number) =>
    f.kind === "clopening" ? (
      <li key={i} className={`${m.text.body} text-sm py-2 border-b ${m.rule.grid}`}>
        <span className={`${m.text.meta} !text-marker me-2`}>{c.clopening}</span>
        <span className={m.text.data}>{fmt(f.first.start)}–{fmt(f.first.end)}</span>
        <span className="text-ink/60"> → </span>
        <span className={m.text.data}>{fmt(f.second.start)}–{fmt(f.second.end)}</span>
        <span className="text-ink/70"> · {f.rest_hours} {c.restHours}</span>
      </li>
    ) : (
      <li key={i} className={`${m.text.body} text-sm py-2 border-b ${m.rule.grid}`}>
        <span className={`${m.text.meta} !text-marker me-2`}>{c.shortNotice}</span>
        <span className={m.text.data}>{fmt(f.shift.start)}–{fmt(f.shift.end)}</span>
        <span className="text-ink/70"> · {f.notice_days} {c.noticeDays}</span>
      </li>
    );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
      <form
        className={`${m.surface} border ${m.rule.heavy} p-6 md:p-8 flex flex-col gap-6`}
        onSubmit={(e) => { e.preventDefault(); void onCheck(); }}
      >
        <div>
          <label htmlFor={ids.file} className={m.label}>{c.upload}</label>
          <input id={ids.file} type="file" accept=".csv,.xlsx,.xls,text/csv" className={`${m.input} file:me-3`} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void onFile(f); }} />
          <p className={`${m.text.muted} text-xs mt-1.5`}>{c.uploadHint} <a href={sampleUrl} className={m.btn.link}>{c.sample}</a></p>
        </div>
        <div>
          <label htmlFor={ids.paste} className={m.label}>{c.pasteLabel}</label>
          <textarea id={ids.paste} rows={5} className={`${m.input} font-data text-sm`} placeholder={c.pastePlaceholder} onChange={(e) => onPaste(e.target.value)} />
        </div>

        {table.headers.length > 0 && (
          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className={`${m.text.meta} mb-3`}>{c.mappingTitle}</legend>
            {select(ids.emp, c.colEmployee, "employee")}
            {select(ids.start, c.colStart, "start")}
            {select(ids.end, c.colEnd, "end")}
          </fieldset>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.pub} className={m.label}>{c.publishedLabel}</label>
            <input id={ids.pub} type="date" className={m.input} value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
            <p className={`${m.text.muted} text-xs mt-1.5`}>{c.publishedHint}</p>
          </div>
          <div>
            <label htmlFor={ids.tz} className={m.label}>{c.timezoneLabel}</label>
            <input id={ids.tz} type="text" className={m.input} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>
        </div>

        {errorText && <p role="alert" className={m.alert.error}>{errorText}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className={m.btn.primary} disabled={busy}>{busy ? c.checking : c.check}</button>
        </div>
        <p className={`${m.text.muted} text-xs`}>{c.privacy}</p>
      </form>

      <section aria-live="polite">
        {result && (
          <>
            <h2 className={`${m.text.display} font-display text-3xl font-semibold mb-6`}>{c.resultsTitle}</h2>
            <div className={`grid gap-px sm:grid-cols-3 bg-rule border ${m.rule.line} mb-8`}>
              <div className="bg-newsprint p-5"><div className={`${m.text.data} text-2xl font-semibold`} data-testid="total-employees">{result.totals.employees}</div><div className={`${m.text.meta} mt-1`}>{c.totalEmployees}</div></div>
              <div className="bg-newsprint p-5"><div className={`${m.text.data} text-2xl font-semibold`} data-testid="total-clopenings">{result.totals.clopenings}</div><div className={`${m.text.meta} mt-1`}>{c.totalClopenings}</div></div>
              <div className="bg-newsprint p-5"><div className={`${m.text.data} text-2xl font-semibold`} data-testid="total-short-notice">{result.totals.short_notice}</div><div className={`${m.text.meta} mt-1`}>{c.totalShortNotice}</div></div>
            </div>
            {result.employees.every((e) => e.findings.length === 0) ? (
              <p className={m.alert.success}>{c.noFindings}</p>
            ) : (
              <div className="flex flex-col gap-6">
                {result.employees.filter((e) => e.findings.length > 0).map((e) => (
                  <div key={e.employee} className={`${m.surface} border ${m.rule.line} p-5`}>
                    <h3 className={`${m.text.body} font-medium mb-2`}>{e.employee}</h3>
                    <ul>{e.findings.map(findingLine)}</ul>
                  </div>
                ))}
              </div>
            )}
            <div className={`border ${m.rule.line} p-6 mt-10`}>
              <h3 className={`${m.text.display} font-display text-2xl font-semibold mb-2`}>{c.fixTitle}</h3>
              <p className={`${m.text.muted} mb-6 max-w-[50ch]`}>{c.fixDesc}</p>
              <a href={registerUrl} className={m.btn.primary}>{c.fixCta}</a>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
