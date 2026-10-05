import { api } from '@/api/client';
import { delay } from '@/api/mock/delay';
import { resetMockApi, restartMockApi } from '@/api/mock';
import {
  ACCOUNTS,
  AMOUNTS,
  BANKS,
  BORROWER,
  EXTENSION,
  LATENCY,
  OTHER_BVN_ACCOUNT,
  TENORS,
  UNKNOWN_ACCOUNT,
} from '@/api/mock/fixtures';
import { addDays, outstandingAfter } from '@/lib/loan-math';
import { signOut as signOutStorage } from '@/state/persistence';

import { secureStoreMock } from '../setup';

/**
 * Contract conformance and cancellation (PLAN §8a).
 *
 * Real timers would make these tests take ~10 seconds of wall clock, since the
 * mock reproduces the prototype's latencies on purpose. Fake timers keep the
 * behaviour and drop the waiting.
 */
beforeEach(async () => {
  await resetMockApi();
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

  it('quotes the wallet for one instalment, matching what a payment clears', async () => {
    const accounts = await settle(api.listAccounts(), 300);
    const loan = await settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      900,
    );
    const wallet = await settle(api.getWallet('sterling'), 700);

    expect(wallet.bank).toBe('sterling');
    expect(wallet.accountNumber).toMatch(/^\d{10}$/);

    // The bug this guards: quoting the whole balance while `watchPayment`
    // clears a single instalment, so a 3-payment borrower was told to transfer
    // the entire debt and had one third of it marked paid.
    expect(wallet.amountDue).toBe(loan.schedule[0].amount);
    expect(wallet.amountDue).toBeLessThan(loan.total);

    await settle(api.watchPayment(wallet).promise, LATENCY.watchPayment);
    const after = await settle(api.getLoan(), LATENCY.getLoan);

    // What was quoted is what came off the balance.
    expect(outstandingAfter(after!.schedule, after!.paidCount)).toBe(
      loan.total - wallet.amountDue,
    );
  });

  it('quotes no extension when there is no loan', async () => {
    await expect(settle(api.quoteExtension(), LATENCY.getLoan)).resolves.toBeNull();
  });

  it('rejects extending when there is no loan', async () => {
    await expect(api.extendLoan(0.3)).rejects.toThrow(/no loan/i);
  });
});

describe('adding a payout account', () => {
  const bank = BANKS.find((b) => b.name === 'Access Bank')!;
  const number = '0123456789';

  it('lists the banks a payout account can be added at', async () => {
    const banks = await settle(api.listBanks(), LATENCY.listBanks);
    expect(banks).toEqual(BANKS);
    expect(new Set(banks.map((b) => b.id)).size).toBe(banks.length);
  });

  it('resolves the account holder before anything is sent', async () => {
    await expect(settle(api.resolveAccount(bank.id, number), LATENCY.resolveAccount)).resolves.toEqual({
      holder: BORROWER.fullName,
    });
  });

  it('resolves nothing for an account the bank does not know', async () => {
    await expect(
      settle(api.resolveAccount(bank.id, UNKNOWN_ACCOUNT), LATENCY.resolveAccount),
    ).resolves.toBeNull();
  });

  it('sends a code to the phone on the BVN, masked', async () => {
    const sent = await settle(api.requestAccountCode(bank.id, number), LATENCY.requestCode);
    expect(sent).toEqual({ ok: true, maskedPhone: expect.stringMatching(/^0\d{3}•+\d{4}$/), resendIn: 60 });
  });

  it('sends no code for an account on a different BVN', async () => {
    await expect(
      settle(api.requestAccountCode(bank.id, OTHER_BVN_ACCOUNT), LATENCY.requestCode),
    ).resolves.toEqual({ ok: false, reason: 'different-bvn' });
  });

  it('sends no code for an account already on file', async () => {
    // GTBank ••4412 is seeded. Matching on bank and last four is all a masked
    // number allows.
    const gtb = BANKS.find((b) => b.name === ACCOUNTS[0].bank)!;
    await expect(
      settle(api.requestAccountCode(gtb.id, '0000004412'), LATENCY.requestCode),
    ).resolves.toEqual({ ok: false, reason: 'already-added' });
  });

  it('adds the account once the code is confirmed, and lists it after the seeded ones', async () => {
    const added = await settle(api.confirmAccount(bank.id, number, '123456'), LATENCY.verifyCode);

    expect(added).toEqual({
      ok: true,
      account: {
        id: expect.any(String),
        bank: 'Access Bank',
        maskedNumber: '••6789',
        holder: BORROWER.fullName,
        type: 'Savings',
      },
    });

    const listed = await settle(api.listAccounts(), LATENCY.listAccounts);
    expect(listed).toEqual([...ACCOUNTS, (added as { account: unknown }).account]);

    // Now on file, so a second attempt is refused before a code goes out.
    await expect(
      settle(api.requestAccountCode(bank.id, number), LATENCY.requestCode),
    ).resolves.toEqual({ ok: false, reason: 'already-added' });
  });

  it('adds nothing for a wrong code', async () => {
    await expect(settle(api.confirmAccount(bank.id, number, '123'), LATENCY.verifyCode)).resolves.toEqual({
      ok: false,
    });
    expect(await settle(api.listAccounts(), LATENCY.listAccounts)).toEqual(ACCOUNTS);
  });

  it('keeps an added account across a restart', async () => {
    const added = await settle(api.confirmAccount(bank.id, number, '123456'), LATENCY.verifyCode);
    restartMockApi();
    expect(await settle(api.listAccounts(), LATENCY.listAccounts)).toEqual([
      ...ACCOUNTS,
      (added as { account: unknown }).account,
    ]);
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

  it('applies exactly what it quoted', async () => {
    const before = await loanWithOnePaid();

    const quote = await settle(api.quoteExtension(), LATENCY.getLoan);
    const after = await settle(api.extendLoan(quote!.pct), LATENCY.extendLoan);

    // The quote reads the balance the loan actually carries, so the screen's
    // three figures come from one source and add up.
    expect(quote!.outstanding).toBe(outstandingAfter(before!.schedule, before!.paidCount));
    expect(quote!.payToday + quote!.carried).toBe(quote!.outstanding);

    // `total` is lifetime cost, not a schedule sum — the mock derives it as
    // `alreadyRepaid + payToday + newOutstanding` precisely because slicing the
    // schedule breaks from the second extension on. That derivation is the
    // part most able to drift silently, so pin it.
    expect(after.total).toBe(before!.total - quote!.carried + quote!.newOutstanding);

    // The whole reason `quoteExtension` and `extendLoan` share one code path.
    // A quote that drifts from what is charged is the borrower agreeing to one
    // set of terms and being given another — and it would drift silently,
    // because nothing else compares the two.
    expect(after.schedule).toHaveLength(1);
    expect(after.schedule[0].amount).toBe(quote!.newOutstanding);
    expect(after.schedule[0].dueAt.getTime()).toBe(quote!.newDueAt.getTime());
    expect(after.extendedTo?.getTime()).toBe(quote!.newDueAt.getTime());
  });

  it('quotes the published terms — 30% carried 30 days', async () => {
    await loanWithOnePaid();
    const before = await settle(api.getLoan(), LATENCY.getLoan);
    const outstanding = outstandingAfter(before!.schedule, before!.paidCount);

    const quote = await settle(api.quoteExtension(), LATENCY.getLoan);

    // Decided from Migo's published FAQ, superseding the handoff's
    // 20%/same-duration (PLAN §5). The screen renders `pct` directly, so this
    // is the figure a borrower reads as "Pay today (30%)".
    expect(quote!.pct).toBe(0.3);
    expect(quote!.days).toBe(30);
    expect(quote!.payToday).toBe(Math.round(outstanding * 0.3));
    expect(quote!.payToday + quote!.carried).toBe(outstanding);
  });

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

/**
 * A real server keeps the loan when the app is killed. `restartMockApi` is
 * what a cold start does to the mock — it forgets what it holds in memory — so
 * whatever comes back after it was read from storage.
 */
describe('surviving a restart', () => {
  async function takeLoan() {
    const accounts = await settle(api.listAccounts(), LATENCY.listAccounts);
    return settle(
      api.acceptLoan({ tenor: TENORS[3], principal: 99_600, accountId: accounts[0].id }, 'sig'),
      LATENCY.acceptLoan,
    );
  }

  it('returns the same loan, balance and schedule after a restart', async () => {
    const loan = await takeLoan();
    restartMockApi();

    const after = await settle(api.getLoan(), LATENCY.getLoan);
    expect(after).toEqual(loan);
    // Dates come back as dates, not the strings JSON carries them as.
    expect(after!.schedule[0].dueAt).toBeInstanceOf(Date);
  });

  it('keeps a repayment', async () => {
    await takeLoan();
    const wallet = await settle(api.getWallet('sterling'), LATENCY.getWallet);
    await settle(api.watchPayment(wallet).promise, LATENCY.watchPayment);
    restartMockApi();

    expect((await settle(api.getLoan(), LATENCY.getLoan))?.paidCount).toBe(1);
  });

  it('keeps an extension', async () => {
    await takeLoan();
    const extended = await settle(api.extendLoan(EXTENSION.pct), LATENCY.extendLoan);
    restartMockApi();

    const after = await settle(api.getLoan(), LATENCY.getLoan);
    expect(after).toEqual(extended);
    expect(after!.extendedTo).toBeInstanceOf(Date);
  });

  it('keeps the loan when the borrower signs out, as a server would', async () => {
    const loan = await takeLoan();
    await signOutStorage();
    restartMockApi();

    await expect(settle(api.getLoan(), LATENCY.getLoan)).resolves.toEqual(loan);
  });

  it('starts empty when what is stored cannot be read', async () => {
    secureStoreMock.seed('migo.mock-server.v1', '{ not json');
    restartMockApi();

    await expect(settle(api.getLoan(), LATENCY.getLoan)).resolves.toBeNull();
    expect(await settle(api.listAccounts(), LATENCY.listAccounts)).toEqual(ACCOUNTS);
  });

  it('drops a stored loan whose dates did not survive', async () => {
    const loan = await takeLoan();
    secureStoreMock.seed(
      'migo.mock-server.v1',
      JSON.stringify({ loan: { ...loan, schedule: [{ index: 1, amount: 1, dueAt: 'soon' }] }, addedAccounts: [] }),
    );
    restartMockApi();

    await expect(settle(api.getLoan(), LATENCY.getLoan)).resolves.toBeNull();
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
