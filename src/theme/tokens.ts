/**
 * Design tokens — transcribed once from HANDOFF §"Design tokens", frozen.
 *
 * This file is the contract. Nothing downstream may write a hex literal; the
 * `no-restricted-syntax` rule in eslint.config.js enforces that outside this
 * directory. Where the prototype's inline styles and this table disagree, this
 * table wins — it is the deduplicated set, the prototype is the raw material.
 *
 * Two values are deliberately absent and must not come back: `#0E8B4B` was
 * darkened to `success` and `#8A8DA3` to `textMuted`, both for WCAG AA. The
 * handoff asks explicitly that the lighter values never be reintroduced.
 */

export const color = {
  // brand
  navy: '#010065',
  navyPressed: '#000047',
  amber: '#FFB020',
  amberPressed: '#E89A0C',
  ink: '#0B0B1A',

  // neutrals
  surface: '#F7F6FB',
  surfaceAlt: '#EFEDF6',
  surfaceAltPressed: '#DCD9EC',
  card: '#FFFFFF',
  cardPressed: '#F0EEF8',
  text: '#1B1B22',
  textSecondary: '#5A5D75',
  textMuted: '#62667E',
  textMutedAlt: '#494C5E',
  border: '#C9CCDC',
  divider: '#EDEFF6',

  // semantic
  success: '#0A6D3B',
  successPressed: '#085730',
  successBg: '#E8F1EA',
  successText: '#1E4D33',
  successTextAlt: '#3F6B4F',
  successAccent: '#3BD97F',
  warningBg: '#FFF3DC',
  warningText: '#8A6A1E',
  danger: '#B3261E',
  dangerPressed: '#8F1D17',
  dangerBg: '#F7E4E3',
  errorOnNavy: '#FFC96B',
} as const;

/** White overlays used on the navy surface. */
export const onNavy = {
  label: 'rgba(255,255,255,0.66)',
  caption: 'rgba(255,255,255,0.6)',
  track: 'rgba(255,255,255,0.2)',
  divider: 'rgba(255,255,255,0.18)',
  keypad: 'rgba(255,255,255,0.1)',
  keypadPressed: 'rgba(255,255,255,0.26)',
} as const;

export const radius = {
  pill: 100,
  card: 16,
  row: 14,
  panel: 12,
  code: 10,
  tail: 4,
} as const;

/** 4pt grid. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/**
 * Control heights. `tap` is the universal 48px minimum from the accessibility
 * audit and applies to back rows and chips too, not just buttons.
 */
export const control = {
  tap: 48,
  button: 56,
  buttonSm: 52,
  keyLg: 56,
  keyMd: 54,
  keySm: 50,
} as const;

/**
 * Presentation timings — animations and deliberate beats (HANDOFF
 * §"Interactions").
 *
 * Simulated **server** latency is not here. It lives in `api/mock/fixtures.ts`
 * as `LATENCY`, because how long a request takes is a property of the backend
 * being stood in for, not of the design system — and keeping it here made the
 * API layer import the theme.
 */
export const duration = {
  /** Beat after the code fills itself in, before `otp` advances. */
  otpAdvance: 1400,
  /** "Recognised — opening…" on `lock`. */
  biometric: 700,
  /** Hold-to-accept sweep interval; 6% per step. */
  holdStep: 60,
  /** Balance settling on `wallet` once payment is detected. */
  walletSettle: 1400,
  /** One full rotation of the loading spinner. */
  spinner: 900,
} as const;

export type Color = keyof typeof color;
