import type { WalletBank } from '@/api/types';

/**
 * The two banks Migo issues wallets with (HANDOFF §13), named once.
 *
 * Both the chooser on `repay` and the wallet card on `wallet` render these
 * names. Kept in one map so adding a bank is one edit and the two screens
 * cannot disagree about what a bank is called.
 *
 * Fixed rather than fetched: these are not the borrower's accounts, they are
 * where Migo can open a wallet, and the pair is a property of the product. When
 * that stops being true it becomes an API call, and this file is what changes.
 */
export const WALLET_BANKS: Readonly<Record<WalletBank, string>> = {
  sterling: 'Sterling Bank',
  fidelity: 'Fidelity Bank',
} as const;

/** Stable order for the chooser — object key order is not a contract. */
export const WALLET_BANK_ORDER: readonly WalletBank[] = ['sterling', 'fidelity'] as const;
