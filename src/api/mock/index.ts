import {
  buildSchedule,
  computeExtension,
  nextInstalment,
  outstandingAfter,
  totalRepayable,
} from '@/lib/loan-math';

import type {
  AccountCodeRequest,
  Bank,
  Cancellable,
  ExtensionQuote,
  Loan,
  MigoApi,
  OfferSelection,
  Offers,
  PaymentEvent,
  PayoutAccount,
  Wallet,
  WalletBank,
} from '../types';
import { after, delay } from './delay';
import {
  ACCOUNTS,
  AMOUNTS,
  BANKS,
  BORROWER,
  BVN_PHONE,
  EXTENSION,
  LATENCY,
  OTHER_BVN_ACCOUNT,
  OTHER_BVN_HOLDER,
  TENORS,
  UNKNOWN_ACCOUNT,
  USSD,
  WALLETS,
} from './fixtures';
import { clearServer, EMPTY_SERVER, loadServer, saveServer, type ServerState } from './server-store';

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

/**
 * The loan and added accounts, as a server would hold them.
 *
 * Read from storage on the first call after a cold start, then held here; every
 * change is written back, so a restart finds what was left (`server-store.ts`).
 */
let held: Promise<ServerState> | null = null;

const server = () => (held ??= loadServer());

async function commit(next: ServerState) {
  held = Promise.resolve(next);
  await saveServer(next);
}

/**
 * Answers after `ms`, timed from the call rather than from when storage has
 * been read — so a slow read never lengthens the prototype's latencies.
 */
async function respond<T>(ms: number, compute: () => Promise<T>): Promise<T> {
  const [value] = await Promise.all([compute(), after(ms, null)]);
  return value;
}

const allAccounts = (state: ServerState) => [...ACCOUNTS, ...state.addedAccounts];

const bankName = (bankId: string) => BANKS.find((b) => b.id === bankId)?.name ?? bankId;

/**
 * Seeded accounts only carry a masked number, so "already on file" can only
 * mean the same bank and the same last four digits.
 */
const onFile = (state: ServerState, bankId: string, number: string) =>
  allAccounts(state).some((a) => a.bank === bankName(bankId) && a.maskedNumber.endsWith(number.slice(-4)));

const maskPhone = (phone: string) => `${phone.slice(0, 4)}••••${phone.slice(-4)}`;

/**
 * The one place an extension is computed.
 *
 * `quoteExtension` and `extendLoan` both go through here so the figures the
 * borrower agrees to are, by construction, the figures that get applied. Two
 * call sites doing the same arithmetic separately is exactly how a quote and a
 * charge drift apart.
 */
function extensionFor(loan: Loan, pct: number) {
  const outstanding = outstandingAfter(loan.schedule, loan.paidCount);
  // Extend from the date being extended past, not from today and not from the
  // loan's original maturity — extending a loan already late gives 30 days from
  // the missed date. `loan-math` documents and tests this.
  const extendFrom = nextInstalment(loan.schedule, loan.paidCount)?.dueAt ?? new Date();

  return {
    outstanding,
    ...computeExtension(outstanding, pct, EXTENSION.days, EXTENSION.rate, extendFrom),
  };
}

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
    return after(LATENCY.bindDevice, { ok: true, name: BORROWER.name, phone: BORROWER.phone });
  },

  async getOffers(): Promise<Offers> {
    return after(LATENCY.getOffers, { tenors: TENORS, amounts: AMOUNTS });
  },

  async listAccounts(): Promise<PayoutAccount[]> {
    return respond(LATENCY.listAccounts, async () => allAccounts(await server()));
  },

  async listBanks(): Promise<Bank[]> {
    return after(LATENCY.listBanks, BANKS);
  },

  async resolveAccount(_bankId: string, number: string) {
    if (number === UNKNOWN_ACCOUNT) return after(LATENCY.resolveAccount, null);
    const holder = number === OTHER_BVN_ACCOUNT ? OTHER_BVN_HOLDER : BORROWER.fullName;
    return after(LATENCY.resolveAccount, { holder });
  },

  /**
   * Refuses before sending anything. A real server would check the BVN the
   * bank returns against the one on file; here one fixture number stands in
   * for "someone else's account".
   */
  async requestAccountCode(bankId: string, number: string): Promise<AccountCodeRequest> {
    return respond(LATENCY.requestCode, async (): Promise<AccountCodeRequest> => {
      if (onFile(await server(), bankId, number)) return { ok: false, reason: 'already-added' };
      if (number === OTHER_BVN_ACCOUNT) return { ok: false, reason: 'different-bvn' };
      return { ok: true, maskedPhone: maskPhone(BVN_PHONE), resendIn: 60 };
    });
  },

  /**
   * Any six digits pass, as with the sign-in code. The refusals are checked
   * again: a server cannot trust that the code request came first.
   */
  async confirmAccount(bankId: string, number: string, code: string) {
    return respond(LATENCY.verifyCode, async () => {
      const state = await server();
      const refused = code.length !== 6 || onFile(state, bankId, number) || number === OTHER_BVN_ACCOUNT;
      if (refused) return { ok: false as const };

      const account: PayoutAccount = {
        id: `${bankId}-${number.slice(-4)}`,
        bank: bankName(bankId),
        maskedNumber: `••${number.slice(-4)}`,
        holder: BORROWER.fullName,
        type: 'Savings',
      };
      await commit({ ...state, addedAccounts: [...state.addedAccounts, account] });
      return { ok: true as const, account };
    });
  },

  async acceptLoan(selection: OfferSelection): Promise<Loan> {
    return respond(LATENCY.acceptLoan, async () => {
      const state = await server();
      const account = allAccounts(state).find((a) => a.id === selection.accountId) ?? ACCOUNTS[0];
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

      await commit({ ...state, loan });
      return loan;
    });
  },

  async getLoan(): Promise<Loan | null> {
    return respond(LATENCY.getLoan, async () => (await server()).loan);
  },

  /**
   * The wallet quotes **one instalment**, not the whole balance.
   *
   * It previously quoted the full outstanding while `watchPayment` cleared a
   * single instalment — so a 3-payment borrower was told to transfer the entire
   * debt and had one third of it marked paid. The two must describe the same
   * payment, and the handoff's `repay` copy ("Pay ₦X" above "Remaining after
   * this payment: ₦Y") is explicit that X is the instalment.
   */
  async getWallet(bank: WalletBank): Promise<Wallet> {
    return respond(LATENCY.getWallet, async () => {
      const { loan } = await server();
      const due = loan ? nextInstalment(loan.schedule, loan.paidCount) : null;

      return { bank, ...WALLETS[bank], amountDue: due?.amount ?? 0 };
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
      promise: pending.promise.then(async (event) => {
        const state = await server();
        if (state.loan) {
          await commit({ ...state, loan: { ...state.loan, paidCount: state.loan.paidCount + 1 } });
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
  async quoteExtension(): Promise<ExtensionQuote | null> {
    return respond(LATENCY.getLoan, async () => {
      const { loan } = await server();
      if (!loan) return null;

      const { outstanding, payToday, carried, newOutstanding, newDueAt } = extensionFor(
        loan,
        EXTENSION.pct,
      );

      return {
        pct: EXTENSION.pct,
        days: EXTENSION.days,
        outstanding,
        payToday,
        carried,
        newOutstanding,
        newDueAt,
      };
    });
  },

  // No default for `pct`: `MigoApi` declares it required, so a default here is
  // unreachable through the typed `api` object — dead code that reads like a
  // fallback. Callers pass the `pct` their quote was priced at.
  async extendLoan(pct: number): Promise<Loan> {
    return respond(LATENCY.extendLoan, async () => {
      const state = await server();
      const current = state.loan;
      if (!current) throw new Error('no loan to extend');

      const { outstanding, ...extension } = extensionFor(current, pct);

      // Everything paid across the loan's whole life, including any earlier
      // extension's `payToday`. Deriving this by slicing the schedule looks
      // equivalent and is not: an extension resets `paidCount` to 0 and replaces
      // the schedule, so from the second extension on the slice is empty and the
      // loan silently understates what it has cost. `total - outstanding` holds
      // at every point, starting from `acceptLoan` where total is the schedule's
      // sum and nothing is yet paid.
      const alreadyRepaid = current.total - outstanding;

      const loan: Loan = {
        ...current,
        // The old schedule is settled: instalments already cleared, plus today's
        // payment against the rest. What is left is one carried payment.
        schedule: [{ index: 1, amount: extension.newOutstanding, dueAt: extension.newDueAt }],
        paidCount: 0,
        // What the loan will have cost in total, once extended.
        total: alreadyRepaid + extension.payToday + extension.newOutstanding,
        extendedTo: extension.newDueAt,
      };

      await commit({ ...state, loan });
      return loan;
    });
  },
};

/** Test affordance — empties the stand-in server, in memory and in storage. */
export async function resetMockApi() {
  held = Promise.resolve(EMPTY_SERVER);
  await clearServer();
}

/**
 * Test affordance — what a cold start does to the mock: forgets what it holds
 * in memory, so the next call reads storage again.
 */
export function restartMockApi() {
  held = null;
}
