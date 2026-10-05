# Accessibility report

The design handoff's accessibility checklist, checked item by item.

Three things matter throughout: what a machine verifies on every commit, what
still needs a device, and what is a genuine open finding. The third is the one
usually left out.

| | |
|---|---|
| **Automated** | 320 tests, 23 suites. `theme/contrast.test.ts` (35) and `screens/a11y.test.tsx` (32) cover this list |
| **Still needs a device** | TalkBack, VoiceOver, low-end Android, biometric prompts on physical hardware |
| **Open findings** | 2, listed at the end. Neither blocks the build |

---

## Status

Stated up front so a green CI badge does not read as finished work.

| check | status |
|---|---|
| The handoff's checklist, item by item | ✅ this document |
| Contrast, targets, colour, sizing conventions | ✅ automated, §§1–5 below |
| Pressed states on every tappable surface | ✅ one gap found and fixed (§6) |
| Haptics on keypad, hold-complete, error | ✅ verified (§7) |
| `pnpm test` | ✅ 320 across 23 suites |
| **Seven Maestro flows green on both platforms** | ⚠️ **`01` passes on both; `02`–`07` failed in the close-out run and are due a re-run** — see [E2E results](#e2e-results-close-out) |
| **TalkBack walkthrough** | ❌ **not done** |
| **VoiceOver walkthrough** | ❌ **not done** |
| **Low-end Android device pass** | ❌ **not done** |
| **Biometric sign-in verified by hand** | ⚠️ **Android emulator fingerprint and iOS simulator Face ID only** — see [Manual checks](#manual-checks) |

### Why the rest is outstanding

Most remaining items need hardware. In the close-out run, flows `02`–`07`
failed for one shared reason: the mock API held the loan in memory, so each
flow's cold `launchApp` lost it. The mock now stores the loan across restarts
(#26). The table below records the run as it happened, against builds made
before that fix, and will be updated after a re-run on fresh builds.

`.maestro/02-returning.yaml` still cannot run unattended under Maestro alone:
`runScript` has no shell access, so the biometric match has to come from
another shell. On Android that is `adb emu finger touch 1`. On the iOS
simulator it is a `notifyutil` notification (the flow's header gives both):
`xcrun simctl spawn <udid> notifyutil -p com.apple.BiometricKit_Sim.pearl.match`
(see Manual checks). The flow is left out of the ordered suite in
`config.yaml` for that reason. `03-pin-fallback.yaml` covers the same journey
by PIN.

## E2E results (close-out)

| Flow | Android | iOS |
|---|---|---|
| `01-first-run` | ✅ pass | ✅ pass (with no Face ID enrolled on the simulator) |
| `02-returning` | ❌ fail — fingerprint sign-in completes (match sent with `adb emu finger touch 1`), but the app lands on offers, not `Your loan`, because the mock's loan does not survive the cold start | ❌ fail — run on its own with Face ID enrolled and the match sent from a shell: sign-in completes, but the app lands on offers, not `Your loan`, because the mock's loan does not survive the cold start |
| `03-pin-fallback` | ❌ fail — PIN sign-in completes, then lands on offers, not `Your loan` (same cause) | ❌ fail — PIN sign-in completes, then lands on offers, not `Your loan` (same cause) |
| `04-repayment` | ❌ fail — `sign-in` helper does not reach `Your loan` (same cause) | ❌ fail — `sign-in` helper times out waiting for `Your loan` (same cause) |
| `05-extension` | ❌ fail — `sign-in` helper does not reach `Your loan` (same cause) | ❌ fail — `sign-in` helper times out waiting for `Your loan` (same cause) |
| `06-support` | ❌ fail — `sign-in` helper does not reach `Your loan` (same cause) | ❌ fail — `sign-in` helper times out waiting for `Your loan` (same cause) |
| `07-new-device` | ❌ fail — `sign-in` helper does not reach `Your loan` (same cause) | ❌ fail — `sign-in` helper times out waiting for `Your loan` (same cause) |

Android build: EAS profile `preview` (APK, internal distribution, Release, not a
dev client), EAS build `0bdee829-1222-461d-bd85-1b89e6b2b1e5`, built remotely
on 2026-10-04 from commit `a5e921e`. Install link:
<https://expo.dev/accounts/emekaobah/projects/migo/builds/0bdee829-1222-461d-bd85-1b89e6b2b1e5>.
The APK was installed with `adb install` on the `Medium_Phone_API_36.0`
emulator (the image reports Android 17, API level 37) and run with Maestro
2.10.0. Installing from the link onto a physical phone has not been tried yet.
The Android run took about 1h20m of its half-day timebox, including the build.

iOS build: EAS profile `preview-simulator` (Release, not a dev client), EAS
build `4edafb2b-dc3d-4848-b25b-10e0175dd811`, built remotely on 2026-10-04 from
`main` at `a5e921e` plus the new profile (EAS records the commit as `c5a1b53`). Installed with
`xcrun simctl install` on an iPhone 16 simulator running iOS 18.3, and run with
Maestro 2.10.0. A fresh install opens on enrolment. A deep link to the dev-only
`kitchen-sink` route redirects back to it, so no developer screen is reachable.
The iOS run took about 55 minutes of its half-day timebox.

**Same cause** means the mock API keeps the loan in memory
(`src/api/mock/index.ts`). It is designed to be server-held, and
`persistence.ts` deliberately leaves it out, so a cold start has no loan.
It was recorded here at the time rather than fixed; the mock has since been
changed to keep the loan across a restart (#26). To check the journeys themselves, `04`–`07`
were each run once more with their `launchApp` + `sign-in` steps replaced by
`runFlow: 01-first-run.yaml`, which keeps the loan in the same app session.
With the fixes below, all four passed that way on both platforms. Those were
diagnostic runs, not the committed flows.

Other things that showed up while running the suite:

- Running `maestro test .maestro` with Maestro 2.10 ran all seven flows,
  including `02-returning`, so the `config.yaml` list was not applied. The
  likely cause is the file itself rather than Maestro: it is written as a flow
  (`appId`, `---`, then `flows:`), so the `flows:` list in the second document
  is probably never read, and it has no `executionOrder`. Not fixed here.
- `01-first-run` passes unattended only while no biometric is enrolled on the
  device. With Face ID enrolled on the simulator or a fingerprint enrolled on
  the emulator, hold-to-accept also asks for it and the flow stalls at the
  system prompt. On Android it also passed with a fingerprint enrolled and
  `adb emu finger touch 1` sent from a watcher script when the prompt appeared.

Flow fixes made during the run. They change selectors and steps only, not app
code. The `01` edits pass as committed on both platforms; the `06` and `07`
edits only passed in the diagnostic runs above, because the committed flows fail
at sign-in first:

- `01`: removed `duration: 1500` from `longPressOn`, because Maestro 2.10
  rejects it as an unknown property and the flow would not parse. The built-in
  long press is long enough for the hold.
- `01`: updated stale copy. `Sign in to Migo` became
  `Sign in or create your Migo account`, and `.*[Ee]nrolment code.*` became
  `Enter the code we sent you`.
- `01`: `30 days` became `30 days.*` and `Paid into` became `Paid into.*`,
  because on iOS the accessible label also includes the payment count and the
  account.
- `01`: added `waitForAnimationToEnd` before the PIN taps. Without it, one of
  the six taps was lost on iOS.
- `06`: `Chat with support` became `Chat with support.*`, because the card's
  label carries the reply time.
- `06`: added `pressKey: Enter` after clearing the search. Otherwise the iOS
  keyboard covers the section list, and the next tap lands on a key.
- `06`: going back now uses a new `helpers/back.yaml`. It taps the in-screen
  `Back` control on iOS and uses the system back on Android. A plain
  `tapOn: 'Back'` fails on Android, because `HeaderRow` leaves out the
  in-screen back control there by design, and a plain `back` does nothing on
  iOS. The iOS run used `tapOn: 'Back'` directly; the helper's iOS branch is the
  same step but has not been re-run.
- `07`: the avatar is now tapped by its label (`Account, .*`) instead of
  `point: '90%,8%'`, which missed it on iPhone 16.
- `07`: the `We don't recognise this phone.` heading has no trailing full
  stop, so the selector no longer has one.

### Manual checks

- **Face ID returning sign-in (iOS simulator): ✅ pass.** This checks the
  biometric sign-in itself; where the app lands afterwards is the `02` row's
  failure, not this check's. Face ID was enrolled
  with `notifyutil -s com.apple.BiometricKit.enrollmentChanged 1` (then `-p`).
  After enrolling in the app, a cold start showed the lock screen. Tapping the
  biometric target raised the system Face ID sheet.
  `com.apple.BiometricKit_Sim.pearl.match` signed in and went on to the
  post-sign-in screen (offers, for the reason above).
  `com.apple.BiometricKit_Sim.pearl.nomatch` showed iOS's "Face Not
  Recognized" alert, with "Use PIN instead" as the fallback. Face ID signing on
  hold-to-accept also completed on a match. This was a simulator, not a
  physical device.
- **Fingerprint returning sign-in (Android emulator): ✅ pass.** A fingerprint
  was enrolled in the emulator's Settings, with the touches sent by
  `adb emu finger touch 1`. After enrolling in the app, a cold start showed
  the lock screen. Tapping the biometric target raised the system prompt
  ("Sign in to Migo with your fingerprint"). An unenrolled finger
  (`finger touch 2`) left the prompt up and did not sign in. The enrolled
  finger signed in and went on to the post-sign-in screen (offers, for the
  reason above). The fingerprint confirm on hold-to-accept also completed on
  a match. This was an emulator, not a physical device.
- **Fresh install opens on enrolment, no dev screens: ✅ pass on both
  platforms.** On iOS, see the build note above. On Android, the APK
  installed on the emulator and opened on enrolment ("Sign in or create your
  Migo account"). The launcher label is "Migo", and the icon and splash show
  the navy `migo` wordmark stand-in. The menu key opened no dev menu, and the
  APK is not debuggable. A `migo://kitchen-sink` deep link redirected back to
  enrolment.

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

**Not changed.** `border` comes from the handoff's own token table, and the
build's rule is that where the token table and other guidance disagree, the
token table wins. It is also
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
at 1.09 the state is close to invisible on a low-end screen in daylight, which is
the market this app is for.

Recorded in `contrast.test.ts` rather than asserted, so the numbers live in the
repo. **Needs:** a design call, not a code fix.

### C. The FAQ never mentioned the wallet — closed

"wallet" appeared zero times across all 45 questions, while the entire
repayment flow is wallet-based, so a borrower searching Help for "wallet" got
the empty state. The FAQ's repayment answers now describe wallet repayment, and
`faq-search.test.ts` asserts that searching "wallet" finds a repayment answer.

---

## Not verifiable without hardware

The detail behind the ⚠ table at the top. Stated plainly rather than implied,
and worth being specific about *what each one would catch*, since
"needs a device" is otherwise easy to read as a formality.

| | what it would actually catch |
|---|---|
| **TalkBack** (Android) | Whether the composed row labels in §3 are announced as one sentence or read past. The automated test asserts the `accessible` prop is set; only a screen reader proves the effect |
| **VoiceOver** (iOS) | Same, and the one most worth doing — the composed-label defect this fixed was found in review, not by a test |
| **Low-end Android** | Finding B. A 1.09 pressed state is a number on a page until someone tries to see it on a cheap panel in daylight, which is the market this app is for |
| **Biometric prompts** | That `lock` → `active` completes at all on real hardware. Checked by hand on the Android emulator and the iOS simulator only (see Manual checks), not on a physical device |
| **Content sizing** | Large-text and display-scaling behaviour, which nothing in this repo tests. A 48px target at 200% text is not still 48px of usable space |
| **The seven Maestro flows** | Whether the journeys hold end to end against an installed build. Run on an Android emulator and the iOS simulator at close-out, with only `01` green — see [E2E results](#e2e-results-close-out) |

### One thing the automated suite structurally cannot cover

Every 48px assertion checks a **declared** height. Controls sized by content and
padding — `biometric-card` measures 74px, `ChatCard` and the FAQ rows are
similar — are invisible to it, because a rendered tree in Jest has no layout.
Only the device pass measures those. The automated result should be read as
"nothing declares itself too small", not "everything is big enough".
