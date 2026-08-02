import * as Haptics from 'expo-haptics';

/**
 * Haptics, named by intent rather than by strength.
 *
 * Every call is fire-and-forget: a device without a taptic engine must not
 * make a keypress await anything.
 */

/** Keypad tick. */
export function tick() {
  void Haptics.selectionAsync();
}

/** Hold-to-accept completed, code accepted, payment received. */
export function success() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Validation failed, wrong PIN. */
export function error() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
