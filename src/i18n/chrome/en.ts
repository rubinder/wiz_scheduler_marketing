/** Site-only strings that home, features, the nav and the footer need in every locale. */
const chrome = {
  nav: {
    features: "Features",
    nyc: "NYC Fair Workweek",
    checker: "Free schedule checker",
    compare: "Compare with 7shifts",
    language: "Language",
  },
  home: {
    eyebrowCapability: "01 — Capability",
    eyebrowProof: "02 — Proof",
    eyebrowMethod: "03 — Method",
    eyebrowInputs: "04 — Inputs",
    eyebrowCost: "05 — Cost",
    eyebrowAssurance: "06 — Assurance",
    meterRuns: "RUNS",
    meterData: "DATA",
    meterTeam: "TEAM",
    meterAi: "AI",
    runsIncluded: "50 / month",
    aiOverage: "Cost x 130%",
    rotaShifts: "shifts",
    rotaPeople: "people",
    rotaViolations: "rest violations",
  },
};

export default chrome;
export type Chrome = typeof chrome;
