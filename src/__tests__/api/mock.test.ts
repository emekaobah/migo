import { api } from '@/api/client';
import { delay } from '@/api/mock/delay';
import { resetMockApi } from '@/api/mock';
import { AMOUNTS, EXTENSION, LATENCY, TENORS } from '@/api/mock/fixtures';
import { addDays, outstandingAfter } from '@/lib/loan-math';

/**
 * Contract conformance and cancellation (PLAN §8a).
 *
 * Real timers would make these tests take ~10 seconds of wall clock, since the
 * mock reproduces the prototype's latencies on purpose. Fake timers keep the
 * behaviour and drop the waiting.
 */
beforeEach(() => {
  resetMockApi();
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

/** Advances timers and yields to the microtask queue so promises settle. */
async function settle<T>(promise: Promise<T>, ms: number): Promise<T> {
  jest.advanceTimersByTime(ms);
  return promise;
}

describe('contract', () => {
  it('returns the rate table rather than leaving screens to hard-code it', async () => {
    const offers = await settle(api.getOffers(), 1800);

    expect(offers.tenors).toEqual(TENORS);
    expect(offers.amounts).toEqual(AMOUNTS);
    // The multipliers must travel with the tenors — this is what stops a screen
    // from inlining 1.37 and going stale when the real rates arrive.
    expect(offers.tenors.every((t) => typeof t.multiplier === 'number')).toBe(true);
  });

  it('verifies a six-digit code and rejects anything shorter', async () => {
    await expect(settle(api.verifyCode('123456'), 400)).resolves.toEqual({ ok: true });
    await expect(settle(api.verifyCode('123'), 400)).resolves.toEqual({ ok: false });
  });

  it('has no loan until one is accepted', async () => {
    await expect(settle(api.getLoan(), 0)).resolves.toBeNull();
  });

  it('builds a loan whose schedule sums to the total', async () => {
    const accounts = await settle(api.listAccounts(), 300);
    const loan = await settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      900,
    );

    expect(loan.schedule).toHaveLength(3);
    expect(loan.schedule.reduce((sum, i) => sum + i.amount, 0)).toBe(loan.total);
    expect(loan.disbursedTo.id).toBe(accounts[0].id);
    expect(loan.paidCount).toBe(0);
  });

  it('persists the accepted loan for getLoan', async () => {
    const accounts = await settle(api.listAccounts(), 300);
    await settle(
      api.acceptLoan({ tenor: TENORS[0], principal: 49_900, accountId: accounts[0].id }, 'sig'),
      900,
    );

    await expect(settle(api.getLoan(), 0)).resolves.not.toBeNull();
  });

  it('quotes the wallet for the outstanding balance', async () => {
    const accounts = await settle(api.listAccounts(), 300);
    const loan = await settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      900,
    );
    const wallet = await settle(api.getWallet('sterling'), 700);

    expect(wallet.bank).toBe('sterling');
    expect(wallet.amountDue).toBe(loan.total);
    expect(wallet.accountNumber).toMatch(/^\d{10}$/);
  });

  it('rejects extending when there is no loan', async () => {
    await expect(api.extendLoan(0.3)).rejects.toThrow(/no loan/i);
  });
});

describe('extendLoan', () => {
  /** Takes a 90-day/3-payment loan to the point where one instalment has cleared. */
  async function loanWithOnePaid() {
    const accounts = await settle(api.listAccounts(), LATENCY.listAccounts);
    await settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      LATENCY.acceptLoan,
    );
    const wallet = await settle(api.getWallet('sterling'), LATENCY.getWallet);
    await settle(api.watchPayment(wallet).promise, LATENCY.watchPayment);
    return settle(api.getLoan(), LATENCY.getLoan);
  }

  it('applies the extension rather than only recording it', async () => {
    const before = await loanWithOnePaid();
    const outstanding = outstandingAfter(before!.schedule, before!.paidCount);

    const after = await settle(api.extendLoan(EXTENSION.pct), LATENCY.extendLoan);

    // The bug this guards: moving `extendedTo` while leaving the old schedule
    // in place, so the screen keeps quoting the pre-extension balance.
    const carried = Math.round(outstanding) - Math.round(outstanding * EXTENSION.pct);
    expect(outstandingAfter(after.schedule, after.paidCount)).toBe(
      Math.round(carried * EXTENSION.rate),
    );
    expect(outstandingAfter(after.schedule, after.paidCount)).not.toBe(outstanding);
  });

  it('carries the remainder to a single payment 30 days past the date extended from', async () => {
    const before = await loanWithOnePaid();
    const nextDue = before!.schedule[before!.paidCount].dueAt;

    const after = await settle(api.extendLoan(EXTENSION.pct), LATENCY.extendLoan);

    expect(after.schedule).toHaveLength(1);
    expect(after.extendedTo).toEqual(after.schedule[0].dueAt);
    // Relative to the due date being extended past, not to today and not to the
    // loan's original maturity.
    expect(after.schedule[0].dueAt).toEqual(addDays(nextDue, EXTENSION.days));
  });

  it('prices the carry at the extension rate, not the loan tenor multiplier', async () => {
    const before = await loanWithOnePaid();
    const outstanding = outstandingAfter(before!.schedule, before!.paidCount);
    const carried = Math.round(outstanding) - Math.round(outstanding * EXTENSION.pct);

    const after = await settle(api.extendLoan(EXTENSION.pct), LATENCY.extendLoan);

    expect(after.schedule[0].amount).toBe(Math.round(carried * EXTENSION.rate));
    // A 90-day loan carries 1.37; charging that for 30 days is a pricing
    // decision nobody made.
    expect(after.schedule[0].amount).not.toBe(Math.round(carried * TENORS[3].multiplier));
  });

  it('keeps every earlier payment in the total across a second extension', async () => {
    const before = await loanWithOnePaid();
    const paidFirstInstalment = before!.schedule[0].amount;
    const outstandingBefore = outstandingAfter(before!.schedule, before!.paidCount);
    const payTodayFirst = Math.round(outstandingBefore * EXTENSION.pct);

    const once = await settle(api.extendLoan(EXTENSION.pct), LATENCY.extendLoan);
    const payTodaySecond = Math.round(
      outstandingAfter(once.schedule, once.paidCount) * EXTENSION.pct,
    );
    const twice = await settle(api.extendLoan(EXTENSION.pct), LATENCY.extendLoan);

    // Extending twice must not forget what was paid before the first extension.
    // Deriving "already repaid" by slicing the schedule loses it: the first
    // extension resets paidCount to 0 and replaces the schedule, so the slice
    // is empty from then on and the loan understates its own lifetime cost.
    expect(twice.total).toBe(
      paidFirstInstalment +
        payTodayFirst +
        payTodaySecond +
        outstandingAfter(twice.schedule, twice.paidCount),
    );
    expect(twice.total).toBeGreaterThan(once.total - outstandingAfter(once.schedule, 0));
  });

  it('rejects a percentage passed as 30 instead of 0.3', async () => {
    await loanWithOnePaid();
    await expect(api.extendLoan(30)).rejects.toThrow(RangeError);
  });
});

describe('watchPayment cancellation', () => {
  it('resolves after the detection window and clears an instalment', async () => {
    const accounts = await settle(api.listAccounts(), 300);
    await settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      900,
    );
    const wallet = await settle(api.getWallet('sterling'), 700);

    const watcher = api.watchPayment(wallet);
    const event = await settle(watcher.promise, 6000);

    expect(event.received).toBe(true);

    const loan = await settle(api.getLoan(), 0);
    expect(loan?.paidCount).toBe(1);
  });

  it('never settles once cancelled — the screen has unmounted', async () => {
    const accounts = await settle(api.listAccounts(), 300);
    await settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      900,
    );
    const wallet = await settle(api.getWallet('sterling'), 700);

    const watcher = api.watchPayment(wallet);
    watcher.cancel();

    let settled = false;
    void watcher.promise.then(() => {
      settled = true;
    });

    jest.advanceTimersByTime(60_000);
    await Promise.resolve();

    expect(settled).toBe(false);

    // And the loan must not have advanced behind the abandoned screen.
    const loan = await settle(api.getLoan(), 0);
    expect(loan?.paidCount).toBe(0);
  });
});

describe('delay', () => {
  it('resolves with its value after the interval', async () => {
    const d = delay(500, 'done');
    jest.advanceTimersByTime(500);
    await expect(d.promise).resolves.toBe('done');
  });

  it('clears its timer on cancel so nothing fires later', async () => {
    const d = delay(500, 'done');
    let settled = false;
    void d.promise.then(() => {
      settled = true;
    });

    d.cancel();
    jest.advanceTimersByTime(5_000);
    await Promise.resolve();

    expect(settled).toBe(false);
  });

  it('is safe to cancel twice', () => {
    const d = delay(500, 'x');
    d.cancel();
    expect(() => d.cancel()).not.toThrow();
  });
});
