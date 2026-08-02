import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { Loan, Tenor, WalletBank } from '@/api/types';

/**
 * Loan domain state.
 *
 * `loanTaken` is stored, never inferred from the current screen — the handoff
 * attributes defects to deriving exactly this kind of flag.
 *
 * Selections made while shopping for an offer (`tenor`, `principal`) are
 * transient on purpose: abandoning the flow and coming back should start clean
 * rather than resume a half-made decision about borrowing money.
 */

type LoanState = {
  loan: Loan | null;
  loanTaken: boolean;
  /** Transient offer selections. */
  tenor: Tenor | null;
  principal: number | null;
  /** Payout account, and whether one has ever been chosen (routing depends on it). */
  accountId: string | null;
  accountChosen: boolean;
  /** Repayment selections. */
  payBank: WalletBank | null;
  walletSeen: boolean;
};

type Action =
  | { type: 'selectTenor'; tenor: Tenor }
  | { type: 'selectPrincipal'; principal: number }
  | { type: 'chooseAccount'; accountId: string }
  | { type: 'loanAccepted'; loan: Loan }
  | { type: 'loanLoaded'; loan: Loan | null }
  | { type: 'choosePayBank'; bank: WalletBank }
  | { type: 'walletSeen' }
  | { type: 'paymentReceived' }
  | { type: 'reset' };

const INITIAL: LoanState = {
  loan: null,
  loanTaken: false,
  tenor: null,
  principal: null,
  accountId: null,
  accountChosen: false,
  payBank: null,
  walletSeen: false,
};

function reducer(state: LoanState, action: Action): LoanState {
  switch (action.type) {
    case 'selectTenor':
      return { ...state, tenor: action.tenor };
    case 'selectPrincipal':
      return { ...state, principal: action.principal };
    case 'chooseAccount':
      return { ...state, accountId: action.accountId, accountChosen: true };
    case 'loanAccepted':
      return { ...state, loan: action.loan, loanTaken: true, tenor: null, principal: null };
    case 'loanLoaded':
      return { ...state, loan: action.loan, loanTaken: action.loan !== null };
    case 'choosePayBank':
      return { ...state, payBank: action.bank, walletSeen: false };
    case 'walletSeen':
      return { ...state, walletSeen: true };
    case 'paymentReceived':
      return state.loan
        ? { ...state, loan: { ...state.loan, paidCount: state.loan.paidCount + 1 } }
        : state;
    case 'reset':
      return INITIAL;
  }
}

type LoanContextValue = LoanState & {
  selectTenor: (tenor: Tenor) => void;
  selectPrincipal: (principal: number) => void;
  chooseAccount: (accountId: string) => void;
  loanAccepted: (loan: Loan) => void;
  loanLoaded: (loan: Loan | null) => void;
  choosePayBank: (bank: WalletBank) => void;
  markWalletSeen: () => void;
  paymentReceived: () => void;
  reset: () => void;
};

const LoanContext = createContext<LoanContextValue | null>(null);

export function LoanProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const value = useMemo<LoanContextValue>(
    () => ({
      ...state,
      selectTenor: (tenor) => dispatch({ type: 'selectTenor', tenor }),
      selectPrincipal: (principal) => dispatch({ type: 'selectPrincipal', principal }),
      chooseAccount: (accountId) => dispatch({ type: 'chooseAccount', accountId }),
      loanAccepted: (loan) => dispatch({ type: 'loanAccepted', loan }),
      loanLoaded: (loan) => dispatch({ type: 'loanLoaded', loan }),
      choosePayBank: (bank) => dispatch({ type: 'choosePayBank', bank }),
      markWalletSeen: () => dispatch({ type: 'walletSeen' }),
      paymentReceived: () => dispatch({ type: 'paymentReceived' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state],
  );

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
}

export function useLoan(): LoanContextValue {
  const value = useContext(LoanContext);
  if (!value) throw new Error('useLoan must be used inside LoanProvider');
  return value;
}
