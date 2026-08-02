/**
 * Theme barrel — the only path screens import styling from (PLAN §2).
 *
 * Hex literals live in `tokens.ts` and nowhere else; eslint enforces that.
 */
import { color } from './tokens';

export { color, onNavy, radius, space, control, duration, type Color } from './tokens';
export { type, currency, fontFamily, type TypeRole } from './typography';
export {
  isAndroid,
  buttonRadius,
  showsInScreenBack,
  biometric,
  pinHasEqualProminence,
} from './platform';

/** The surface the app boots on, before any screen mounts. */
export const BOOT_BACKGROUND = color.navy;
