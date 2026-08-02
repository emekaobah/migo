import { buildSchedule, computeExtension, outstandingAfter, totalRepayable } from '@/lib/loan-math';

import type {
  Cancellable,
  Loan,
  MigoApi,
  OfferSelection,
  PaymentEvent,
  PayoutAccount,
  Tenor,
  Wallet,
  WalletBank,
} from '../types';
import { after, delay } from './delay';
import {
  ACCOUNTS,
  AMOUNTS,
  BORROWER,
  EXTENSION,
  LATENCY,
  TENORS,
  USSD,
  WALLETS,
} from './fixtures';

/**
 * The mock `MigoApi`.
 *
 * Mocks the **capability**, not the transport — there is no endpoint list, no
 * auth scheme and no error envelope to reproduce, so inventing a wire protocol
 * would only have to be rewritten when the real contract arrives (PLAN §6a).
 *
 * Latencies are the prototype's, so the demo feels like the design rather than
 * like an instant local function.
 */

/** The single loan this build tracks. Server state stands in for a database. */
let currentLoan: Loan | null = null;

export const mockApi: MigoApi = {
  async requestCode() {
    return after(LATENCY.requestCode, { resendSeconds: 60 });
  },

  async verifyCode(code: string) {
    return after(LATENCY.verifyCode, { ok: code.length === 6 });
  },

  async ussdCode() {
    return after(LATENCY.ussdCode, { ...USSD });
  },

  async bindDevice() {
    return after(LATENCY.bindDevice, { ok: true, name: BORROWER.name });
  },

  async getOffers(): Promise<{ tenors: Tenor[]; amounts: number[] }> {
    return after(LATENCY.getOffers, { tenors: TENORS, amounts: AMOUNTS });
  },

  async listAccounts(): Promise<PayoutAccount[]> {
    return after(LATENCY.listAccounts, ACCOUNTS);
  },

  async acceptLoan(selection: OfferSelection): Promise<Loan> {
    const account = ACCOUNTS.find((a) => a.id === selection.accountId) ?? ACCOUNTS[0];
    const total = totalRepayable(selection.principal, selection.tenor.multiplier);

    const loan: Loan = {
      id: `loan-${selection.principal}-${selection.tenor.days}`,
      principal: selection.principal,
      total,
      tenor: selection.tenor,
      schedule: buildSchedule(selection.principal, selection.tenor, new Date()),
      paidCount: 0,
      disbursedTo: account,
      extendedTo: null,
    };

    currentLoan = loan;
    return after(LATENCY.acceptLoan, loan);
  },

  async getLoan(): Promise<Loan | null> {
    return after(LATENCY.getLoan, currentLoan);
  },

  async getWallet(bank: WalletBank): Promise<Wallet> {
    const outstanding = currentLoan
      ? outstandingAfter(currentLoan.schedule, currentLoan.paidCount)
      : 0;

    return after(LATENCY.getWallet, {
      bank,
      ...WALLETS[bank],
      amountDue: outstanding,
    });
  },

  /**
   * Resolves after 6s, and can be abandoned. The real trigger is the payment
   * webhook; whether that ends up a poll, a push or a socket, the `wallet`
   * screen does not change.
   */
  watchPayment(wallet: Wallet): Cancellable<PaymentEvent> {
    const pending = delay<PaymentEvent>(LATENCY.watchPayment, {
      received: true,
      amount: wallet.amountDue,
    });

    return {
      promise: pending.promise.then((event) => {
        if (currentLoan) {
          currentLoan = { ...currentLoan, paidCount: currentLoan.paidCount + 1 };
        }
        return event;
      }),
      cancel: pending.cancel,
    };
  },

  /**
   * Pay `pct` of the outstanding now; the remainder carries `EXTENSION.days`
   * with `EXTENSION.rate` applied to it.
   *
   * The result is **applied**, not just reported: the old schedule is settled
   * and replaced by the single carried payment at the new due date. Returning a
   * loan whose `extendedTo` had moved while its schedule still described the
   * old debt would leave `outstandingAfter` quoting the pre-extension figure,
   * and the `active` screen reads exactly that.
   */
  async extendLoan(pct: number = EXTENSION.pct): Promise<Loan> {
    if (!currentLoan) throw new Error('no loan to extend');

    const outstanding = outstandingAfter(currentLoan.schedule, currentLoan.paidCount);
    // Extend from the date being extended past, not from today and not from the
    // loan's original maturity — extending a loan already late gives 30 days
    // from the missed date. `loan-math` documents and tests this.
    const nextDue = currentLoan.schedule[currentLoan.paidCount]?.dueAt ?? new Date();

    const extension = computeExtension(
      outstanding,
      pct,
      EXTENSION.days,
      EXTENSION.rate,
      nextDue,
    );

    // Everything paid across the loan's whole life, including any earlier
    // extension's `payToday`. Deriving this by slicing the schedule looks
    // equivalent and is not: an extension resets `paidCount` to 0 and replaces
    // the schedule, so from the second extension on the slice is empty and the
    // loan silently understates what it has cost. `total - outstanding` holds
    // at every point, starting from `acceptLoan` where total is the schedule's
    // sum and nothing is yet paid.
    const alreadyRepaid = currentLoan.total - outstanding;

    currentLoan = {
      ...currentLoan,
      // The old schedule is settled: instalments already cleared, plus today's
      // payment against the rest. What is left is one carried payment.
      schedule: [{ index: 1, amount: extension.newOutstanding, dueAt: extension.newDueAt }],
      paidCount: 0,
      // What the loan will have cost in total, once extended.
      total: alreadyRepaid + extension.payToday + extension.newOutstanding,
      extendedTo: extension.newDueAt,
    };

    return after(LATENCY.extendLoan, currentLoan);
  },
};

/** Test affordance — resets the stand-in server state between cases. */
export function resetMockApi() {
  currentLoan = null;
}
