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
 *
 * **Loan state is deliberately absent.** It is server-held: in this build the
 * mock owns it (`api/mock/index.ts`), and `LoanProvider` mirrors what the API
 * returns rather than persisting its own copy. An earlier version carried
 * `loanTaken`, `paidCount`, `extended` and `payoutAccountId` here, but nothing
 * read them — two sources of truth for the same facts, the durable one frozen
 * at its defaults. When the mock needs to survive a restart, that belongs in
 * the mock, behind `MigoApi`, so the real HTTP client is still a drop-in.
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
};

export const EMPTY: DurableState = {
  enrolled: false,
  deviceBound: false,
  bio: false,
  pinSet: false,
  phone: null,
  name: null,
};

export async function load(): Promise<DurableState> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return EMPTY;

    // Take only the keys the current shape declares, then fill the rest from
    // EMPTY. This widens a record written by an *older* build, as before — and
    // it also narrows one written by a *newer* build, or by a build whose
    // fields have since been dropped. Spreading the parsed record wholesale did
    // only the first: fields removed from `DurableState` still arrived from
    // storage, flowed into React state, and were written straight back on the
    // next save, where they would sit for the life of the install.
    const stored = JSON.parse(raw) as Record<string, unknown>;
    const known = Object.fromEntries(
      Object.keys(EMPTY).filter((key) => stored[key] !== undefined).map((key) => [key, stored[key]]),
    ) as Partial<DurableState>;

    return { ...EMPTY, ...known };
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
