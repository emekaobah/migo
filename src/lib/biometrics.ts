import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

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

/**
 * Prompts. Returns whether the borrower authenticated — never throws, because
 * every caller has a PIN path to fall back to.
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
    return result.success;
  } catch {
    return false;
  }
}
