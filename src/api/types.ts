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
  amountDue: number;
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
  bindDevice(publicKey: string): Promise<{ ok: boolean }>;
  getOffers(): Promise<{ tenors: Tenor[]; amounts: number[] }>;
  listAccounts(): Promise<PayoutAccount[]>;
  acceptLoan(selection: OfferSelection, signature: string): Promise<Loan>;
  getLoan(): Promise<Loan | null>;
  getWallet(bank: WalletBank): Promise<Wallet>;
  watchPayment(wallet: Wallet): Cancellable<PaymentEvent>;
  extendLoan(pct: number): Promise<Loan>;
}
