# Accessibility report

Against HANDOFF §"Accessibility", item by item. This is the Phase 8 exit
deliverable (PLAN §8).

Three columns matter throughout: what a machine verifies on every commit, what
still needs a device, and what is a genuine open finding. The third column is
the one usually left out.

| | |
|---|---|
| **Automated** | 270 tests, 20 suites. `src/__tests__/theme/contrast.test.ts` (30) and `src/__tests__/screens/a11y.test.tsx` (30) cover this list |
| **Still needs a device** | TalkBack, VoiceOver, low-end Android, biometric prompts |
| **Open findings** | 3, listed at the end. None block the build |

---

## 1. Text contrast ≥ 4.5:1, large text and UI ≥ 3:1

**Verified, automated.** All 25 text pairs the app renders pass, computed from
`@/theme` rather than a transcribed copy, so the audit cannot drift from what
ships.

Tightest margins, worth knowing before anyone adjusts a token:

| pair | ratio | headroom |
|---|---|---|
| `warningText` on `warningBg` — repayment panel | **4.59** | 0.09 |
| `textMuted` on `surface` — captions | 5.25 | 0.75 |
| `warningText` on `card` — "Next" status | 5.05 | 0.55 |

The repayment panel has almost none. Any future change to `#FFF3DC` or
`#8A6A1E` breaks AA, and the test will say so.

**The two forbidden colours are absent.** `#0E8B4B` (darkened to `success`) and
`#8A8DA3` (darkened to `textMuted`) do not appear in the palette, asserted
against the token *values*. An earlier version of this audit grepped the source
and reported both as present — they appear in the comment that forbids them.

Non-text: cleared vs remaining progress segments measure **5.85:1**, and keypad
digits **14.54:1** on their key.

## 2. No disabled buttons; validate on submit with an inline message

**Verified, automated — with one documented exception.**

`Button` has no `disabled` prop at all, and `conventions.test.tsx` forces one
through with `@ts-expect-error` to prove the component still works and still
reports `accessibilityState.disabled` falsy. `a11y.test.tsx` sweeps the same
claim across `Button`, `HoldButton`, `Chip`, `Row` and `Pill`.

Inline validation is exercised on `enrol` (short number), `offers` (no tenor, no
amount), `banks` (no account) and `repay` (no bank).

### The exception: `BiometricTarget` when there is no sensor

`src/features/session/biometric-target.tsx` renders `disabled={unavailable}`,
so the blanket claim "this app has no disabled controls" would be false.

The rule exists because a dead CTA gives a borrower no way to discover what is
wrong — which is a statement about **validation**. A Continue button greyed out
because a field is incomplete hides the fix. This is a different situation: the
handset has no fingerprint or face sensor, there is nothing the borrower can do
to change that, and pressing it could only raise a prompt that fails. The screen
already offers the PIN as a complete alternative rather than a fallback, and the
control's `accessibilityLabel` changes to say why it is unavailable, so a screen
reader user is told the reason rather than meeting silence.

The distinction is now asserted rather than described: `a11y.test.tsx` requires
`BiometricTarget` to be enabled whenever a sensor exists, and permits `disabled`
**only** in the unavailable case. Any future control that disables itself for
validation fails that policy.

## 3. Nothing depends on colour alone

**Verified, automated.**

- Payment status is the **word** Paid / Next / Upcoming, one of each asserted
- Selection carries `accessibilityRole="radio"` with `accessibilityState.selected`
- Accordion rows expose `accessibilityState.expanded`
- Wallet detection names itself: "Waiting for your transfer" → "Payment received"
- `SegmentedProgress` claims no interactive role; the count is stated in words
  beside it as "N of M payments cleared"

Both schedule components mark their rows `accessible` so VoiceOver announces the
composed sentence — including the status word — rather than reading the child
`Text` nodes separately and dropping the label. That was a real defect, found in
review on PR #15.

## 4. 48px targets, including back rows and quick-reply chips

**Verified, automated** for every control that declares a height: back rows,
chips, list rows, tenor pills, amount rows, the avatar (48 and 64), primary and
small buttons, and keypad keys at all three heights (50/54/56).

Two deliberate exemptions:

- **Inline links** in `confirm`'s fee sentence. WCAG 2.5.8 explicitly exempts a
  target "in a sentence or [whose] size is otherwise constrained by the
  line-height of non-target text". Making them 48px would break the paragraph.
- Controls sized by **content and padding** rather than a declared height
  (`biometric-card` measures 74px). The test cannot measure those; the device
  pass covers them.

## 5. Fixed-height controls need `flex-shrink: 0` inside scrolling columns

**Verified by audit, one gap fixed.** The handoff notes several controls were
being crushed before this was applied. Every interactive primitive carries it —
`Button`, `Card`, `Avatar`, `Pill`, `Chip`, `Row`, `HoldButton`, `Keypad`,
`HeaderRow` — with one exception found in this phase:

`biometric-target`'s 112px circle had no `flexShrink: 0`. Nothing is crushed
today because `lock` does not scroll, but it was the only interactive component
missing the convention, and the protection should not depend on a screen's
current scroll mode. Fixed.

## 6. Pressed states on every tappable surface

**One gap found and fixed.** `HeaderRow`'s back chevron and Help link had no
press feedback at all — and they appear on nearly every screen. They now dim to
`opacity: 0.55`, which reads correctly on navy, white and the app surface;
a background fill would have been wrong on two of the three.

`HoldButton` has no colour shift by design: the green sweep begins on `pressIn`
and is stronger feedback than a tint.

## 7. Haptics on keypad, hold-complete and error

**Verified.** All four screens using `Keypad` call `tick()` on each digit;
`HoldButton` fires a success notification at 100%; five screens fire the error
haptic alongside their inline message. Only the dev-only kitchen sink omits
them, which is correct for a reference page.

---

## Open findings

### A. Nothing identifies the search field's boundary at 3:1

| pair | ratio | needs |
|---|---|---|
| `border` vs its own fill | 1.60 | 3.0 |
| field fill vs page surface | 1.08 | 3.0 |

WCAG 1.4.11 requires 3:1 for visual information needed to identify a UI
component. The search field on `help` is white on a near-white surface with a
`#C9CCDC` border, so neither boundary reaches it. `Chip` uses the same token.

**Not changed.** `border` comes from the handoff's own token table, and PLAN §8a
is explicit that where the two disagree, the token table wins. It is also
arguable rather than clear-cut: the field carries a "Search help" placeholder,
which identifies it by other means.

**Needs:** a design decision on darkening `border` to ~3:1 against white. That
is the same kind of change the handoff already made twice for AA.

### B. Pressed states are technically compliant but nearly invisible

| state pair | ratio |
|---|---|
| navy → navyPressed | **1.09** |
| card → cardPressed | 1.15 |
| surfaceAlt → surfaceAltPressed | 1.19 |
| keypad rest → pressed | 1.66 |

These are **not** WCAG failures — press feedback is not required to meet a
contrast ratio against its resting state, and the action confirms the press. But
at 1.09 the state is close to invisible on a low-end screen in daylight, which
PLAN §8 calls the actual market.

Recorded in `contrast.test.ts` rather than asserted, so the numbers live in the
repo. **Needs:** a design call, not a code fix.

### C. The FAQ never mentions the wallet

"wallet" appears zero times across all 45 questions, while the entire repayment
flow is wallet-based. A borrower searching Help for "wallet" gets the empty
state. Tracked as OPEN-QUESTIONS #8; needs client content, not a synonym map.

---

## Not verifiable without hardware

Stated plainly rather than implied, per PLAN §6b.

| | |
|---|---|
| **TalkBack** (Android) | Walkthrough of all four journeys |
| **VoiceOver** (iOS) | Same. The composed-label fix in §3 specifically needs confirming by ear |
| **Low-end Android** | The actual market. Contrast in daylight and the §B pressed states are the things to look at |
| **Biometric prompts** | Maestro cannot satisfy either platform's prompt — see `.maestro/02-returning.yaml` |
| **Content sizing** | Large-text and display-scaling behaviour is untested |

The seven Maestro flows in `.maestro/` are written and cover the journeys, but
have not been run: Maestro is not installed in the environment they were
authored in, and they need a real build from an EAS profile. Running them is
Phase 9's first task, and `02-returning.yaml` documents why it alone cannot run
unattended.
