import type { Instalment, Tenor } from '@/lib/loan-math';

export type { Instalment, Tenor };

/** A payout destination the borrower already owns. */
export type PayoutAccount = {
  id: string;
  bank: string;
  /** Masked — only the last four digits are ever shown. */
  maskedNumber: string;
  holder: string;
  type: 'Savings' | 'Current';
};

export type OfferSelection = {
  tenor: Tenor;
  principal: number;
  accountId: string;
};

/**
 * What the borrower is approved for. Both halves come from the server together
 * because an amount is only meaningful against the tenor's multiplier.
 */
export type Offers = {
  tenors: Tenor[];
  amounts: number[];
};

export type Loan = {
  id: string;
  principal: number;
  /** Total repayable, including interest and fees. */
  total: number;
  tenor: Tenor;
  schedule: Instalment[];
  /** How many instalments have cleared. */
  paidCount: number;
  disbursedTo: PayoutAccount;
  /** Set once the loan has been extended. */
  extendedTo: Date | null;
};

/** The two banks Migo issues wallets with (HANDOFF §13). */
export type WalletBank = 'sterling' | 'fidelity';

export type Wallet = {
  bank: WalletBank;
  accountNumber: string;
  accountName: string;
  /** This instalment, not the whole balance — see `getWallet` in the mock. */
  amountDue: number;
};

/**
 * What an extension would cost, quoted before the borrower commits to it.
 *
 * The terms come back with the figures deliberately. `pct` and `days` are
 * business inputs that will change, and the `extend` screen has to render
 * "Pay today (30%)" and a new due date — so it needs the numbers themselves,
 * not just the result. Sending them over the interface is what keeps a rate out
 * of a screen and out of reach of `api/mock/`, which no screen may import
 * (PLAN §2).
 */
export type ExtensionQuote = {
  /** Fraction of the outstanding payable today, e.g. `0.3`. */
  pct: number;
  /** How long the remainder carries. */
  days: number;
  /**
   * Owed before the extension is applied. `payToday + carried` equals this.
   *
   * Quoted rather than left to the caller so all three figures on the screen
   * come from one reading of the balance — deriving this from a client-side
   * loan snapshot lets "You owe now" disagree with the split beneath it.
   */
  outstanding: number;
  payToday: number;
  carried: number;
  /** Owed on the carried amount once the extension rate is applied. */
  newOutstanding: number;
  newDueAt: Date;
};

export type PaymentEvent = {
  received: boolean;
  amount: number;
};

/**
 * A subscription that can be abandoned.
 *
 * `watchPayment` returns one of these rather than a bare promise because the
 * borrower leaves the wallet screen mid-wait all the time — and an
 * uncancellable timer produces the "state update on an unmounted component"
 * class of bug that reads as flakiness in tests (PLAN §6a).
 */
export type Cancellable<T> = {
  /** Resolves when the event arrives; never resolves if cancelled first. */
  promise: Promise<T>;
  cancel: () => void;
};

/**
 * The seam between screens and "the server".
 *
 * `src/api/mock` implements this with the prototype's timings. When a real
 * backend exists, an HTTP client replaces the mock and nothing above this line
 * changes — that is the whole point of the interface (PLAN §10).
 */
export interface MigoApi {
  requestCode(phone: string): Promise<{ resendSeconds: number }>;
  verifyCode(code: string): Promise<{ ok: boolean }>;
  ussdCode(): Promise<{ code: string; validMinutes: number }>;
  /**
   * Binds this handset. Returns the borrower's name because the server is what
   * knows it — a screen reaching into the fixtures for a display name would
   * mean rewriting the screen when a real backend arrives.
   */
  bindDevice(publicKey: string): Promise<{ ok: boolean; name: string }>;
  getOffers(): Promise<Offers>;
  listAccounts(): Promise<PayoutAccount[]>;
  acceptLoan(selection: OfferSelection, signature: string): Promise<Loan>;
  getLoan(): Promise<Loan | null>;
  getWallet(bank: WalletBank): Promise<Wallet>;
  watchPayment(wallet: Wallet): Cancellable<PaymentEvent>;
  /**
   * What extending would cost, without committing to it. Returns null when
   * there is no loan to extend.
   */
  quoteExtension(): Promise<ExtensionQuote | null>;
  extendLoan(pct: number): Promise<Loan>;
}
