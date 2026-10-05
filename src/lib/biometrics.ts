import * as LocalAuthentication from 'expo-local-authentication';
import { AppState, Platform } from 'react-native';

/**
 * Fingerprint / Face ID, with **real** capability detection.
 *
 * The order matters and is the documented one: hardware first, then whether
 * anything is enrolled, then authenticate. Skipping the first two produces a
 * prompt that fails for reasons the borrower cannot act on.
 *
 * PIN is a complete alternative here, not a fallback stub — plenty of handsets
 * in this market have no usable sensor, and on iOS the handoff gives the PIN
 * pad equal prominence because many budget iPhones are Touch ID.
 */

export type BiometricCapability =
  | { available: true; kind: 'fingerprint' | 'face' }
  | { available: false; reason: 'no-hardware' | 'not-enrolled' };

export async function capability(): Promise<BiometricCapability> {
  if (!(await LocalAuthentication.hasHardwareAsync())) {
    return { available: false, reason: 'no-hardware' };
  }
  if (!(await LocalAuthentication.isEnrolledAsync())) {
    return { available: false, reason: 'not-enrolled' };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

  // iOS reports Face ID where available; Android is overwhelmingly fingerprint
  // in this market even when the API lists face.
  return { available: true, kind: face && Platform.OS === 'ios' ? 'face' : 'fingerprint' };
}

/** The longest `authenticate` waits for the app to become active again. */
export const ACTIVE_WAIT_MS = 2000;

/**
 * Resolves once the app is no longer inactive, or after `ACTIVE_WAIT_MS`
 * regardless.
 *
 * The system biometric sheet makes the app inactive, and on iOS it is still
 * dismissing for about half a second after `authenticateAsync` resolves.
 * Navigating inside that window intermittently left the window blank in
 * end-to-end runs on the iOS simulator: the lock screen replaced itself with
 * `loading`, `loading` replaced itself with `active`, and nothing drew. Waiting
 * for the app to be active first takes the sheet's dismissal out of the race.
 * The cap means a platform that never reports `active` delays sign-in rather
 * than blocking it.
 */
export function untilActive(): Promise<void> {
  // Only `inactive` means a system sheet is still up. Android never reports
  // it, and an unknown state is no reason to hold sign-in.
  if (AppState.currentState !== 'inactive') return Promise.resolve();

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      subscription.remove();
      resolve();
    };
    const timer = setTimeout(done, ACTIVE_WAIT_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') done();
    });
  });
}

/**
 * Prompts. Returns whether the borrower authenticated — never throws, because
 * every caller has a PIN path to fall back to. Resolves only once the system
 * sheet has gone and the app is active again, so callers can navigate on the
 * result straight away (see `untilActive`).
 */
export async function authenticate(promptMessage: string): Promise<boolean> {
  const cap = await capability();
  if (!cap.available) return false;

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      // Keep the borrower inside our own PIN flow rather than the OS passcode,
      // so a lockout follows Migo's policy rather than the device's.
      disableDeviceFallback: true,
      cancelLabel: 'Use PIN instead',
    });
    await untilActive();
    return result.success;
  } catch {
    return false;
  }
}
