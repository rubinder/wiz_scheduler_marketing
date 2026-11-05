// One source of truth for every competitor fact on the site. Each fact comes
// from that vendor's own pricing page or help center, read on `checkedOn`.
// Re-check before changing a date; do not add a claim with no entry in `sources`.
import type { SiteLocale } from "../lib/links";

export type ToolId = "wiz" | "7shifts" | "deputy" | "homebase" | "wheniwork";
export type AutoScheduling = "yes" | "beta" | "no";

export interface Plan {
  name: string;
  basis: "location" | "user" | "flat" | "quote";
  monthlyUsd: number | null; // list price, monthly billing; null for quote
  annualMonthlyUsd?: number; // per-month price when billed annually
  autoScheduling: AutoScheduling;
  minLocations?: number;
  maxLocations?: number;
  minEmployeesPerLocation?: number;
  maxEmployeesPerLocation?: number;
  maxTotalEmployees?: number;
  minimumMonthlyUsd?: number; // Deputy $30
  extraPer500EmployeesUsd?: number; // Wiz Pro: $1 per 500 above 500
}

export interface ToolText {
  description: string;
  autoScheduling: string;
  preferences: string;
  fairWorkweek: string;
  strengths: string[];
  limitations: string[];
}

export interface Tool {
  id: ToolId;
  name: string;
  checkedOn: string;
  pricingUrl: string;
  plans: Plan[];
  text: Record<SiteLocale, ToolText>;
  sources: { label: Record<SiteLocale, string>; href: string }[];
}

export interface Team {
  locations: number;
  employeesPerLocation: number;
}

export interface PlanQuote {
  plan: string;
  fits: boolean;
  /** What this team pays on the plan; null when it doesn't fit or is sold by quote. */
  monthlyUsd: number | null;
  /**
   * The price at this team's size, ignoring the plan's per-location headcount
   * limits: what a tier that doesn't fit would cost. Null for quote plans, free
   * tiers, and plans ruled out by the location count or company total, where a
   * price for this team would be meaningless.
   */
  wouldBeUsd: number | null;
  autoScheduling: AutoScheduling;
  highlighted: boolean;
}

const CHECKED_ON = "2026-11-04";

export const TOOLS: Record<ToolId, Tool> = {
  wiz: {
    id: "wiz",
    name: "Wiz Scheduler",
    checkedOn: CHECKED_ON,
    pricingUrl: "/pricing",
    plans: [
      { name: "Free", basis: "flat", monthlyUsd: 0, autoScheduling: "yes", maxLocations: 2, maxTotalEmployees: 25 },
      { name: "Pro", basis: "flat", monthlyUsd: 18, autoScheduling: "yes", extraPer500EmployeesUsd: 1 },
    ],
    text: {
      en: {
        description: "Generates the week from availability, roles, skill levels and each employee's preferences",
        autoScheduling: "Normal Generate on every plan; AI Generate is not on Free and is paid from prepaid credits",
        preferences:
          "Preferred days, preferred hours, max hours, shift caps, and who to work with or keep apart. Managers enter them; employees can send their own once preference requests are turned on in Company Settings",
        fairWorkweek: "Minimum rest between shifts, set per location (off until you set it). No notice or premium-pay tracking",
        strengths: [
          "Preferences go into the generator, not into a note the manager has to remember",
          "Any shift that goes against a preference is marked, so you see every compromise",
          "One $18 base price for all locations, with 500 employees included",
          "Importers for 7shifts and Deputy on the paid plan",
          "Employee pages in 19 languages",
        ],
        limitations: [
          "No POS integration or sales forecasting",
          "No tip pooling or payroll processing; check-in is by QR on the paid plan",
          "Fair Workweek support is limited to the rest rule",
        ],
      },
      es: {
        description: "Genera la semana a partir de la disponibilidad, los roles, los niveles de habilidad y las preferencias de cada empleado",
        autoScheduling: "Generación normal en todos los planes; la generación con AI no está en el plan gratuito y se paga con créditos prepagados",
        preferences:
          "Días preferidos, horas preferidas, horas máximas, límites de turnos y con quién trabajar o a quién separar. Los gerentes las ingresan; los empleados pueden enviar las suyas cuando se activan las solicitudes de preferencias en la Configuración de la empresa",
        fairWorkweek: "Descanso mínimo entre turnos, fijado por ubicación (desactivado hasta que lo configuras). Sin seguimiento de avisos ni del pago de primas",
        strengths: [
          "Las preferencias entran al generador, no en una nota que el gerente tiene que recordar",
          "Cada turno que va contra una preferencia queda marcado, así que ves todos los compromisos",
          "Un solo precio base de $18 para todas las ubicaciones, con 500 empleados incluidos",
          "Importadores de 7shifts y Deputy en el plan de pago",
          "Páginas para empleados en 19 idiomas",
        ],
        limitations: [
          "Sin integración con POS ni previsión de ventas",
          "Sin reparto de propinas ni procesamiento de nómina; el registro de entrada es por QR en el plan de pago",
          "El soporte de Fair Workweek se limita a la regla de descanso",
        ],
      },
    },
    sources: [
      { label: { en: "Wiz Scheduler pricing", es: "Precios de Wiz Scheduler" }, href: "/pricing" },
    ],
  },

  "7shifts": {
    id: "7shifts",
    name: "7shifts",
    checkedOn: CHECKED_ON,
    pricingUrl: "https://www.7shifts.com/pricing/",
    plans: [
      { name: "Comp", basis: "location", monthlyUsd: 0, autoScheduling: "no", maxLocations: 1, maxEmployeesPerLocation: 15 },
      { name: "Essentials", basis: "location", monthlyUsd: 49.99, autoScheduling: "beta", maxEmployeesPerLocation: 30 },
      { name: "Premium", basis: "location", monthlyUsd: 149.99, autoScheduling: "beta", maxEmployeesPerLocation: 30 },
      { name: "Pro", basis: "location", monthlyUsd: 99.99, autoScheduling: "beta", minEmployeesPerLocation: 31, maxEmployeesPerLocation: 60 },
      { name: "Premium", basis: "location", monthlyUsd: 199.99, autoScheduling: "beta", minEmployeesPerLocation: 31 },
    ],
    text: {
      en: {
        description: "Per-location scheduling with a beta auto-scheduler and a payroll add-on",
        autoScheduling: "Auto-scheduler in beta, rolling out to selected accounts; drafts from at least six weeks of sales and schedule history",
        preferences: "Uses approved availability and time off. Its documentation does not mention shift or coworker preferences",
        fairWorkweek: "Yes: flags clopens, changes inside 14 days, and premium pay (paid plans)",
        strengths: [
          "NYC Fair Workweek alerts on paid plans",
          "A payroll add-on",
          "Free Comp plan for one location with up to 15 employees",
        ],
        limitations: [
          "Priced per location, so cost grows with every site",
          "The plan depends on headcount per location: Essentials covers up to 30 employees, Pro 31 to 60",
          "Auto-scheduler is a beta and needs six weeks of sales and schedule history",
          "Payroll is an extra $39.99 per location plus $6 per employee",
        ],
      },
      es: {
        description: "Horarios por ubicación con programador automático en beta y complemento de nómina",
        autoScheduling: "Programador automático en beta, que se está habilitando en cuentas seleccionadas; arma el borrador a partir de al menos seis semanas de ventas y horarios",
        preferences: "Usa la disponibilidad y los días libres aprobados. Su documentación no menciona preferencias de turnos ni de compañeros",
        fairWorkweek: "Sí: señala turnos de cierre y apertura seguidos, cambios dentro de 14 días y pago de primas (planes de pago)",
        strengths: [
          "Alertas de Fair Workweek de Nueva York en los planes de pago",
          "Complemento de nómina",
          "Plan Comp gratuito para una ubicación con hasta 15 empleados",
        ],
        limitations: [
          "Se cobra por ubicación, así que el costo crece con cada sede",
          "El plan depende de los empleados por ubicación: Essentials cubre hasta 30, Pro de 31 a 60",
          "El programador automático está en beta y necesita seis semanas de historial de ventas y horarios",
          "La nómina cuesta $39.99 extra por ubicación más $6 por empleado",
        ],
      },
    },
    sources: [
      { label: { en: "7shifts pricing", es: "Precios de 7shifts" }, href: "https://www.7shifts.com/pricing/" },
      { label: { en: "7shifts auto-scheduler", es: "Programador automático de 7shifts" }, href: "https://kb.7shifts.com/hc/en-us/articles/4417505384979" },
      { label: { en: "7shifts Fair Workweek", es: "Fair Workweek en 7shifts" }, href: "https://kb.7shifts.com/hc/en-us/articles/4417504944403" },
    ],
  },

  deputy: {
    id: "deputy",
    name: "Deputy",
    checkedOn: CHECKED_ON,
    pricingUrl: "https://www.deputy.com/pricing",
    plans: [
      { name: "Lite", basis: "user", monthlyUsd: 5.5, annualMonthlyUsd: 5, autoScheduling: "no", minimumMonthlyUsd: 30 },
      { name: "Core", basis: "user", monthlyUsd: 7.25, annualMonthlyUsd: 6.5, autoScheduling: "yes", minimumMonthlyUsd: 30 },
      { name: "Pro", basis: "user", monthlyUsd: 10, annualMonthlyUsd: 9, autoScheduling: "yes", minimumMonthlyUsd: 30 },
    ],
    text: {
      en: {
        description: "Per-user scheduling with auto-scheduling on the Core and Pro plans",
        autoScheduling: "Core and Pro plans; fills shifts by cost, equal hours, or learning from your past schedules",
        preferences: "Its auto-fill documentation does not mention employee shift or coworker preferences",
        fairWorkweek:
          "Yes: the most complete of these tools, including change consent, premiums, notice and rest. Deputy's own docs say NYC fast-food Fair Workweek applies to chains with 30 or more locations nationwide",
        strengths: [
          "The strongest NYC Fair Workweek support of the tools compared here",
          "Auto-fill by cost, equal hours, or learning from your past schedules",
        ],
        limitations: [
          "Priced per user, so cost grows with every hire",
          "$30 monthly minimum on monthly plans, and no free plan",
          "Auto-scheduling is not on the Lite plan",
        ],
      },
      es: {
        description: "Horarios por usuario con programación automática en los planes Core y Pro",
        autoScheduling: "Planes Core y Pro; asigna turnos por costo, por igualdad de horas o aprendiendo de tus horarios anteriores",
        preferences: "Su documentación de asignación automática no menciona preferencias de turnos ni de compañeros",
        fairWorkweek:
          "Sí: la más completa de estas herramientas, con consentimiento para cambios, pago de primas, avisos y descansos. La propia documentación de Deputy indica que Fair Workweek de Nueva York para comida rápida se aplica a cadenas con 30 o más ubicaciones en todo el país",
        strengths: [
          "El mejor soporte de Fair Workweek de Nueva York entre las herramientas comparadas",
          "Asignación automática por costo, por igualdad de horas o aprendiendo de tus horarios anteriores",
        ],
        limitations: [
          "Se cobra por usuario, así que el costo crece con cada contratación",
          "Mínimo de $30 al mes en los planes mensuales y sin plan gratuito",
          "La programación automática no está en el plan Lite",
        ],
      },
    },
    sources: [
      { label: { en: "Deputy pricing", es: "Precios de Deputy" }, href: "https://www.deputy.com/pricing" },
      { label: { en: "Deputy auto-scheduling", es: "Programación automática de Deputy" }, href: "https://help.deputy.com/hc/en-au/articles/4688892429839-Using-Auto-scheduling" },
      { label: { en: "Deputy Fair Workweek", es: "Fair Workweek en Deputy" }, href: "https://help.deputy.com/hc/en-au/articles/8433876310543" },
    ],
  },

  homebase: {
    id: "homebase",
    name: "Homebase",
    checkedOn: CHECKED_ON,
    pricingUrl: "https://www.joinhomebase.com/pricing",
    plans: [
      { name: "Basic", basis: "location", monthlyUsd: 0, autoScheduling: "no", maxLocations: 1, maxEmployeesPerLocation: 10 },
      { name: "Essentials", basis: "location", monthlyUsd: 30, annualMonthlyUsd: 24, autoScheduling: "no" },
      { name: "Plus", basis: "location", monthlyUsd: 70, annualMonthlyUsd: 56, autoScheduling: "yes" },
      { name: "All-in-One", basis: "location", monthlyUsd: 120, annualMonthlyUsd: 96, autoScheduling: "yes" },
    ],
    text: {
      en: {
        description: "Per-location scheduling with a free plan and an AI scheduling assistant from Plus",
        autoScheduling: "AI scheduling assistant from the Plus plan",
        preferences: "Its marketing says it uses availability and preferred shifts",
        fairWorkweek: "We could not find NYC Fair Workweek features",
        strengths: [
          "Free Basic plan for one location with up to 10 employees",
          "AI scheduling assistant that, per its marketing, uses availability and preferred shifts",
        ],
        limitations: [
          "Priced per location",
          "Auto-scheduling needs the Plus plan or higher, listed at $70 per location a month (its site also shows a $0 promotion, which we do not count)",
          "No documented NYC Fair Workweek tools",
        ],
      },
      es: {
        description: "Horarios por ubicación con un plan gratuito y un asistente de horarios con AI desde Plus",
        autoScheduling: "Asistente de horarios con AI desde el plan Plus",
        preferences: "Su publicidad dice que usa la disponibilidad y los turnos preferidos",
        fairWorkweek: "No encontramos funciones de Fair Workweek de Nueva York",
        strengths: [
          "Plan Basic gratuito para una ubicación con hasta 10 empleados",
          "Asistente de horarios con AI que, según su publicidad, usa la disponibilidad y los turnos preferidos",
        ],
        limitations: [
          "Se cobra por ubicación",
          "La programación automática requiere el plan Plus o superior, con precio de lista de $70 por ubicación al mes (su sitio también muestra una promoción de $0, que no contamos)",
          "Sin herramientas documentadas de Fair Workweek de Nueva York",
        ],
      },
    },
    sources: [
      { label: { en: "Homebase pricing", es: "Precios de Homebase" }, href: "https://www.joinhomebase.com/pricing" },
      { label: { en: "Homebase auto-scheduling", es: "Programación automática de Homebase" }, href: "https://www.joinhomebase.com/employee-scheduling/auto-scheduling" },
    ],
  },

  wheniwork: {
    id: "wheniwork",
    name: "When I Work",
    checkedOn: CHECKED_ON,
    pricingUrl: "https://wheniwork.com/pricing",
    plans: [
      { name: "One location", basis: "user", monthlyUsd: 2.5, autoScheduling: "yes", maxLocations: 1 },
      { name: "Multiple locations", basis: "user", monthlyUsd: 5, autoScheduling: "yes", minLocations: 2 },
    ],
    text: {
      en: {
        description: "Per-user scheduling with auto-assign on every plan",
        autoScheduling: "Auto-assign included on every plan",
        preferences: "Can require shifts to overlap at least 70% with an employee's preferred availability and respect max hours. No coworker preferences",
        fairWorkweek: "We could not find NYC Fair Workweek features",
        strengths: [
          "Low per-user price for a single location",
          "Auto-assign included on every plan",
        ],
        limitations: [
          "Priced per user, doubling for multiple locations",
          "No free plan",
          "No coworker preferences",
          "No documented NYC Fair Workweek tools",
        ],
      },
      es: {
        description: "Horarios por usuario con asignación automática en todos los planes",
        autoScheduling: "Asignación automática incluida en todos los planes",
        preferences: "Puede exigir que los turnos coincidan al menos en un 70% con la disponibilidad preferida del empleado y respetar las horas máximas. Sin preferencias de compañeros",
        fairWorkweek: "No encontramos funciones de Fair Workweek de Nueva York",
        strengths: [
          "Precio bajo por usuario para una sola ubicación",
          "Asignación automática incluida en todos los planes",
        ],
        limitations: [
          "Se cobra por usuario, y el precio se duplica con varias ubicaciones",
          "Sin plan gratuito",
          "Sin preferencias de compañeros",
          "Sin herramientas documentadas de Fair Workweek de Nueva York",
        ],
      },
    },
    sources: [
      { label: { en: "When I Work pricing", es: "Precios de When I Work" }, href: "https://wheniwork.com/pricing" },
      { label: { en: "When I Work auto-assign", es: "Asignación automática de When I Work" }, href: "https://help.wheniwork.com/articles/auto-assign-shifts" },
    ],
  },
};

/** Every compare page that exists, linked from each compare page. Add a path once its page ships in en and es. */
export const COMPARE_PATHS: string[] = ["/compare/7shifts", "/compare/7shifts-alternatives"];

export const DEFAULT_TEAM: Team = { locations: 3, employeesPerLocation: 13 };

const MAX_COUNT = 10000;

function toCount(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_COUNT, Math.max(1, Math.floor(n)));
}

export function clampTeam(raw: { locations: unknown; employeesPerLocation: unknown }): Team {
  return { locations: toCount(raw.locations), employeesPerLocation: toCount(raw.employeesPerLocation) };
}

const cents = (n: number): number => Math.round(n * 100) / 100;

function companyFits(plan: Plan, team: Team): boolean {
  const { locations, employeesPerLocation: per } = team;
  return (
    locations >= (plan.minLocations ?? 1) &&
    locations <= (plan.maxLocations ?? Infinity) &&
    locations * per <= (plan.maxTotalEmployees ?? Infinity)
  );
}

function planFits(plan: Plan, team: Team): boolean {
  const per = team.employeesPerLocation;
  return (
    companyFits(plan, team) &&
    per >= (plan.minEmployeesPerLocation ?? 1) &&
    per <= (plan.maxEmployeesPerLocation ?? Infinity)
  );
}

function planPrice(plan: Plan, team: Team): number | null {
  if (plan.basis === "quote" || plan.monthlyUsd === null) return null;
  const { locations, employeesPerLocation: per } = team;
  let price = plan.monthlyUsd;
  if (plan.basis === "location") price *= locations;
  else if (plan.basis === "user") price *= locations * per;
  if (plan.extraPer500EmployeesUsd !== undefined) {
    const extra = Math.max(0, Math.ceil((locations * per - 500) / 500));
    price += extra * plan.extraPer500EmployeesUsd;
  }
  if (plan.minimumMonthlyUsd !== undefined) price = Math.max(price, plan.minimumMonthlyUsd);
  return cents(price);
}

export function quotePlans(tool: Tool, team: Team): PlanQuote[] {
  const quotes: PlanQuote[] = tool.plans.map((plan) => {
    const fits = planFits(plan, team);
    const price = planPrice(plan, team);
    return {
      plan: plan.name,
      fits,
      monthlyUsd: fits ? price : null,
      wouldBeUsd: companyFits(plan, team) && plan.monthlyUsd !== 0 ? price : null,
      autoScheduling: plan.autoScheduling,
      highlighted: false,
    };
  });

  // Highlight exactly one plan: the cheapest fitting paid plan with
  // auto-scheduling (yes or beta). Wiz always highlights Pro.
  const candidates = quotes.filter(
    (p) => p.fits && p.autoScheduling !== "no" && p.monthlyUsd !== null && p.monthlyUsd > 0,
  );
  const pick =
    tool.id === "wiz"
      ? candidates.find((p) => p.plan === "Pro")
      : candidates.reduce<PlanQuote | undefined>(
          (best, p) => (best === undefined || p.monthlyUsd! < best.monthlyUsd! ? p : best),
          undefined,
        );
  if (pick) pick.highlighted = true;
  return quotes;
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const RANGE_WORDS: Record<SiteLocale, {
  perLocation: (range: string) => string;
  locations: (n: number) => string;
  locationsPlus: (n: number) => string;
  upToLocations: (n: number) => string;
  upToEmployees: (n: number) => string;
  upToLocationsAndEmployees: (locations: number, employees: number) => string;
}> = {
  en: {
    perLocation: (r) => `${r} per location`,
    locations: (n) => (n === 1 ? "1 location" : `${n} locations`),
    locationsPlus: (n) => `${n}+ locations`,
    upToLocations: (n) => `up to ${n} locations`,
    upToEmployees: (n) => `up to ${n} employees`,
    upToLocationsAndEmployees: (l, e) => `up to ${l} locations and ${e} employees`,
  },
  es: {
    perLocation: (r) => `${r} por ubicación`,
    locations: (n) => (n === 1 ? "1 ubicación" : `${n} ubicaciones`),
    locationsPlus: (n) => `${n}+ ubicaciones`,
    upToLocations: (n) => `hasta ${n} ubicaciones`,
    upToEmployees: (n) => `hasta ${n} empleados`,
    upToLocationsAndEmployees: (l, e) => `hasta ${l} ubicaciones y ${e} empleados`,
  },
};

/**
 * The team size a plan is for, e.g. "1–30 per location", "31+ per location",
 * "1 location, up to 15 employees", "2+ locations". Null when the plan has no limit.
 */
export function planRange(plan: Plan, locale: SiteLocale): string | null {
  const w = RANGE_WORDS[locale];
  const parts: string[] = [];
  const { minLocations: minL, maxLocations: maxL, minEmployeesPerLocation: minE, maxEmployeesPerLocation: maxE } = plan;

  if (maxL !== undefined && plan.maxTotalEmployees !== undefined && minE === undefined && maxE === undefined) {
    return maxL === 1 ? `${w.locations(1)}, ${w.upToEmployees(plan.maxTotalEmployees)}` : w.upToLocationsAndEmployees(maxL, plan.maxTotalEmployees);
  }
  if (maxL === 1) parts.push(w.locations(1));
  else if (maxL !== undefined) parts.push(w.upToLocations(maxL));
  else if (minL !== undefined && minL > 1) parts.push(w.locationsPlus(minL));

  if (maxL === 1 && minE === undefined && maxE !== undefined) parts.push(w.upToEmployees(maxE));
  else if (maxE !== undefined) parts.push(w.perLocation(`${minE ?? 1}–${maxE}`));
  else if (minE !== undefined) parts.push(w.perLocation(`${minE}+`));
  else if (plan.maxTotalEmployees !== undefined) parts.push(w.upToEmployees(plan.maxTotalEmployees));

  return parts.length > 0 ? parts.join(", ") : null;
}
