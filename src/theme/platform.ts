import { Platform } from 'react-native';

import { radius } from './tokens';

/**
 * The Android/iOS divergences from HANDOFF §"Platform decision".
 *
 * Kept in one place because these are the differences an iOS-only dev loop
 * would miss until late — the plan calls that out as the riskiest drift in the
 * project (PLAN §9, "Android drift").
 *
 * Exposed as a **pure function of the target platform** rather than as
 * constants resolved from `Platform.OS` at import time. The demo overlay
 * switches platform at runtime so a walkthrough can show both without two
 * builds, and a module constant cannot change after import — it would have made
 * that switch silently inert. Components read these through `usePlatform()` in
 * `state/use-platform.ts`, which is the only place that decides which target
 * applies.
 */

export type TargetPlatform = 'android' | 'ios';

/** The platform this build is genuinely running on. */
export const runtimePlatform: TargetPlatform = Platform.OS === 'android' ? 'android' : 'ios';

export type PlatformTokens = {
  isAndroid: boolean;
  /** M3 full-pill buttons on Android; rounded rect on iOS. */
  buttonRadius: number;
  /**
   * Android has no in-screen back affordance on primary screens — the system
   * gesture is the only back. iOS gets a chevron plus the edge swipe.
   */
  showsInScreenBack: boolean;
  /** Biometric wording differs, and the prompt copy is user-facing. */
  biometric: {
    noun: string;
    /** `lock` screen prompt. */
    signInPrompt: string;
    /** `bind` screen call to action. */
    enrolTitle: string;
    enrolledTitle: string;
    /** `confirm` hold-to-accept caption. */
    signedWith: string;
  };
  /**
   * iOS gives the PIN pad equal prominence — many budget iPhones in this market
   * are Touch ID, and Face ID failure is common enough that PIN is not a
   * second-class path.
   */
  pinHasEqualProminence: boolean;
};

export function platformTokens(target: TargetPlatform): PlatformTokens {
  const isAndroid = target === 'android';

  return {
    isAndroid,
    buttonRadius: isAndroid ? radius.pill : radius.card,
    showsInScreenBack: !isAndroid,
    biometric: {
      noun: isAndroid ? 'fingerprint' : 'Face ID',
      signInPrompt: isAndroid ? 'Touch the sensor to sign in' : 'Glance at your phone to sign in',
      enrolTitle: isAndroid ? 'Use your fingerprint' : 'Use Face ID',
      enrolledTitle: isAndroid ? 'Fingerprint enrolled' : 'Face ID is on',
      signedWith: isAndroid
        ? 'Signed with your fingerprint on this device'
        : 'Signed with Face ID on this device',
    },
    pinHasEqualProminence: !isAndroid,
  };
}
