import {
  addDays,
  buildSchedule,
  computeExtension,
  nextInstalment,
  outstandingAfter,
  splitEvenly,
  totalRepayable,
  type Tenor,
} from '@/lib/loan-math';

/**
 * Illustrative figures from HANDOFF §8. They live here as test fixtures only —
 * production reads them from `getOffers()`, so no screen hard-codes a multiplier.
 */
const TENORS: Tenor[] = [
  { days: 14, payments: 1, multiplier: 1.1 },
  { days: 30, payments: 1, multiplier: 1.16 },
  { days: 60, payments: 2, multiplier: 1.27 },
  { days: 90, payments: 3, multiplier: 1.37 },
];

const AMOUNTS = [49_900, 99_600, 199_700];
const ORIGIN = new Date(2026, 7, 2); // 2 Aug 2026, fixed — Date.now() would make this flaky

describe('splitEvenly', () => {
  it('puts the remainder on the last payment', () => {
    expect(splitEvenly(100_000, 3)).toEqual([33_333, 33_333, 33_334]);
  });

  it('handles an exact division with no remainder', () => {
    expect(splitEvenly(90_000, 3)).toEqual([30_000, 30_000, 30_000]);
  });

  it('returns the whole total for a single payment', () => {
    expect(splitEvenly(54_890, 1)).toEqual([54_890]);
  });

  it('rejects a count below one', () => {
    expect(() => splitEvenly(1000, 0)).toThrow(RangeError);
  });
});

describe('instalments sum exactly to the total — all 12 combinations', () => {
  // The invariant that matters: a borrower paying every instalment pays the
  // total, to the Naira. A rounding leak here is invisible and expensive.
  for (const tenor of TENORS) {
    for (const principal of AMOUNTS) {
      const label = `${tenor.days}d × ${tenor.payments} @ ₦${principal.toLocaleString()}`;

      it(`${label} sums to the total`, () => {
        const total = totalRepayable(principal, tenor.multiplier);
        const schedule = buildSchedule(principal, tenor, ORIGIN);

        expect(schedule).toHaveLength(tenor.payments);
        expect(schedule.reduce((sum, i) => sum + i.amount, 0)).toBe(total);
      });

      it(`${label} keeps every instalment a whole Naira amount`, () => {
        for (const i of buildSchedule(principal, tenor, ORIGIN)) {
          expect(Number.isInteger(i.amount)).toBe(true);
        }
      });

      it(`${label} spreads instalments evenly, ending on the tenor`, () => {
        const schedule = buildSchedule(principal, tenor, ORIGIN);
        const last = schedule[schedule.length - 1];
        expect(last.dueAt).toEqual(addDays(ORIGIN, tenor.days));
      });
    }
  }
});

describe('buildSchedule', () => {
  it('spaces a 90-day, 3-payment loan at 30/60/90', () => {
    const schedule = buildSchedule(99_600, TENORS[3], ORIGIN);
    expect(schedule.map((i) => i.dueAt)).toEqual([
      addDays(ORIGIN, 30),
      addDays(ORIGIN, 60),
      addDays(ORIGIN, 90),
    ]);
  });

  it('numbers instalments from one', () => {
    expect(buildSchedule(99_600, TENORS[3], ORIGIN).map((i) => i.index)).toEqual([1, 2, 3]);
  });

  it('does not mutate the date it is given', () => {
    const before = ORIGIN.getTime();
    buildSchedule(99_600, TENORS[3], ORIGIN);
    expect(ORIGIN.getTime()).toBe(before);
  });
});

describe('outstandingAfter / nextInstalment', () => {
  const schedule = buildSchedule(99_600, TENORS[3], ORIGIN);
  const total = totalRepayable(99_600, TENORS[3].multiplier);

  it('is the full total before any payment', () => {
    expect(outstandingAfter(schedule, 0)).toBe(total);
  });

  it('is zero once every instalment has cleared', () => {
    expect(outstandingAfter(schedule, 3)).toBe(0);
  });

  it('drops by exactly the instalment paid', () => {
    expect(outstandingAfter(schedule, 1)).toBe(total - schedule[0].amount);
  });

  it('returns null for the next instalment when settled', () => {
    expect(nextInstalment(schedule, 3)).toBeNull();
    expect(nextInstalment(schedule, 0)).toEqual(schedule[0]);
  });
});

describe('computeExtension — 30% / 30 days, client-confirmed', () => {
  const PCT = 0.3;
  const DAYS = 30;
  const RATE = 1.16;

  it('takes 30% today and carries the rest', () => {
    const ext = computeExtension(100_000, PCT, DAYS, RATE, ORIGIN);
    expect(ext.payToday).toBe(30_000);
    expect(ext.carried).toBe(70_000);
  });

  it('applies the rate to the carried amount only', () => {
    const ext = computeExtension(100_000, PCT, DAYS, RATE, ORIGIN);
    expect(ext.newOutstanding).toBe(Math.round(70_000 * RATE));
  });

  it('payToday plus carried always equals the outstanding', () => {
    // Guards the rounding split — 33,333.33 must not lose a Naira.
    for (const outstanding of [99_999, 100_000, 54_891, 1, 7]) {
      const ext = computeExtension(outstanding, PCT, DAYS, RATE, ORIGIN);
      expect(ext.payToday + ext.carried).toBe(outstanding);
    }
  });

  it('dates from the due date being extended past, NOT from today', () => {
    // The subtle one. A loan already 5 days overdue extends 30 days from the
    // missed due date, giving 25 days from now — not 30.
    const missedDue = addDays(ORIGIN, -5);
    const ext = computeExtension(100_000, PCT, DAYS, RATE, missedDue);
    expect(ext.newDueAt).toEqual(addDays(missedDue, 30));
    expect(ext.newDueAt).not.toEqual(addDays(ORIGIN, 30));
  });

  it('rejects a percentage passed as 30 instead of 0.30', () => {
    // The failure this prevents: payToday exceeds the outstanding, carried goes
    // negative, and the extend screen shows a borrower a negative amount owed.
    expect(() => computeExtension(100_000, 30, DAYS, RATE, ORIGIN)).toThrow(RangeError);
  });

  it.each([-0.1, 1.01, NaN])('rejects an out-of-range pct: %p', (bad) => {
    expect(() => computeExtension(100_000, bad, DAYS, RATE, ORIGIN)).toThrow(RangeError);
  });

  it('rejects a negative outstanding', () => {
    expect(() => computeExtension(-1, PCT, DAYS, RATE, ORIGIN)).toThrow(RangeError);
  });

  it('accepts the boundaries 0 and 1', () => {
    expect(computeExtension(100_000, 0, DAYS, RATE, ORIGIN).payToday).toBe(0);
    expect(computeExtension(100_000, 1, DAYS, RATE, ORIGIN).carried).toBe(0);
  });

  it('keeps the percentage and window parameterised', () => {
    // Proves a rate change is a fixtures edit, not a code change.
    const ext = computeExtension(100_000, 0.2, 45, RATE, ORIGIN);
    expect(ext.payToday).toBe(20_000);
    expect(ext.newDueAt).toEqual(addDays(ORIGIN, 45));
  });
});

describe('addDays', () => {
  it('crosses a month boundary', () => {
    expect(addDays(new Date(2026, 7, 20), 30)).toEqual(new Date(2026, 8, 19));
  });

  it('crosses a year boundary', () => {
    expect(addDays(new Date(2026, 11, 20), 30)).toEqual(new Date(2027, 0, 19));
  });

  it('handles a leap day', () => {
    expect(addDays(new Date(2028, 1, 28), 1)).toEqual(new Date(2028, 1, 29));
  });
});
