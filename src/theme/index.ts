/**
 * Theme barrel — the only path screens import styling from (PLAN §2).
 *
 * Hex literals live in `tokens.ts` and nowhere else; eslint enforces that.
 */
import { color } from './tokens';

export { color, onNavy, radius, space, control, duration, type Color } from './tokens';
export { type, currency, fontFamily, type TypeRole } from './typography';
/**
 * Platform tokens are deliberately **not** re-exported as values. They depend
 * on which platform is being shown, which the demo overlay can change at
 * runtime — so components must read them through `usePlatform()` in
 * `state/use-platform.ts`. Exporting a resolved constant here is exactly the
 * mistake that made the overlay's platform switch do nothing.
 */
export {
  platformTokens,
  runtimePlatform,
  type PlatformTokens,
  type TargetPlatform,
} from './platform';

/** The surface the app boots on, before any screen mounts. */
export const BOOT_BACKGROUND = color.navy;
