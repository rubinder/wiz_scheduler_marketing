---
title: "7shifts Pricing vs a Flat {wizPro} Alternative"
description: "7shifts pricing for every plan and team size, next to Wiz Scheduler: the schedule your team had a say in, at {wizPro} a month for every location."
qualifier: "Managers can enter preferences for everyone. Employees can send their own once preference requests are turned on in Company Settings."
competitor: "7shifts"
competitorUrl: "https://www.7shifts.com/pricing/"
checkedOn: "2026-11-04"
calculator: true
toolId: "7shifts"
faq:
  - q: "How much does 7shifts cost?"
    a: "7shifts charges per location per month, and the plan depends on headcount per location. Comp is free for one location with up to {compMaxEmployees} employees. With 1 to {essentialsMaxEmployees} employees per location, Essentials is {essentials} and Premium {premium}. With {proMinEmployees} or more, Pro is {pro} (up to {proMaxEmployees} employees) and Premium {premiumLarge}. Annual billing takes 10% off. These are list prices from 7shifts' own pricing page."
  - q: "Which 7shifts plan fits my team?"
    a: "It depends on how many employees each location has, not the company total. {locations} locations with {employees} employees each fit Essentials, {sevenShiftsExampleTotal} a month in total, or Premium. The same {locations} locations with {proMinEmployees} to {proMaxEmployees} employees each would be on Pro, {sevenShiftsProTotal} a month. Wiz Scheduler Pro is {wizPro} a month for every location either way."
  - q: "How do employees send preferences?"
    a: "Managers can enter preferences for everyone. Turn on preference requests in Company Settings and your employees can send their preferences for you to approve. A manager approves each request and sets how much it counts. Preference requests are off by default."
  - q: "Will I still need to fix the schedule?"
    a: "Sometimes, yes. Wiz Scheduler reduces fixing; it does not end it. Preferences are already in the draft, every shift that goes against one is marked, and a shift nobody can take without breaking a firm rule is left open rather than forced. You review the week starting from what your team asked for."
  - q: "Does Wiz Scheduler cost less than 7shifts?"
    a: "Wiz Scheduler Pro is {wizPro} a month for all your locations, with 500 employees included and {wizExtra500} a month per extra 500. AI Generate is not included: it is paid from prepaid credits if you use it. 7shifts charges per location, from {essentials} per location a month on Essentials. Use the calculator on this page for your own team."
  - q: "Is Wiz Scheduler enough for NYC Fair Workweek?"
    a: "Only for the rest rule. Wiz Scheduler enforces a minimum rest between shifts, set per location and off until you set it. It does not track advance notice or premium pay. 7shifts flags clopens, changes inside 14 days and premium pay on its paid plans, and Deputy has the most complete support of the tools we compare."
  - q: "Can I bring my data over from 7shifts?"
    a: "On the paid plan, Wiz Scheduler imports companies, locations, departments, roles, employees and their assignments from 7shifts with an API token from your 7shifts account. A separate import brings over weekly availability, unavailability and approved time off. Preferences and coworker relationships are not imported."
---

7shifts is a capable scheduling tool. With it, the manager builds the week, or its auto-scheduler drafts one from sales and schedule history, and the team works with the result. Wiz Scheduler starts somewhere else: each employee's preferred days, preferred hours, weekly hour limit, and who they work well with or should be kept apart from go into the generator, and the week is built around them.

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

7shifts' auto-scheduler is a beta that is rolling out to selected accounts. It drafts from at least six weeks of sales and schedule history and checks availability. Its documentation doesn't mention shift or coworker preferences.

## Pricing

7shifts charges per location, and the plan depends on how many employees each location has. Wiz Scheduler charges one base price for the company, with every location included.

<div data-pricing-table></div>

Take {locations} locations with {employees} employees each. Every location fits 7shifts {sevenShiftsExamplePlan}, so the total is {sevenShiftsExampleTotal} a month. If each of those {locations} locations had {proMinEmployees} to {proMaxEmployees} employees, they would be on 7shifts Pro at {sevenShiftsProTotal} a month. On Wiz Scheduler Pro, both teams pay {wizPro} a month, plus any AI credits they choose to buy.

Wiz Scheduler Pro includes 500 employees, 50 manager seats and 25 schedule generations, with small metered charges above those. AI Generate is not included; it is paid from prepaid credit packs. The free plan covers {wizFreeLocations} locations and {wizFreeEmployees} employees, with one schedule per location a month and no AI Generate. 7shifts takes 10% off for annual billing; Wiz Scheduler has no annual discount.

## Where 7shifts is stronger

- **NYC Fair Workweek alerts.** 7shifts' paid plans flag clopens, changes inside 14 days and premium pay. Wiz Scheduler only enforces rest between shifts.
- **Payroll.** 7shifts sells a payroll add-on. Wiz Scheduler does not process payroll or pool tips.
- **Drafts from sales.** 7shifts' auto-scheduler works from your sales and schedule history. Wiz Scheduler has no POS integration or sales forecasting.
- **A free plan for one small location.** 7shifts Comp is free for one location with up to {compMaxEmployees} employees.

If those are the reasons you use 7shifts, it may well remain the better fit.

## Fair Workweek, honestly

Wiz Scheduler's Fair Workweek support is one rule: a minimum rest between shifts. Set it on a location, for example 11 hours, and no generated schedule will break it. It is off until you set it. Wiz Scheduler does not track advance notice, premium pay or schedule changes.

7shifts and Deputy do more here. 7shifts flags clopens, changes inside 14 days and premium pay on its paid plans, and Deputy has the most complete support of the tools we compare. See the [NYC Fair Workweek page](/nyc-fair-workweek-scheduling) for what Wiz Scheduler covers. The free [schedule checker](/free-schedule-checker) looks for short rest and shifts inside the 14-day notice window in a schedule you upload; it is a separate tool, not part of scheduling.

## Switching from 7shifts

The 7shifts importer is on the paid plan. It connects with an API token that you copy from your 7shifts account and paste into Wiz Scheduler.

1. Sign up free and confirm your email.
2. Upgrade to Pro.
3. Open Import, choose 7shifts and paste your API token. It brings over companies, locations, departments, roles, employees and their assignments.
4. Run the separate availability import for weekly availability, unavailability and approved time off.
5. Add preferences and coworker relationships yourself, or turn on preference requests in Company Settings so employees can send their own. Preferences and coworker relationships are not imported.
6. Generate your first week.
