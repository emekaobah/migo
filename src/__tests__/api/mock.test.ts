import { api } from '@/api/client';
import { delay } from '@/api/mock/delay';
import { resetMockApi } from '@/api/mock';
import { AMOUNTS, TENORS } from '@/api/mock/fixtures';

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
