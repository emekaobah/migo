import type { PayoutAccount, Tenor } from '../types';

/**
 * **Illustrative figures.** Amounts, tenors and multipliers come from the
 * prototype and are not Migo's real rate table (OPEN-QUESTIONS #3). They are
 * returned by `getOffers()` so no screen ever hard-codes a multiplier — real
 * figures are a change to this file, or to the HTTP client that replaces it.
 */

export const TENORS: Tenor[] = [
  { days: 14, payments: 1, multiplier: 1.1 },
  { days: 30, payments: 1, multiplier: 1.16 },
  { days: 60, payments: 2, multiplier: 1.27 },
  { days: 90, payments: 3, multiplier: 1.37 },
];

export const AMOUNTS = [49_900, 99_600, 199_700];

export const ACCOUNTS: PayoutAccount[] = [
  { id: 'gt-4412', bank: 'GTBank', maskedNumber: '••4412', holder: 'Tunde Adeyemi', type: 'Savings' },
  { id: 'za-8890', bank: 'Zenith Bank', maskedNumber: '••8890', holder: 'Tunde Adeyemi', type: 'Current' },
];

/**
 * Extension terms. **30% / 30 days, client-confirmed 2026-08-02**
 * (OPEN-QUESTIONS #1). Parameterised because a rate is a business input that
 * will change again — not because the decision is provisional.
 *
 * `rate` is the multiplier applied to the carried amount over those 30 days.
 * It is stated here rather than reused from the loan's own tenor multiplier: a
 * 90-day loan carries 1.37, and charging a 90-day rate for a 30-day extension
 * is a pricing decision nobody made. 1.16 is the published 30-day multiplier,
 * so a 30-day carry costs what 30 days costs. **Illustrative and unconfirmed —
 * the real extension rate is an open question for the client.**
 */
export const EXTENSION = { pct: 0.3, days: 30, rate: 1.16 } as const;

/** The USSD enrolment code shown when SMS never lands. */
export const USSD = { code: '419 736', validMinutes: 10 } as const;

/** Wallet details per destination bank (HANDOFF §13). */
export const WALLETS = {
  sterling: { accountNumber: '0123456789', accountName: 'MIGO — TUNDE ADEYEMI' },
  fidelity: { accountNumber: '9876543210', accountName: 'MIGO — TUNDE ADEYEMI' },
} as const;

/** The borrower this proposal build demonstrates with. */
export const BORROWER = { name: 'Tunde', fullName: 'Tunde Adeyemi', phone: '8031234567' } as const;

/**
 * Simulated server latency, in milliseconds.
 *
 * The prototype's timings, reproduced so the demo feels like the design rather
 * than like an instant local function — `getOffers` at 1800ms is precisely what
 * the `loading` screen exists to cover.
 *
 * These belong to the mock, not to the theme: they describe a backend being
 * stood in for, and when a real HTTP client replaces this file they disappear
 * with it rather than lingering in the design tokens.
 */
export const LATENCY = {
  requestCode: 0,
  verifyCode: 400,
  ussdCode: 0,
  bindDevice: 600,
  getOffers: 1800,
  listAccounts: 300,
  acceptLoan: 900,
  getLoan: 0,
  getWallet: 700,
  extendLoan: 900,
  /** The wallet transfer detection window. */
  watchPayment: 6000,
  /** Simulated SMS arrival — the real retriever needs a backend (PLAN §8a). */
  smsArrival: 3200,
  /** Support agent typing indicator, before a scripted reply lands. */
  agentTyping: 1600,
} as const;
