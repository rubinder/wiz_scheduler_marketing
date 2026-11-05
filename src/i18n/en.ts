import generated from "./generated/en";
import chrome from "./chrome/en";

const en = {
  ...generated,
  ...chrome,
  footer: {
    ...chrome.footer,
    compareLinks: {
      "/compare/7shifts-alternatives": "7shifts alternatives",
      "/compare/deputy-alternatives": "Deputy alternatives",
      "/best-scheduling-apps-nyc-restaurants": "Best scheduling apps for NYC restaurants",
    },
  },
  notFound: {
    title: "Page not found",
    desc: "That link doesn't go anywhere. The home page does.",
    home: "Back to home",
  },
  legal: {
    englishOnly: "This document is published in English. The English text is the binding version.",
    backHome: "Back to home",
  },
  nyc: {
    metaTitle: "NYC Fair Workweek scheduling software",
    metaDesc:
      "Schedule fast food and retail shifts in New York City with 14-day notice, 11 hours between shifts and change premiums in mind. Free schedule checker included.",
    eyebrow: "New York City",
    title: "Fair Workweek scheduling,",
    titleAccent: "without the fines",
    intro:
      "New York City's Fair Workweek Law sets rules for how fast food and retail employers schedule staff. WizScheduler enforces the rest rule while it builds the schedule and flags the rest.",
    reviewedOn: "Legal summary reviewed on",
    source: "Source: NYC Department of Consumer and Worker Protection (DCWP)",
    sourceUrl: "https://www.nyc.gov/site/dca/workers/workersrights/fastfood-retail-workers.page",
    coveredEyebrow: "01 — Who is covered",
    coveredTitle: "Two industries, two rule sets",
    fastFoodTitle: "Fast food",
    fastFoodDesc:
      "Establishments that serve food or drink for immediate consumption, take orders at a counter, and belong to a chain of 30 or more establishments nationally. Franchisees count.",
    retailTitle: "Retail",
    retailDesc: "Retail businesses with 20 or more employees at retail establishments in New York City.",
    rulesEyebrow: "02 — The rules",
    fastFoodRulesTitle: "Fast food",
    fastFoodRules: [
      { title: "14 days' notice", desc: "Written schedules must be given 14 days before the first shift on them." },
      {
        title: "11 hours between shifts",
        desc: "A closing shift followed by an opening shift with fewer than 11 hours in between is a clopening. It needs the worker's written consent and a $100 premium each time.",
      },
      {
        title: "Change premiums",
        desc: "Changes with less than 14 days' notice cost $10 to $75 per change, depending on how late the change is and whether hours are lost.",
      },
      { title: "Offer hours to current staff first", desc: "Open shifts go to existing employees before new hires." },
    ],
    retailRulesTitle: "Retail",
    retailRules: [
      { title: "72 hours' notice", desc: "Schedules must be given 72 hours before the first shift on them." },
      { title: "No on-call shifts", desc: "Employees cannot be scheduled on call." },
      {
        title: "No late changes",
        desc: "Shifts cannot be cancelled or added with less than 72 hours' notice unless the employee agrees.",
      },
    ],
    premiumsEyebrow: "03 — Change premiums",
    premiumsTitle: "What a late change costs in fast food",
    premiumsNotice: "Notice given",
    premiumsAdded: "Hours added or moved",
    premiumsReduced: "Hours reduced",
    premiums: [
      { notice: "Less than 14 days, at least 7", added: "$10", reduced: "$20" },
      { notice: "Less than 7 days, at least 24 hours", added: "$15", reduced: "$45" },
      { notice: "Less than 24 hours", added: "$15", reduced: "$75" },
    ],
    finesTitle: "Fines",
    finesDesc:
      "$500 per violation per worker for a first violation, up to $750 for a second within two years, and up to $1,000 after that, on top of premiums and damages owed to the worker.",
    productEyebrow: "04 — What WizScheduler does",
    productTitle: "Enforced today, and what is next",
    productRows: [
      {
        title: "11 hours between shifts",
        status: "enforced",
        desc: "Set a minimum rest of 11 hours on a location and every generated schedule, algorithmic or AI, respects it across locations. Same-day split shifts are allowed.",
      },
      {
        title: "Availability, roles and hour caps",
        status: "enforced",
        desc: "Schedules only use hours staff said they can work, in roles they hold, under weekly and daily limits.",
      },
      {
        title: "14-day notice tracking",
        status: "roadmap",
        desc: "Not built yet. The free checker flags shifts inside the notice window today; in-app tracking is planned.",
      },
      {
        title: "Change premium flagging",
        status: "roadmap",
        desc: "Not built yet. Edits to a posted schedule are not costed automatically.",
      },
    ],
    enforced: "Enforced",
    roadmap: "Roadmap",
    ctaEyebrow: "05 — Start",
    ctaTitle: "Check a schedule you already have",
    ctaDesc: "Upload last week's schedule and see every clopening and short-notice shift in seconds. No account needed.",
    ctaChecker: "Open the free checker",
    ctaSignup: "Sign up free",
  },
  compare: {
    eyebrow: "Compare with {competitor}",
    checkedOn: "Competitor details checked on",
    ctaSignup: "Sign up free",
    ctaHome: "Back to home",
    faqTitle: "Frequently asked questions",
    howToTurnOn:
      "Turn on preference requests in Company Settings and your employees can send their preferences for you to approve.",
    related: "More comparisons",
    pages: {
      "/compare/7shifts": "Wiz Scheduler vs 7shifts",
      "/compare/7shifts-alternatives": "7shifts alternatives and pricing compared",
      "/compare/deputy": "Wiz Scheduler vs Deputy",
      "/compare/deputy-alternatives": "Deputy alternatives and pricing compared",
      "/compare/homebase": "Wiz Scheduler vs Homebase",
      "/compare/when-i-work": "Wiz Scheduler vs When I Work",
      "/best-scheduling-apps-nyc-restaurants": "Best scheduling apps for NYC restaurants",
    },
    pricingCaption: "Monthly list prices",
    pricingSources: "Sources",
    pricingHeadings: { plan: "Plan", size: "Team size", price: "Price", autoScheduling: "Auto-scheduling" },
    free: "Free",
    perLocation: "{price} per location a month",
    allLocations: "{price} a month for every location",
    perUser: "{price} per user a month",
    userSize: "Priced per user; {minimum} monthly minimum on monthly billing",
    noLimit: "Per location; no team-size range listed",
    wizProSize: "Unlimited locations; 500 employees included, then {extra} a month per extra 500",
  },
  roundup: {
    metaTitle: "Best scheduling apps for NYC restaurants, compared",
    metaDescription:
      "Five restaurant scheduling apps compared for NYC: auto-scheduling, employee preferences, Fair Workweek support and monthly price for 1 to 3 locations, with sources.",
    eyebrow: "Guide",
    heading: "Best scheduling apps for NYC restaurants",
    intro:
      "Five tools that can build a restaurant's weekly schedule, compared on what a New York owner usually asks. We make Wiz Scheduler, so it is listed first. The order is ours, not a ranking, and every tool gets a fair line on who it is best for.",
    criteriaTitle: "How we compared them",
    criteria: [
      "Auto-scheduling: can the tool draft the week for you, and on which plan?",
      "Employee preferences: do employees' preferred days, hours and coworkers go into the draft?",
      "NYC Fair Workweek: how much help does the tool give with notice, rest and premiums?",
      "Price: the monthly cost for a typical NYC restaurant with 1 to 3 locations.",
    ],
    bestForLabel: "Best for",
    bestFor: {
      wiz: "Wiz Scheduler is best for teams that want employees to have a say.",
      "7shifts": "7shifts is best for restaurants that want Fair Workweek alerts and a payroll add-on, and are happy to try an auto-scheduler that is still a beta.",
      deputy: "Deputy is best for teams that need the strongest NYC Fair Workweek support of the five.",
      homebase: "Homebase is best for a single small location that wants a free plan to start, with AI scheduling on the paid Plus plan.",
      wheniwork: "When I Work is best for a single location that wants a low per-user price with auto-assign on every plan.",
    },
    wizSay:
      "Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings, and a manager approves each request.",
    wizFairWorkweek:
      "Fair Workweek is where Wiz Scheduler is limited: it has only a minimum-rest rule, set per location and off until you set it, with no notice tracking and no premium tracking. Deputy is far stronger here.",
    factLabels: { autoScheduling: "Auto-scheduling", preferences: "Employee preferences", fairWorkweek: "NYC Fair Workweek" },
    price: {
      wiz: "{plan} costs {total} a month for every location, with {included} employees included. AI Generate is not included and is paid from prepaid credits. The free plan covers {freeLocations} locations and {freeEmployees} employees.",
      "7shifts": "{plan} costs {price} per location, so {total} a month for {locations} locations with {employees} employees per location. The tier depends on headcount per location: {plan} covers up to {maxEmployees} employees per location. 7shifts' auto-scheduler is a beta that is rolling out to selected accounts.",
      deputy: "{plan} costs {price} per user a month, so {total} a month for {users} users, counting one user per employee. Monthly plans have a {minimum} minimum.",
      homebase: "{plan} costs {price} per location, so {total} a month for {locations} locations. Homebase's site shows a $0 promotion on {promoPlan}; it is not counted here.",
      wheniwork: "{plan} costs {price} per user a month, so {total} a month for {users} users, counting one user per employee.",
    },
    compareLink: "Full comparison: Wiz Scheduler vs {name}",
    sources: "Sources",
    priceTitle: "What they cost",
    priceNote:
      "Prices are for {locations} locations with {employees} employees each, the top of the 1 to 3 location range. They are list prices on monthly billing, excluding taxes, add-ons and annual discounts, and each tool is priced on its cheapest plan with auto-scheduling. Checked on {date}; vendors change prices, so confirm on their pricing pages.",
    priceBasis:
      "Deputy and When I Work charge per user; their totals are for {users} users, counting one user per employee.",
    priceHeadings: { tool: "Tool", plan: "Plan", total: "Monthly total" },
    fairTitle: "NYC Fair Workweek",
    fairBody:
      "Deputy has the most complete NYC Fair Workweek support of these tools. Deputy's own help article says NYC fast-food Fair Workweek applies to chains with 30 or more locations nationwide, and NYC retail to employers with 20 or more employees.",
    fairArticle: "Deputy's Fair Workweek help article",
    fairNotLegal:
      "This is not legal advice. Check the rules that apply to your business before you pick a tool for compliance.",
    fairWiz: "See what Wiz Scheduler covers on the NYC Fair Workweek page",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Which scheduling app is best for an NYC restaurant?",
        a: "No single app is best for everyone. Deputy has the strongest NYC Fair Workweek support of the five tools we compare. Wiz Scheduler is best for teams that want employees to have a say: managers can enter preferences for everyone, and employees can send their own once preference requests are turned on in Company Settings. 7shifts suits restaurants that want Fair Workweek alerts and a payroll add-on, Homebase suits a single small location that wants to start on a free plan, and When I Work suits a single location that wants a low per-user price with auto-assign on every plan.",
      },
      {
        q: "How much does restaurant scheduling software cost for 1 to 3 locations in NYC?",
        a: "For {locations} locations with {employees} employees each, on monthly billing and excluding taxes, add-ons and annual discounts, using each tool's cheapest plan with auto-scheduling: Wiz Scheduler {wizPlan} {wizTotal} a month; 7shifts {sevenPlan} {sevenTotal} a month at {employees} employees per location, with an auto-scheduler that is a beta; Deputy {deputyPlan} {deputyTotal} a month for {users} users, counting one user per employee; Homebase {homebasePlan} {homebaseTotal} a month, without its $0 promotion; When I Work {wiwPlan} {wiwTotal} a month for {users} users, counting one user per employee. List prices checked on {date}.",
      },
      {
        q: "Which scheduling app helps most with NYC Fair Workweek?",
        a: "Of the five tools we compare, Deputy has the strongest NYC Fair Workweek support, including change consent, premiums, notice and rest. 7shifts has alerts on paid plans. Wiz Scheduler has only an opt-in minimum-rest rule per location, with no notice tracking and no premium tracking. Deputy's own help article says NYC fast-food Fair Workweek applies to chains with 30 or more locations nationwide, and NYC retail to employers with 20 or more employees. This is not legal advice; check the rules that apply to your business.",
      },
      {
        q: "Can employees choose their own shifts in Wiz Scheduler?",
        a: "Employees state preferences, not shifts. Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings, which is off by default, and a manager approves each request. The generator then builds the week around them and marks every shift that goes against a soft preference.",
      },
    ],
    ctaTitle: "Try Wiz Scheduler free",
    ctaBody:
      "Turn on preference requests in Company Settings and your employees can send their preferences for you to approve.",
    ctaSignup: "Sign up free",
  },
  checker: {
    metaTitle: "Free NYC Fair Workweek schedule checker",
    metaDesc:
      "Upload a shift schedule and find every clopening and short-notice shift under NYC's Fair Workweek Law. Free, no account, nothing stored.",
    eyebrow: "Free tool",
    title: "Check a schedule for",
    titleAccent: "clopenings",
    intro:
      "Upload a CSV or spreadsheet, or paste rows from one. We check for fewer than 11 hours between shifts and, if you tell us when the schedule was posted, for shifts inside the 14-day notice window.",
    comingSoonTitle: "Almost ready",
    comingSoonDesc: "The checker opens shortly. Sign up free and generate a compliant schedule in the app now.",
    upload: "Choose a file",
    uploadHint: "CSV or XLSX with employee, start and end columns.",
    pasteLabel: "Or paste rows from a spreadsheet",
    pastePlaceholder: "Employee\tStart\tEnd\nA.B.\t2026-10-05 16:00\t2026-10-06 00:00",
    sample: "Download a sample file",
    mappingTitle: "Confirm the columns",
    colEmployee: "Employee",
    colStart: "Shift start",
    colEnd: "Shift end",
    colUnset: "— choose —",
    publishedLabel: "Schedule posted on (optional)",
    publishedHint: "Enables the 14-day notice check.",
    timezoneLabel: "Timezone",
    check: "Check schedule",
    privacy:
      "Rows are sent to WizScheduler's API for evaluation and are not stored. You can replace names with initials first.",
    errNoRows: "No shift rows found. The file needs a header row plus at least one shift.",
    errMapping: "Pick a column for employee, start and end.",
    errParse: "Couldn't read that file. Export it as CSV or XLSX and try again.",
    errTooMany: "That's more than {max} shifts. Split the file and check each part.",
    errBusy: "The checker is busy. Try again in a minute.",
    errUnavailable: "Couldn't check right now. Try again later.",
    checking: "Checking…",
    skippedRows: "{n} rows skipped: missing employee, start or end.",
    resultsTitle: "Results",
    totalEmployees: "employees checked",
    totalClopenings: "clopenings",
    totalShortNotice: "short-notice shifts",
    noFindings: "No clopenings or short-notice shifts found.",
    clopening: "Clopening",
    shortNotice: "Short notice",
    restHours: "hours of rest",
    noticeDays: "days' notice",
    fixTitle: "Fix this schedule automatically",
    fixDesc: "WizScheduler builds schedules that respect the 11-hour rule from the start.",
    fixCta: "Sign up free",
  },
  calculator: {
    title: "What would it cost for your team?",
    locations: "Locations",
    employeesPerLocation: "Employees per location",
    plan: "Plan",
    perMonth: "per month",
    doesNotFit: "Doesn't fit your team",
    contactSales: "Contact sales",
    autoSchedulingHeader: "Auto-scheduling",
    autoYes: "Yes",
    autoBeta: "Beta",
    autoNo: "No",
    highlightedLabel: "Cheapest with auto-scheduling",
    footnote:
      "List prices on monthly billing, in US dollars. Taxes, add-ons and annual discounts are not included. Prices checked on {date}; vendors change them, so confirm on their pricing pages.",
    sevenShiftsBeta: "7shifts' auto-scheduler is a beta that is rolling out to selected accounts.",
  },
  alternatives: {
    eyebrow: "Alternatives",
    heroHeadline: "The schedule your team had a say in.",
    heroQualifier:
      "Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings.",
    checkedOn: "Prices and features checked on {date}. See the sources under each tool.",
    tableEyebrow: "Side by side",
    tableTitle: "Feature comparison",
    tableHeadings: {
      tool: "Tool",
      autoScheduling: "Auto-scheduling",
      preferences: "Employee preferences",
      fairWorkweek: "NYC Fair Workweek",
      pricing: "Pricing",
    },
    exampleEyebrow: "Worked example",
    exampleTitle: "{locations} locations, {employees} employees per location",
    exampleNote:
      "Monthly list prices on {date} for {locations} locations with {employees} employees per location, before taxes, add-ons and annual discounts. Every plan is listed with the team size it is for. Plans that don't fit this team are marked, with what they would cost at this size where that makes sense; the highlighted plan is each tool's cheapest fitting plan with auto-scheduling.",
    exampleSevenShifts:
      "7shifts sets the plan by headcount per location. With {employees} employees per location, each location fits Essentials or Premium (up to {essentialsMaxEmployees} employees each), not Pro ({proMinEmployees} to {proMaxEmployees}).",
    exampleDeputy:
      "Deputy charges per user, counted here as one user per employee: {users} users. Monthly plans have a {deputyMinimum} minimum a month, and Lite has no auto-scheduling.",
    exampleWiz: "Wiz Scheduler Pro is one base price for every location. AI Generate is paid from prepaid credits if you use it.",
    exampleHeadings: { plan: "Plan", price: "Per month", how: "How it adds up", autoScheduling: "Auto-scheduling" },
    perLocation: "{count} locations × {price}",
    perUser: "{count} employees × {price}",
    flat: "One price for all locations",
    breakdownEyebrow: "Detailed",
    breakdownTitle: "Tool by tool",
    strengths: "Strengths",
    limitations: "Limitations",
    sources: "Sources",
    differencesEyebrow: "Why Wiz Scheduler",
    differencesTitle: "What is different",
    differences: [
      {
        title: "Your team has a say",
        body: "Managers can record each employee's preferred days, preferred hours, weekly hour limit, a weekly cap on shifts in a given time range, and who they work well with or should be kept apart from. Turn on preference requests in Company Settings and your employees can send their preferences for you to approve. The generator builds the week around them: a firm preference keeps someone off a shift entirely, a softer one makes them a less likely pick.",
      },
      {
        title: "So you fix less",
        body: "Because the preferences are already in the draft, there is less to rearrange after it is generated. When a preference can't be met, that shift is marked, so you see every compromise. A shift nobody can take without breaking a firm rule is left open rather than forced. You still review the week; you start from what your team asked for.",
      },
      {
        title: "One price for every location",
        body: "Pro is {wizPro} a month for all your locations, with 500 employees, 50 manager seats and 25 schedule generations included, and small metered charges above those. 7shifts charges per location and Deputy per user. AI Generate is optional and paid from prepaid credits.",
      },
      {
        title: "Rest between shifts, and where we stop",
        body: "Set a minimum rest, such as 11 hours, on a location and no generated schedule will break it. The rule is off until you set it, and it is the extent of our Fair Workweek support: we don't track advance notice or premium pay. If you need those, 7shifts and Deputy do more here.",
      },
      {
        title: "Bring your team over",
        body: "The paid plan imports locations, roles, employees and availability from 7shifts or Deputy with an API token from your account there. Preferences and coworker relationships are not imported, so you add those in Wiz Scheduler.",
      },
      {
        title: "Names stay private",
        body: "Employee names are replaced with stand-ins before anything is sent to the AI model.",
      },
    ],
    faqTitle: "Frequently asked questions",
    ctaTitle: "Try it on your own team",
    ctaBody:
      "The free plan covers {wizFreeLocations} locations and {wizFreeEmployees} employees, with one schedule per location a month. AI Generate is on Pro, paid from prepaid credits.",
    ctaSignup: "Start free",
    checkerLink: "Try the free schedule checker",
    "7shifts": {
      title: "7shifts Alternatives and 7shifts Pricing Compared | Wiz Scheduler",
      metaDescription:
        "7shifts pricing next to Deputy, Homebase, When I Work and Wiz Scheduler: every plan that fits your team, how each tool auto-schedules, whether it uses employee preferences, and NYC Fair Workweek support.",
      heading: "7shifts alternatives",
      intro:
        "7shifts prices each location by its headcount, and its auto-scheduler, a beta for selected accounts, drafts from sales and schedule history. If you are weighing alternatives, here is how five tools compare on price, auto-scheduling, employee preferences and NYC Fair Workweek, with prices from each vendor's own site.",
      compareLink: "Wiz Scheduler vs 7shifts",
      faq: [
        {
          q: "How much does 7shifts cost?",
          a: "7shifts charges per location per month, and the plan depends on headcount per location. Comp is free for one location with up to {compMaxEmployees} employees. With 1 to {essentialsMaxEmployees} employees per location, Essentials is {essentials} and Premium {premium}. With {proMinEmployees} or more, Pro is {pro} (up to {proMaxEmployees} employees) and Premium {premiumLarge}. Annual billing takes 10% off. These are list prices from 7shifts' own pricing page.",
        },
        {
          q: "Which 7shifts plan fits {employees} employees per location?",
          a: "Essentials ({essentials} per location a month) or Premium ({premium}), since both cover up to {essentialsMaxEmployees} employees per location. With {locations} such locations, the total is {sevenShiftsExampleTotal} a month on {sevenShiftsExamplePlan}.",
        },
        {
          q: "Does 7shifts auto-schedule?",
          a: "Its auto-scheduler is a beta that is rolling out to selected accounts. It drafts from at least six weeks of sales and schedule history and checks availability. Its documentation does not mention shift or coworker preferences.",
        },
        {
          q: "Can employees give their own preferences in Wiz Scheduler?",
          a: "Yes. Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings, and a manager approves each request. Preference requests are off by default.",
        },
        {
          q: "Is Wiz Scheduler a good fit for NYC Fair Workweek?",
          a: "Only for the rest rule. Wiz Scheduler enforces a minimum rest between shifts, set per location and off until you set it. It does not track advance notice or premium pay. 7shifts flags clopens, changes inside 14 days and premium pay on its paid plans, and Deputy has the most complete support of the tools compared here.",
        },
        {
          q: "Can I bring my data over from 7shifts?",
          a: "On the paid plan, Wiz Scheduler imports companies, locations, departments, roles, employees and their assignments from 7shifts with an API token from your 7shifts account. A separate import brings over weekly availability, unavailability and approved time off. Preferences and coworker relationships are not imported.",
        },
      ],
    },
    deputy: {
      title: "Deputy Alternatives and Deputy Pricing Compared | Wiz Scheduler",
      metaDescription:
        "Deputy pricing next to 7shifts, Homebase, When I Work and Wiz Scheduler: every plan that fits your team, how each tool auto-schedules, whether it uses employee preferences, and NYC Fair Workweek support.",
      heading: "Deputy alternatives",
      intro:
        "Deputy charges per user, and its auto-scheduling, on Core and Pro, fills shifts by cost, by equal hours or by learning from your past schedules. It also has the most complete NYC Fair Workweek support of the tools here. If you are weighing alternatives, here is how five tools compare on price, auto-scheduling, employee preferences and NYC Fair Workweek, with prices from each vendor's own site.",
      compareLink: "Wiz Scheduler vs Deputy",
      faq: [
        {
          q: "How much does Deputy cost?",
          a: "Deputy charges per user per month. On monthly billing, Lite is {deputyLite}, Core {deputyCore} and Pro {deputyPro} per user. Billed annually, they are {deputyLiteAnnual}, {deputyCoreAnnual} and {deputyProAnnual}. Monthly plans have a {deputyMinimum} minimum a month, and there is no free plan. These are list prices from Deputy's own pricing page.",
        },
        {
          q: "What would Deputy cost for {locations} locations with {employees} employees each?",
          a: "Deputy counts users, so that team is {users} users, counting one user per employee: {deputyLiteTotal} a month on Lite, which has no auto-scheduling, {deputyExampleTotal} on {deputyExamplePlan}, the cheapest plan with auto-scheduling, and {deputyProTotal} on Pro, on monthly billing. Wiz Scheduler Pro is {wizPro} a month for every location.",
        },
        {
          q: "Does Deputy auto-schedule?",
          a: "Yes, on Core and Pro; Lite has no auto-scheduling. It fills shifts by cost, by equal hours, or by learning from your past schedules. Its documentation doesn't mention employee shift or coworker preferences.",
        },
        {
          q: "Can employees give their own preferences in Wiz Scheduler?",
          a: "Yes. Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings, and a manager approves each request. Preference requests are off by default.",
        },
        {
          q: "Is Deputy better for NYC Fair Workweek?",
          a: "Yes. Deputy has the most complete NYC Fair Workweek support of the tools compared here, including consent to changes, premiums, advance notice and rest. Deputy's own docs say the NYC fast-food rules apply to chains with 30 or more locations nationwide, and the NYC retail rules to employers with 20 or more employees. Wiz Scheduler enforces only a minimum rest between shifts, set per location and off until you set it.",
        },
        {
          q: "Can I bring my data over from Deputy?",
          a: "On the paid plan, Wiz Scheduler imports locations, roles and employees with their email from Deputy with an API token from your Deputy account, and Deputy unavailability comes over as blackouts, the times an employee can't work. Every employee gets all the roles at their location at skill level 1, so adjust skills after importing. A separate import brings over availability. Preferences and coworker relationships are not imported.",
        },
      ],
    },
  },
};

export default en;
export type Copy = typeof en;
