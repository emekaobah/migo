import * as SecureStore from 'expo-secure-store';

import type { Loan, PayoutAccount } from '../types';

/**
 * The mock's stand-in for a server's database.
 *
 * A real server keeps the borrower's loan across an app restart, so the mock
 * does too: it writes what it holds to device storage and reads it back on the
 * first call after a cold start. This is not a production design. It lives
 * behind `MigoApi` so that `LoanProvider` keeps mirroring the API and the real
 * HTTP client is still a drop-in, and it goes when `src/api/mock/` does.
 *
 * Signing out does not clear it. The sign-out screen promises the loan is
 * untouched, and on a real server it would be.
 */

const KEY = 'migo.mock-server.v1';

export type ServerState = {
  /** The single loan this build tracks. */
  loan: Loan | null;
  /** Accounts the borrower added, after the seeded ones. */
  addedAccounts: PayoutAccount[];
};

export const EMPTY_SERVER: ServerState = { loan: null, addedAccounts: [] };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** JSON carries dates as strings; an unparseable one makes the record unusable. */
function toDate(value: unknown): Date {
  const date = new Date(value as string);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) throw new TypeError('bad date');
  return date;
}

/**
 * Brings the loan's dates back. A loan whose dates did not survive would
 * quote a schedule due on `Invalid Date`, so it is dropped rather than shown.
 */
function revivedLoan(value: unknown): Loan | null {
  if (!isObject(value) || !Array.isArray(value.schedule) || !isObject(value.disbursedTo)) return null;

  return {
    ...(value as Loan),
    schedule: value.schedule.map((instalment: Record<string, unknown>) => ({
      ...(instalment as unknown as Loan['schedule'][number]),
      dueAt: toDate(instalment.dueAt),
    })),
    extendedTo: value.extendedTo === null ? null : toDate(value.extendedTo),
  };
}

export async function loadServer(): Promise<ServerState> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return EMPTY_SERVER;

    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return EMPTY_SERVER;

    return {
      loan: parsed.loan === null ? null : revivedLoan(parsed.loan),
      addedAccounts: Array.isArray(parsed.addedAccounts)
        ? (parsed.addedAccounts.filter(isObject) as PayoutAccount[])
        : [],
    };
  } catch {
    // As with the durable slice: a corrupt record starts the mock fresh rather
    // than failing every call that needs it.
    return EMPTY_SERVER;
  }
}

export async function saveServer(state: ServerState): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(state));
}

export async function clearServer(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
