import { color, onNavy } from '@/theme';

/**
 * WCAG 2.1 contrast, computed over the real token table (PLAN §8a).
 *
 * The handoff asks that the audit be preserved, not just performed once:
 * "#0E8B4B was darkened to #0A6D3B and #8A8DA3 to #62667E for this reason. Do
 * not reintroduce the lighter values." A test is the only form of that request
 * that survives a well-meaning tweak six months from now.
 *
 * Computed from `@/theme` rather than a transcribed copy, so it cannot drift
 * from what the app ships.
 */

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** Flatten an `rgba()` overlay onto an opaque backdrop. */
function flatten(rgba: string, backdrop: string): [number, number, number] {
  const parts = rgba.match(/[\d.]+/g)?.map(Number) ?? [];
  const [r, g, b, a] = parts as [number, number, number, number];
  const bg = hexToRgb(backdrop);
  return [r, g, b].map((c, i) => Math.round(c * a + bg[i] * (1 - a))) as [number, number, number];
}

function luminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 relative-contrast ratio, 1–21. */
export function contrast(fg: string, bg: string): number {
  const [lighter, darker] = [luminance(hexToRgb(fg)), luminance(hexToRgb(bg))].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Every foreground/background pair the app actually renders.
 *
 * Body text needs 4.5:1; UI components and graphical objects need 3:1
 * (WCAG 1.4.3 and 1.4.11).
 */
const TEXT_PAIRS: readonly [string, string, string][] = [
  [color.text, color.surface, 'body text on the app surface'],
  [color.text, color.card, 'body text on a white card'],
  [color.textSecondary, color.card, 'secondary text on a card'],
  [color.textMuted, color.surface, 'caption on the app surface'],
  [color.textMuted, color.card, 'caption on a card'],
  [color.textMutedAlt, color.surfaceAlt, 'tenor pill sub-label, unselected'],
  [color.navy, color.surface, 'navy text and links on the surface'],
  [color.navy, color.card, 'navy label on a white control'],
  [color.navy, color.surfaceAlt, 'tonal button label'],
  [color.navy, color.amber, 'primary-amber button label'],
  [color.success, color.surface, "'You're approved' on offers"],
  [color.success, color.card, "'Paid' status word"],
  [color.warningText, color.warningBg, 'repayment panel text'],
  [color.warningText, color.card, "'Next' status word on a card"],
  [color.successText, color.successBg, 'extended-loan card title'],
  [color.successTextAlt, color.successBg, 'extended-loan card body'],
  [color.danger, color.surface, 'destructive label on the surface'],
  [color.danger, color.card, 'destructive label on a card'],
  [color.card, color.danger, 'label on a destructive button'],
  [color.card, color.success, 'label on the Repay button'],
  [color.card, color.navy, 'label on a navy button'],
  [color.card, color.ink, 'text on ink'],
  [color.amber, color.navy, 'amber figures on the navy card'],
  [color.errorOnNavy, color.navy, 'inline error on navy'],
  [color.successText, color.successAccent, 'tick glyph on the success disc'],
];

describe('text contrast — 4.5:1 (WCAG 1.4.3 AA)', () => {
  it.each(TEXT_PAIRS)('%s on %s — %s', (fg, bg, label) => {
    const ratio = contrast(fg, bg);
    // The label rides along so a failure names the screen, not just two hexes.
    expect({ label, ratio: Number(ratio.toFixed(2)) }).toEqual({
      label,
      ratio: expect.any(Number),
    });
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('non-text contrast — 3:1 (WCAG 1.4.11 AA)', () => {
  it('distinguishes cleared from remaining progress segments', () => {
    // The segmented progress bar on `active`. Also worded ("N of M payments
    // cleared"), so this is reinforcement rather than the sole signal.
    const track = flatten(onNavy.track, color.navy);
    const cleared = luminance(hexToRgb(color.successAccent));
    const remaining = luminance(track);
    const [lighter, darker] = [cleared, remaining].sort((a, b) => b - a);
    expect((lighter + 0.05) / (darker + 0.05)).toBeGreaterThanOrEqual(3);
  });

  it('keeps keypad digits legible on their key', () => {
    const key = flatten(onNavy.keypad, color.navy);
    const digit = luminance(hexToRgb(color.card));
    expect((digit + 0.05) / (luminance(key) + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the two colours the handoff forbids', () => {
  /**
   * Both were darkened for AA and the handoff asks explicitly that they never
   * come back. Asserted against the token *values*, not the file text — an
   * earlier version of this audit grepped the source and reported both as
   * present, because they appear in the comment that forbids them.
   */
  /*
   * The hex-literal lint rule is disabled for exactly these two lines, and
   * nowhere else. This is the one place in the codebase where writing a
   * forbidden colour is the point: the assertion is that it does *not* appear
   * in the palette, which cannot be expressed without naming it.
   */
  it.each([
    // eslint-disable-next-line no-restricted-syntax
    ['#0E8B4B', 'was darkened to `success`'],
    // eslint-disable-next-line no-restricted-syntax
    ['#8A8DA3', 'was darkened to `textMuted`'],
  ])('%s is absent from the palette — it %s', (forbidden) => {
    expect(Object.values(color)).not.toContain(forbidden);
    expect(Object.values(color).map((c) => c.toUpperCase())).not.toContain(forbidden.toUpperCase());
  });
});

/**
 * Recorded, not asserted.
 *
 * These sit below 3:1 and are **not** WCAG failures — pressed feedback is not
 * required to meet a contrast ratio against its resting state, and the press is
 * confirmed by the action that follows. But the handoff asks for "pressed
 * states on every tappable surface", and at 1.09 that state is close to
 * invisible on a low-end screen in daylight, which PLAN §8 calls the actual
 * market. Captured here so the numbers are in the repo rather than in a
 * one-off script, and flagged in the accessibility report for a design call.
 */
describe('pressed-state separation (recorded, not a gate)', () => {
  /**
   * The measured values, pinned.
   *
   * An earlier version computed these and asserted only `> 1`, which let a
   * ratio fall from 1.09 to 1.001 without failing — so the numbers were not
   * actually recorded anywhere, despite the comment saying they were. Pinning
   * them means weakening a pressed state is a deliberate edit to this table
   * rather than something that happens quietly.
   *
   * These are **not** a WCAG gate. Press feedback needs no contrast ratio
   * against its resting state, and the action confirms the press. They are here
   * because the handoff asks for pressed states everywhere and 1.09 is close to
   * invisible on the low-end screens PLAN §8 calls the actual market — see
   * docs/ACCESSIBILITY.md, open finding B.
   */
  const MEASURED: Readonly<Record<string, number>> = {
    'navy → navyPressed': 1.09,
    'card → cardPressed': 1.15,
    'surfaceAlt → surfaceAltPressed': 1.19,
    'amber → amberPressed': 1.27,
    'success → successPressed': 1.35,
    'danger → dangerPressed': 1.36,
  };

  it.each([
    ['navy → navyPressed', color.navy, color.navyPressed],
    ['card → cardPressed', color.card, color.cardPressed],
    ['surfaceAlt → surfaceAltPressed', color.surfaceAlt, color.surfaceAltPressed],
    ['amber → amberPressed', color.amber, color.amberPressed],
    ['success → successPressed', color.success, color.successPressed],
    ['danger → dangerPressed', color.danger, color.dangerPressed],
  ])('%s still measures what the report says', (label, rest, pressed) => {
    expect(Number(contrast(rest, pressed).toFixed(2))).toBe(MEASURED[label]);
  });
});
