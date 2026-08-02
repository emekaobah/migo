/**
 * Loan arithmetic. Pure, no imports, fully unit-tested.
 *
 * This is the only place money is computed, which is why PLAN §6b calls it the
 * highest-value test file in the project. Two rules hold throughout:
 *
 * 1. **Everything is whole Naira.** Amounts are integers. Binary floating point
 *    cannot represent 0.1, so accumulating a rate across instalments in floats
 *    loses kobo and the instalments stop summing to the total.
 * 2. **Instalments always sum exactly to the total.** Splitting is even, with
 *    the remainder on the **last** payment — never redistributed, never
 *    rounded away. `sum(instalments) === total` is an invariant, not an aim.
 */

export type Instalment = {
  /** 1-based position in the schedule. */
  index: number;
  amount: number;
  dueAt: Date;
};

export type Tenor = {
  /** Duration in days. */
  days: number;
  /** How many payments the borrower makes. */
  payments: number;
  /** Total-repayable multiplier applied to the principal. */
  multiplier: number;
};

/** Total repayable for a principal at a given tenor. Rounded to whole Naira. */
export function totalRepayable(principal: number, multiplier: number): number {
  return Math.round(principal * multiplier);
}

/**
 * Split a total into `count` payments: even, remainder on the last.
 *
 * `splitEvenly(100_000, 3)` → `[33_333, 33_333, 33_334]`.
 */
export function splitEvenly(total: number, count: number): number[] {
  if (count < 1) throw new RangeError(`instalment count must be >= 1, got ${count}`);
  const rounded = Math.round(total);
  const base = Math.floor(rounded / count);
  const parts = Array.from({ length: count }, () => base);
  parts[count - 1] = rounded - base * (count - 1);
  return parts;
}

/**
 * The repayment schedule. Payments are spread evenly across the tenor, so a
 * 90-day/3-payment loan is due at day 30, 60 and 90 — the final payment always
 * lands exactly on the tenor's end.
 */
export function buildSchedule(principal: number, tenor: Tenor, from: Date): Instalment[] {
  const total = totalRepayable(principal, tenor.multiplier);
  const amounts = splitEvenly(total, tenor.payments);
  const interval = tenor.days / tenor.payments;

  return amounts.map((amount, i) => ({
    index: i + 1,
    amount,
    dueAt: addDays(from, Math.round(interval * (i + 1))),
  }));
}

export type Extension = {
  /** Paid today to extend — `pct` of the outstanding. */
  payToday: number;
  /** What carries over before interest. */
  carried: number;
  /** What will be owed on the carried amount after interest. */
  newOutstanding: number;
  newDueAt: Date;
};

/**
 * Extension terms: pay `pct` of the outstanding now, the remainder carries for
 * `extendDays` with `rate` applied to the carried amount.
 *
 * **30% / 30 days, client-confirmed 2026-08-02** (OPEN-QUESTIONS #1). Both stay
 * parameters because a rate is a business input that will change again — the
 * defaults live in `api/mock/fixtures.ts`, never inline in a screen.
 *
 * `extendFrom` is **the due date being extended past**, not the loan's original
 * maturity. Extending a loan already 5 days late gives 30 days from that missed
 * date, not 30 from today — this is the subtle one, and it is tested.
 */
export function computeExtension(
  outstanding: number,
  pct: number,
  extendDays: number,
  rate: number,
  extendFrom: Date,
): Extension {
  const payToday = Math.round(outstanding * pct);
  const carried = Math.round(outstanding) - payToday;

  return {
    payToday,
    carried,
    newOutstanding: Math.round(carried * rate),
    newDueAt: addDays(extendFrom, extendDays),
  };
}

/** Outstanding balance after `paidCount` instalments have cleared. */
export function outstandingAfter(schedule: Instalment[], paidCount: number): number {
  return schedule.slice(paidCount).reduce((sum, i) => sum + i.amount, 0);
}

/** The next unpaid instalment, or null when the loan is settled. */
export function nextInstalment(schedule: Instalment[], paidCount: number): Instalment | null {
  return schedule[paidCount] ?? null;
}

/** Date arithmetic that does not mutate its input. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}
