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
 */
export const EXTENSION = { pct: 0.3, days: 30 } as const;

/** The USSD enrolment code shown when SMS never lands. */
export const USSD = { code: '419 736', validMinutes: 10 } as const;

/** Wallet details per destination bank (HANDOFF §13). */
export const WALLETS = {
  sterling: { accountNumber: '0123456789', accountName: 'MIGO — TUNDE ADEYEMI' },
  fidelity: { accountNumber: '9876543210', accountName: 'MIGO — TUNDE ADEYEMI' },
} as const;

/** The borrower this proposal build demonstrates with. */
export const BORROWER = { name: 'Tunde', fullName: 'Tunde Adeyemi', phone: '8031234567' } as const;
