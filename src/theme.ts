/**
 * Marketing surface tokens ("The Rota"). Copied from the app's theme.ts
 * `marketing` export so classes port unchanged. Keep in sync by hand.
 */
export const m = {
  page: "bg-newsprint text-ink",
  surface: "bg-paper",
  inverse: "bg-ink text-newsprint",
  text: {
    display: "font-display text-ink",
    body: "font-body text-ink",
    muted: "font-body text-ink/70",
    meta: "font-data text-ink/70 uppercase tracking-[0.14em] text-xs",
    data: "font-data tabular-nums text-ink",
    clear: "text-clear",
  },
  mark: "bg-marker text-ink px-1.5 -mx-0.5 box-decoration-clone",
  rule: { line: "border-rule", heavy: "border-ink/25", grid: "border-rule/70" },
  btn: {
    primary:
      "inline-flex items-center justify-center font-display uppercase " +
      "tracking-wide px-6 py-3 bg-ink text-newsprint border border-ink " +
      "hover:bg-marker hover:border-marker hover:text-ink transition-colors " +
      "focus-visible:outline focus-visible:outline-2 " +
      "focus-visible:outline-offset-2 focus-visible:outline-ink " +
      "disabled:opacity-40 disabled:pointer-events-none",
    secondary:
      "inline-flex items-center justify-center font-display uppercase " +
      "tracking-wide px-6 py-3 bg-transparent text-ink border border-ink/40 " +
      "hover:border-ink transition-colors " +
      "focus-visible:outline focus-visible:outline-2 " +
      "focus-visible:outline-offset-2 focus-visible:outline-ink " +
      "disabled:opacity-40 disabled:pointer-events-none",
    link:
      "font-body underline underline-offset-4 decoration-rule " +
      "hover:decoration-marker transition-colors " +
      "focus-visible:outline focus-visible:outline-2 " +
      "focus-visible:outline-offset-2 focus-visible:outline-ink",
  },
  input:
    "w-full font-body bg-paper text-ink border border-rule px-3 py-2 " +
    "placeholder:text-ink/40 focus:outline-none focus:border-ink " +
    "focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-offset-1 focus-visible:outline-ink " +
    "transition-colors",
  label: "block font-data text-xs uppercase tracking-[0.14em] text-ink/70 mb-1.5",
  alert: {
    error: "border-s-2 border-marker bg-marker/5 text-ink px-4 py-3 font-body text-sm",
    success: "border-s-2 border-clear bg-clear/5 text-ink px-4 py-3 font-body text-sm",
    info: "border-s-2 border-rule bg-ink/[0.03] text-ink px-4 py-3 font-body text-sm",
  },
} as const;
