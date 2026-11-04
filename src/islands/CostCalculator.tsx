import { useId, useState } from "react";
import { m } from "../theme";
import type { Copy } from "../i18n/en";
import type { SiteLocale } from "../lib/links";
import { clampTeam, DEFAULT_TEAM, formatUsd, quotePlans, TOOLS } from "../data/competitors";
import type { ToolId } from "../data/competitors";

interface Props {
  copy: Copy["calculator"];
  toolIds: ToolId[];
  locale: SiteLocale;
}

export default function CostCalculator({ copy: c, toolIds, locale }: Props) {
  const ids = { loc: useId(), emp: useId() };
  const [locations, setLocations] = useState(String(DEFAULT_TEAM.locations));
  const [employees, setEmployees] = useState(String(DEFAULT_TEAM.employeesPerLocation));
  const team = clampTeam({ locations, employeesPerLocation: employees });
  const tools = toolIds.map((id) => TOOLS[id]);
  const checkedOn = tools.map((t) => t.checkedOn).sort().at(-1) ?? "";
  const autoLabel = { yes: c.autoYes, beta: c.autoBeta, no: c.autoNo };

  return (
    <section className={`${m.surface} border ${m.rule.heavy} p-6 sm:p-8`}>
      <h2 className={`${m.text.display} text-2xl font-semibold mb-6`}>{c.title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl mb-8">
        <div>
          <label htmlFor={ids.loc} className={m.label}>{c.locations}</label>
          <input
            id={ids.loc}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className={m.input}
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={ids.emp} className={m.label}>{c.employeesPerLocation}</label>
          <input
            id={ids.emp}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className={m.input}
            value={employees}
            onChange={(e) => setEmployees(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-8">
        {tools.map((tool) => (
          <table key={tool.id} className="w-full text-start border-collapse">
            <caption className={`${m.text.display} text-lg font-semibold text-start mb-2`}>{tool.name}</caption>
            <thead>
              <tr className={`border-b ${m.rule.heavy}`}>
                <th scope="col" className={`${m.text.meta} py-2 pe-4 text-start`}>{c.plan}</th>
                <th scope="col" className={`${m.text.meta} py-2 pe-4 text-start`}>{c.perMonth}</th>
                <th scope="col" className={`${m.text.meta} py-2 text-start`}>{autoLabel.yes.split(":")[0]}</th>
              </tr>
            </thead>
            <tbody>
              {quotePlans(tool, team).map((q, i) => (
                <tr
                  key={`${q.plan}-${i}`}
                  className={`border-b ${m.rule.line} ${q.highlighted ? "font-bold bg-marker/20" : ""} ${q.fits ? "" : "text-ink/50"}`}
                  data-highlighted={q.highlighted || undefined}
                >
                  <th scope="row" className="py-2 pe-4 text-start font-[inherit]">{q.plan}</th>
                  <td className={`${m.text.data} py-2 pe-4`}>
                    {!q.fits ? c.doesNotFit : q.monthlyUsd === null ? c.contactSales : formatUsd(q.monthlyUsd)}
                  </td>
                  <td className="py-2">{autoLabel[q.autoScheduling]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>

      {toolIds.includes("7shifts") && <p className={`${m.text.muted} text-sm mt-6`}>{c.sevenShiftsBeta}</p>}
      <p className={`${m.text.muted} text-sm mt-2`} lang={locale}>{c.footnote.replace("{date}", checkedOn)}</p>
    </section>
  );
}
