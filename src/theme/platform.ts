import { Platform } from 'react-native';

import { radius } from './tokens';

/**
 * The Android/iOS divergences from HANDOFF §"Platform decision".
 *
 * Kept in one place because these are the differences an iOS-only dev loop
 * would miss until late — the plan calls that out as the riskiest drift in the
 * project (PLAN §9, "Android drift").
 */

export const isAndroid = Platform.OS === 'android';

/** M3 full-pill buttons on Android; rounded rect on iOS. */
export const buttonRadius = isAndroid ? radius.pill : radius.card;

/**
 * Android has no in-screen back affordance on primary screens — the system
 * gesture is the only back. iOS gets a chevron plus the edge swipe.
 */
export const showsInScreenBack = !isAndroid;

/** Biometric wording differs, and the prompt copy is user-facing. */
export const biometric = {
  noun: isAndroid ? 'fingerprint' : 'Face ID',
  /** `lock` screen prompt. */
  signInPrompt: isAndroid ? 'Touch the sensor to sign in' : 'Glance at your phone to sign in',
  /** `bind` screen call to action. */
  enrolTitle: isAndroid ? 'Use your fingerprint' : 'Use Face ID',
  enrolledTitle: isAndroid ? 'Fingerprint enrolled' : 'Face ID is on',
  /** `confirm` hold-to-accept caption. */
  signedWith: isAndroid
    ? 'Signed with your fingerprint on this device'
    : 'Signed with Face ID on this device',
} as const;

/**
 * iOS gives the PIN pad equal prominence — many budget iPhones in this market
 * are Touch ID, and Face ID failure is common enough that PIN is not a
 * second-class path.
 */
export const pinHasEqualProminence = !isAndroid;
