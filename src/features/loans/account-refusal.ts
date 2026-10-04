import type { AccountRefusal } from '@/api/types';

/** What the borrower is told when an account cannot be added. */
export const ACCOUNT_REFUSAL: Record<AccountRefusal, string> = {
  'already-added': 'That account is already on file.',
  'different-bvn':
    'This account is linked to a different BVN. Only accounts in your own name can receive a Migo loan.',
};
