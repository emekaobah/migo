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

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

/**
 * Rebuilds the durable slice field by field, checking each value's type.
 *
 * Storage outlives the code that wrote it, so a record can be well-formed JSON
 * and still hold the wrong shape — a field whose type changed between builds is
 * the realistic case. Casting parsed JSON to `DurableState` stops the compiler
 * asking, which is not the same as the value being right: a stored
 * `enrolled: "false"` is a truthy string, and `bootRedirect` reads `enrolled`
 * to decide whether someone has to enrol at all.
 *
 * Listing every field by hand is deliberate. It drops unknown keys by
 * construction — a field removed from `DurableState` cannot survive in storage
 * and reappear in state — and adding a field to `DurableState` makes this
 * function a type error until it is handled here.
 */
function validated(record: Record<string, unknown>): DurableState {
  return {
    enrolled: isBoolean(record.enrolled) ? record.enrolled : EMPTY.enrolled,
    deviceBound: isBoolean(record.deviceBound) ? record.deviceBound : EMPTY.deviceBound,
    bio: isBoolean(record.bio) ? record.bio : EMPTY.bio,
    pinSet: isBoolean(record.pinSet) ? record.pinSet : EMPTY.pinSet,
    phone: isNullableString(record.phone) ? record.phone : EMPTY.phone,
    name: isNullableString(record.name) ? record.name : EMPTY.name,
  };
}

export async function load(): Promise<DurableState> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return EMPTY;

    const parsed: unknown = JSON.parse(raw);
    // Valid JSON is not necessarily an object — `"42"` and `"[]"` both parse.
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return EMPTY;

    return validated(parsed as Record<string, unknown>);
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
