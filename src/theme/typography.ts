import { Platform, type TextStyle } from 'react-native';

import { color } from './tokens';

/**
 * Type roles from HANDOFF §"Design tokens" → Type.
 *
 * `micro` at 12/500 is the floor — nothing in this product is smaller, and the
 * accessibility audit depends on that. Currency roles carry tabular numerals so
 * amounts do not jitter as digits change.
 *
 * Android uses Roboto (the platform default, so no font file is bundled) and
 * iOS uses the system font.
 */

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** RN has no letter-spacing-in-em, so the handoff's em values are resolved per size. */
const tracking = (size: number, em: number) => size * em;

export const type = {
  /** 36–42 / 700, -0.025em, tabular. Loan principal, outstanding balance. */
  display: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: tracking(36, -0.025),
    color: color.text,
    ...tabular,
  },
  /** The larger display used on `success` (42px). */
  displayLarge: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: tracking(42, -0.025),
    color: color.text,
    ...tabular,
  },
  /** 25–29 / 700. Screen headings. */
  h1: {
    fontSize: 29,
    fontWeight: '700',
    lineHeight: 29 * 1.15,
    letterSpacing: tracking(29, -0.02),
    color: color.text,
  },
  /** The smaller H1 used on light surfaces (25px). */
  h1Small: {
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: tracking(25, -0.01),
    color: color.text,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: color.text,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: color.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: color.text,
  },
  meta: {
    fontSize: 14,
    fontWeight: '500',
    color: color.textSecondary,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: color.textMuted,
  },
  /** Floor. Never smaller — see the accessibility audit. */
  micro: {
    fontSize: 12,
    fontWeight: '500',
    color: color.textMuted,
  },
} satisfies Record<string, TextStyle>;

export type TypeRole = keyof typeof type;

/** Currency needs tabular numerals at every size it appears in. */
export const currency = tabular;

export const fontFamily = Platform.select({
  android: 'Roboto',
  default: undefined,
});
