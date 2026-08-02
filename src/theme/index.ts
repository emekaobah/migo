/**
 * Theme barrel — the only path screens import styling from (PLAN §2).
 *
 * Phase 0 holds exactly one value: the navy the app boots on. Phase 1 replaces
 * this file with the full frozen token set (colour, typography, radius, spacing,
 * control heights) transcribed from HANDOFF §"Design tokens", plus the lint rule
 * banning hex literals outside `src/theme/`.
 *
 * Until then this is the single source of truth for the boot surface, so the
 * root layout and the boot route cannot drift apart.
 */
export const BOOT_BACKGROUND = '#010065';
