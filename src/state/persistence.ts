import * as SecureStore from 'expo-secure-store';

/**
 * The durable slice, in SecureStore.
 *
 * Only what must survive a restart is written here. Session state (`authed`)
 * and transient selections (`tenor`, `amount`) are deliberately absent — a
 * borrower who backgrounds the app should come back to the lock screen, not
 * straight into a signed-in session.
 *
 * PIN material never passes through this module. It is written by
 * `lib/secure-pin.ts` under its own keys and never held in React state.
 */

const KEY = 'migo.durable.v1';

export type DurableState = {
  enrolled: boolean;
  deviceBound: boolean;
  /** Biometric enrolled on this device. */
  bio: boolean;
  pinSet: boolean;
  phone: string | null;
  name: string | null;
  /** Stands in for server-held loan state in this build. */
  loanTaken: boolean;
  paidCount: number;
  extended: boolean;
  payoutAccountId: string | null;
};

export const EMPTY: DurableState = {
  enrolled: false,
  deviceBound: false,
  bio: false,
  pinSet: false,
  phone: null,
  name: null,
  loanTaken: false,
  paidCount: 0,
  extended: false,
  payoutAccountId: null,
};

export async function load(): Promise<DurableState> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return EMPTY;
    // Spread over EMPTY so a state written by an older build is widened rather
    // than leaving new fields undefined.
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<DurableState>) };
  } catch {
    // Corrupt or unreadable state must not brick the app — a fresh start is
    // recoverable, a crash loop on boot is not.
    return EMPTY;
  }
}

export async function save(state: DurableState): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(state));
}

/** Sign-out. Clears the durable slice; PIN material is cleared separately. */
export async function clear(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
