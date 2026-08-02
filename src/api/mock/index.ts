import { buildSchedule, computeExtension, outstandingAfter, totalRepayable } from '@/lib/loan-math';
import { duration } from '@/theme';

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
import { ACCOUNTS, AMOUNTS, EXTENSION, TENORS, USSD, WALLETS } from './fixtures';

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
    return after(0, { resendSeconds: 60 });
  },

  async verifyCode(code: string) {
    return after(400, { ok: code.length === 6 });
  },

  async ussdCode() {
    return after(0, { ...USSD });
  },

  async bindDevice() {
    return after(600, { ok: true });
  },

  async getOffers(): Promise<{ tenors: Tenor[]; amounts: number[] }> {
    // 1800ms — this is what the `loading` screen exists to cover.
    return after(duration.loading, { tenors: TENORS, amounts: AMOUNTS });
  },

  async listAccounts(): Promise<PayoutAccount[]> {
    return after(300, ACCOUNTS);
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
    return after(900, loan);
  },

  async getLoan(): Promise<Loan | null> {
    return after(0, currentLoan);
  },

  async getWallet(bank: WalletBank): Promise<Wallet> {
    const outstanding = currentLoan
      ? outstandingAfter(currentLoan.schedule, currentLoan.paidCount)
      : 0;

    return after(700, {
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
    const pending = delay<PaymentEvent>(duration.walletDetect, {
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

  async extendLoan(pct: number = EXTENSION.pct): Promise<Loan> {
    if (!currentLoan) throw new Error('no loan to extend');

    const outstanding = outstandingAfter(currentLoan.schedule, currentLoan.paidCount);
    const nextDue = currentLoan.schedule[currentLoan.paidCount]?.dueAt ?? new Date();

    const extension = computeExtension(
      outstanding,
      pct,
      EXTENSION.days,
      currentLoan.tenor.multiplier,
      nextDue,
    );

    currentLoan = { ...currentLoan, extendedTo: extension.newDueAt };
    return after(900, currentLoan);
  },
};

/** Test and demo affordance — resets the stand-in server state. */
export function resetMockApi() {
  currentLoan = null;
}

/** Demo affordance — seeds an active loan without walking the whole journey. */
export function seedLoan(loan: Loan) {
  currentLoan = loan;
}
