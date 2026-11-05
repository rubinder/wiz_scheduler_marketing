---
title: "Deputy Pricing vs {wizPro} a Month for Every Location"
description: "Deputy pricing for every plan, per user, next to Wiz Scheduler: the schedule your team had a say in, at {wizPro} a month for every location."
qualifier: "Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings."
competitor: "Deputy"
competitorUrl: "https://www.deputy.com/pricing"
checkedOn: "2026-11-04"
calculator: true
toolId: "deputy"
faq:
  - q: "How much does Deputy cost?"
    a: "Deputy charges per user per month. On monthly billing, Lite is {deputyLite}, Core {deputyCore} and Pro {deputyPro} per user. Billed annually, they are {deputyLiteAnnual}, {deputyCoreAnnual} and {deputyProAnnual}. Monthly plans have a {deputyMinimum} minimum a month, and there is no free plan. Auto-scheduling is on Core and Pro, not Lite. These are list prices from Deputy's own pricing page."
  - q: "What would Deputy cost for my team?"
    a: "Deputy counts users, not locations. {locations} locations with {employees} employees each are {users} users, counting one user per employee: {deputyLiteTotal} a month on Lite, which has no auto-scheduling, {deputyCoreTotal} on Core and {deputyProTotal} on Pro, on monthly billing. Every hire adds to that. Wiz Scheduler Pro is {wizPro} a month for every location, with 500 employees included."
  - q: "How do employees send preferences?"
    a: "Managers can enter preferences for everyone. Turn on preference requests in Company Settings and your employees can send their preferences for you to approve. A manager approves each request and sets how much it counts. Preference requests are off by default."
  - q: "Does Deputy use employee preferences when it auto-schedules?"
    a: "Deputy's auto-scheduling, on Core and Pro, fills shifts by cost, by equal hours, or by learning from your past schedules. Its documentation doesn't mention employee shift or coworker preferences. In Wiz Scheduler, preferred days, preferred hours, weekly hour limits and coworker relationships go into the generator."
  - q: "Will I still need to fix the schedule?"
    a: "Sometimes, yes. Wiz Scheduler reduces fixing; it does not end it. Preferences are already in the draft, every shift that goes against one is marked, and a shift nobody can take without breaking a firm rule is left open rather than forced. You review the week starting from what your team asked for."
  - q: "Is Wiz Scheduler enough for NYC Fair Workweek?"
    a: "Only for the rest rule. Wiz Scheduler enforces a minimum rest between shifts, set per location and off until you set it. It does not track advance notice or premium pay. Deputy has the most complete NYC Fair Workweek support of the tools we compare, and its own docs say the NYC fast-food rules apply to chains with 30 or more locations nationwide. If those rules apply to you, Deputy does more here."
  - q: "Can I bring my data over from Deputy?"
    a: "On the paid plan, Wiz Scheduler imports locations, roles and employees with their email from Deputy with an API token from your Deputy account, and Deputy unavailability comes over as blackouts, the times an employee can't work. Every employee gets all the roles at their location at skill level 1, so adjust skills after importing. A separate import brings over availability. Preferences and coworker relationships are not imported."
---

Deputy is a capable scheduling tool. With it, the manager builds the week, or on Core and Pro its auto-scheduling fills the shifts by cost, by equal hours or by learning from your past schedules, and the team works with the result. Wiz Scheduler starts somewhere else: each employee's preferred days, preferred hours, weekly hour limit, and who they work well with or should be kept apart from go into the generator, and the week is built around them.

## How preferences work

Managers can set, for each employee:

- up to three preferred days and preferred time ranges
- a weekly limit on hours
- a cap on shifts in a time range, such as "at most two evening shifts a week"
- times they can't work
- coworkers to work with, keep apart from, or never schedule together (people who share a location)

Turn on preference requests in Company Settings and your employees can send their preferences for you to approve. Requests are off by default, and a manager approves each one and sets how much it counts:

- **Firm.** The employee is not considered for a shift that breaks it. If nobody else qualifies, the shift is left open rather than forced on someone.
- **Soft.** The employee becomes a less likely pick. If they get the shift anyway, it is marked with an asterisk, so you see every compromise.

Normal Generate and AI Generate both work this way. On every generation, roles, availability, weekly hour limits, minimum rest (once you set it) and never-together pairs are rules, not suggestions.

That is why there is less to fix. The preferences are already in the draft, and the places the draft couldn't meet them are marked. You still review the week; you start from what your team asked for.

Deputy's auto-scheduling is on the Core and Pro plans. It fills shifts by cost, by equal hours, or by learning from your past schedules. Its documentation doesn't mention employee shift or coworker preferences.

## Pricing

Deputy charges per user, so the price grows with every hire. Wiz Scheduler charges one base price for the company, with every location included.

<div data-pricing-table></div>

Take {locations} locations with {employees} employees each. On Deputy that is {users} users, counting one user per employee. Lite comes to {deputyLiteTotal} a month, but has no auto-scheduling. Core, the cheapest Deputy plan with auto-scheduling, is {deputyCoreTotal} a month, and Pro is {deputyProTotal}. On Wiz Scheduler Pro, the same team pays {wizPro} a month, plus any AI credits it chooses to buy.

Those are Deputy's monthly prices. Billed annually, Lite is {deputyLiteAnnual}, Core {deputyCoreAnnual} and Pro {deputyProAnnual} per user a month. Monthly plans have a {deputyMinimum} minimum a month, and Deputy has no free plan.

Wiz Scheduler Pro includes 500 employees, 50 manager seats and 25 schedule generations, with small metered charges above those. AI Generate is not included; it is paid from prepaid credit packs. The free plan covers {wizFreeLocations} locations and {wizFreeEmployees} employees, with one schedule per location a month and no AI Generate. Wiz Scheduler has no annual discount.

## Where Deputy is stronger

- **NYC Fair Workweek.** Deputy has the most complete NYC Fair Workweek support of the tools we compare, including consent to changes, premiums, advance notice and rest. Wiz Scheduler only enforces rest between shifts, once you set it.
- **Auto-fill by cost or from your history.** Deputy can fill shifts by cost, by equal hours, or by learning from your past schedules. Wiz Scheduler doesn't learn from past schedules.
- **An annual discount.** Deputy's annual plans cost less per user. Wiz Scheduler has no annual discount.

If those are the reasons you use Deputy, it may well remain the better fit.

## Fair Workweek, honestly

Wiz Scheduler's Fair Workweek support is one rule: a minimum rest between shifts. Set it on a location, for example 11 hours, and no generated schedule will break it. It is off until you set it. Wiz Scheduler does not track advance notice, premium pay or schedule changes.

Deputy has the most complete NYC Fair Workweek support of the tools we compare. Deputy's own documentation says the NYC fast-food rules apply to chains with 30 or more locations nationwide, and the NYC retail rules to employers with 20 or more employees. If your business is covered, Deputy does more here than Wiz Scheduler, and 7shifts does more too. See the [NYC Fair Workweek page](/nyc-fair-workweek-scheduling) for what Wiz Scheduler covers. The free [schedule checker](/free-schedule-checker) looks for short rest and shifts inside the 14-day notice window in a schedule you upload; it is a separate tool, not part of scheduling.

## Switching from Deputy

The Deputy importer is on the paid plan. It connects with an API token that you copy from your Deputy account and paste into Wiz Scheduler.

1. Sign up free and confirm your email.
2. Upgrade to Pro.
3. Open Import, choose Deputy and paste your API token. It brings over locations, roles and employees with their email. Unavailability in Deputy comes over as blackouts, the times an employee can't work.
4. Check roles and skills. Every imported employee gets all the roles at their location, at skill level 1, so adjust each employee's roles and skill levels before you generate.
5. Run the separate availability import.
6. Add preferences and coworker relationships yourself, or turn on preference requests in Company Settings so employees can send their own. Preferences and coworker relationships are not imported.
7. Generate your first week.
