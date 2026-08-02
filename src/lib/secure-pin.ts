import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * The backup PIN.
 *
 * The `bind` screen tells the borrower the PIN is "kept on this phone only,
 * never sent to Migo". This module is what makes that true:
 *
 * - the PIN is **never** stored, only a salted SHA-256 hash of it
 * - the salt is random per device and stored alongside the hash
 * - neither the PIN nor the hash is ever held in React state
 * - the attempt counter lives in SecureStore, not memory, so force-quitting
 *   the app does not reset it
 *
 * **What this is not.** A single SHA-256 round is not a password KDF. Against
 * an attacker who has extracted the keystore contents, six digits fall to
 * brute force almost immediately whatever the hash. The real protection is the
 * platform keystore plus the lockout below — and on a commissioned build this
 * should move to a memory-hard KDF or, better, to a key the Secure Enclave /
 * StrongBox will not export. Recorded rather than implied.
 */

const KEYS = {
  hash: 'migo.pin.hash',
  salt: 'migo.pin.salt',
  attempts: 'migo.pin.attempts',
} as const;

/** Lockout threshold. A policy proposal, not a spec — see OPEN-QUESTIONS #6. */
export const MAX_ATTEMPTS = 5;

export const PIN_LENGTH = 6;

async function hashWith(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

function assertWellFormed(pin: string) {
  if (pin.length !== PIN_LENGTH || !/^\d+$/.test(pin)) {
    throw new RangeError(`PIN must be ${PIN_LENGTH} digits`);
  }
}

/** Sets the PIN. Overwrites any existing one and clears the attempt counter. */
export async function setPin(pin: string): Promise<void> {
  assertWellFormed(pin);

  const saltBytes = await Crypto.getRandomBytesAsync(16);
  const salt = Array.from(saltBytes, (b) => b.toString(16).padStart(2, '0')).join('');

  await SecureStore.setItemAsync(KEYS.salt, salt);
  await SecureStore.setItemAsync(KEYS.hash, await hashWith(pin, salt));
  await SecureStore.deleteItemAsync(KEYS.attempts);
}

export async function isPinSet(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEYS.hash)) !== null;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attemptsLeft: number }
  | { ok: false; reason: 'locked' }
  | { ok: false; reason: 'not-set' };

/**
 * Verifies a PIN, counting failures.
 *
 * The counter is checked *before* the comparison, so a locked-out device does
 * not keep testing candidates — and it is only cleared on success.
 */
export async function verifyPin(pin: string): Promise<VerifyResult> {
  const [hash, salt] = await Promise.all([
    SecureStore.getItemAsync(KEYS.hash),
    SecureStore.getItemAsync(KEYS.salt),
  ]);

  if (!hash || !salt) return { ok: false, reason: 'not-set' };

  const attempts = await getAttempts();
  if (attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked' };

  if ((await hashWith(pin, salt)) === hash) {
    await SecureStore.deleteItemAsync(KEYS.attempts);
    return { ok: true };
  }

  const next = attempts + 1;
  await SecureStore.setItemAsync(KEYS.attempts, String(next));

  return next >= MAX_ATTEMPTS
    ? { ok: false, reason: 'locked' }
    : { ok: false, reason: 'wrong', attemptsLeft: MAX_ATTEMPTS - next };
}

export async function getAttempts(): Promise<number> {
  const raw = await SecureStore.getItemAsync(KEYS.attempts);
  const parsed = Number.parseInt(raw ?? '0', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function isLockedOut(): Promise<boolean> {
  return (await getAttempts()) >= MAX_ATTEMPTS;
}

/** Sign-out. Clears PIN material; the durable slice is cleared separately. */
export async function clearPin(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.hash),
    SecureStore.deleteItemAsync(KEYS.salt),
    SecureStore.deleteItemAsync(KEYS.attempts),
  ]);
}
