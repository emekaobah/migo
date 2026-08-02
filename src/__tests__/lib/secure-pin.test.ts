import * as SecureStore from 'expo-secure-store';

import {
  MAX_ATTEMPTS,
  clearPin,
  getAttempts,
  isLockedOut,
  isPinSet,
  setPin,
  verifyPin,
} from '@/lib/secure-pin';

/**
 * The `bind` screen promises the PIN is kept on this phone and never sent to
 * Migo. These assert the parts of that promise this module is responsible for.
 */

describe('setPin', () => {
  it('never stores the PIN itself', async () => {
    await setPin('123456');

    const stored = await Promise.all([
      SecureStore.getItemAsync('migo.pin.hash'),
      SecureStore.getItemAsync('migo.pin.salt'),
    ]);

    for (const value of stored) {
      expect(value).not.toBeNull();
      expect(value).not.toContain('123456');
    }
  });

  it('salts, so the same PIN hashes differently on two devices', async () => {
    await setPin('123456');
    const first = await SecureStore.getItemAsync('migo.pin.hash');

    await clearPin();
    await setPin('123456');
    const second = await SecureStore.getItemAsync('migo.pin.hash');

    expect(first).not.toBe(second);
  });

  it('rejects anything that is not six digits', async () => {
    await expect(setPin('12345')).rejects.toThrow(RangeError);
    await expect(setPin('1234567')).rejects.toThrow(RangeError);
    await expect(setPin('12345a')).rejects.toThrow(RangeError);
  });

  it('clears the attempt counter, so setting a new PIN unlocks', async () => {
    await setPin('123456');
    for (let i = 0; i < MAX_ATTEMPTS; i++) await verifyPin('000000');
    expect(await isLockedOut()).toBe(true);

    await setPin('654321');

    expect(await isLockedOut()).toBe(false);
    expect(await getAttempts()).toBe(0);
  });
});

describe('verifyPin', () => {
  beforeEach(async () => {
    await setPin('123456');
  });

  it('accepts the right PIN', async () => {
    await expect(verifyPin('123456')).resolves.toEqual({ ok: true });
  });

  it('rejects the wrong PIN and counts down', async () => {
    await expect(verifyPin('000000')).resolves.toEqual({
      ok: false,
      reason: 'wrong',
      attemptsLeft: MAX_ATTEMPTS - 1,
    });
  });

  it('resets the counter on success, so a near-miss is forgiven', async () => {
    await verifyPin('000000');
    await verifyPin('000000');
    expect(await getAttempts()).toBe(2);

    await verifyPin('123456');

    expect(await getAttempts()).toBe(0);
  });

  it(`locks out after ${MAX_ATTEMPTS} failures`, async () => {
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await expect(verifyPin('000000')).resolves.toMatchObject({ reason: 'wrong' });
    }

    await expect(verifyPin('000000')).resolves.toEqual({ ok: false, reason: 'locked' });
    expect(await isLockedOut()).toBe(true);
  });

  it('stays locked even for the correct PIN', async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) await verifyPin('000000');

    // The whole point of a lockout: knowing the PIN afterwards is not enough,
    // the borrower has to re-authorise the device over USSD.
    await expect(verifyPin('123456')).resolves.toEqual({ ok: false, reason: 'locked' });
  });

  it('does not keep counting once locked', async () => {
    for (let i = 0; i < MAX_ATTEMPTS + 3; i++) await verifyPin('000000');
    expect(await getAttempts()).toBe(MAX_ATTEMPTS);
  });

  it('reports not-set when no PIN exists', async () => {
    await clearPin();
    await expect(verifyPin('123456')).resolves.toEqual({ ok: false, reason: 'not-set' });
  });
});

describe('clearPin', () => {
  it('removes every trace, including the counter', async () => {
    await setPin('123456');
    await verifyPin('000000');

    await clearPin();

    expect(await isPinSet()).toBe(false);
    expect(await getAttempts()).toBe(0);
    expect(await SecureStore.getItemAsync('migo.pin.salt')).toBeNull();
  });
});
