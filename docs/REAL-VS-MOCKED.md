# What's real, what's mocked

Where this prototype ends. Read this before treating anything in the app as
working against Migo's systems.

This repo is an unsolicited, independent concept build of a native mobile
channel for Migo. Migo did not commission, review or approve it. The thesis it
tests: sign-in should not depend on telco channels Migo cannot control (SMS
OTP, USSD) on every visit. Verify once, and the device becomes the credential.

The short version:

| | |
|---|---|
| **Real** | Biometric prompts and capability detection, secure on-device storage, the salted PIN hash and its lockout counter, loan arithmetic, and the interaction design of all 23 screens on Android and iOS |
| **Mocked** | Every server call. The offers and loans API, payment settlement, SMS code delivery, support chat, the FAQ source and device attestation all run locally, behind interfaces in `src/api/` |
| **Illustrative** | Every figure: amounts, tenors, multipliers, the extension terms, account numbers, codes and names |

The app makes no network request to any backend. The only outbound traffic is
the three legal and help pages in `src/lib/links.ts`, opened in an in-app
browser.

---

## 1. What is real

These run on the device, against the platform's own APIs, with no mock in the
shipped code path. (The Jest suite mocks the native modules in
`src/__tests__/setup.ts`; the app does not.)

| Area | Where | What it does |
|---|---|---|
| Biometrics | `src/lib/biometrics.ts` | `expo-local-authentication`. Checks hardware, then enrolment, then prompts. Reports fingerprint or face. Device passcode fallback is turned off so a failed prompt lands in the app's own PIN flow |
| Secure storage | `src/state/persistence.ts` | `expo-secure-store` (Keychain on iOS, Keystore-backed storage on Android) holds the durable enrolment slice: `enrolled`, `deviceBound`, `bio`, `pinSet`, `phone`, `name`. Records are validated field by field on load |
| PIN | `src/lib/secure-pin.ts` | The six-digit PIN is never stored. A random 16-byte salt and `SHA-256(salt:pin)` go into SecureStore. The PIN and hash are never held in React state. The failed-attempt counter is also in SecureStore, so force-quitting does not reset it. Verification is serialised so concurrent attempts cannot under-count |
| Lockout | `src/lib/secure-pin.ts`, `src/app/(session)/pinlock.tsx` | Five wrong PINs locks the PIN path and routes to the new-device screen |
| Biometric re-check on accept | `src/app/(loan)/confirm.tsx` | Hold-to-accept prompts for biometrics again before the loan is submitted, when the handset has a usable sensor |
| Session handling | `src/state/auth-context.tsx`, `src/app/(account)/signout.tsx` | `authed` is never persisted, so a cold start always lands on the lock screen. Sign-out clears the PIN material and every durable field but `enrolled`, so a cold start re-authorises over USSD rather than re-enrolling |
| USSD hand-off | `src/lib/ussd.ts` | Opens the dialler with the code filled in via `tel:`. It never dials on the borrower's behalf |
| Loan arithmetic | `src/lib/loan-math.ts` | Pure, unit-tested. Whole naira throughout, instalments always sum to the total, remainder on the last payment, extension dated from the instalment being extended past. The maths is real; the inputs it runs on are illustrative |
| Interaction design | `src/app/`, `src/components/ui/`, `src/theme/` | 23 screens built natively for both platforms from one codebase, with platform-correct buttons, back behaviour and biometric copy. Accessibility status is in [`ACCESSIBILITY.md`](ACCESSIBILITY.md) |

---

## 2. What is mocked

Screens never import from `src/api/mock/`. Each mocked capability is named in
exactly one swap file, so replacing it is an edit to that file rather than to
the screens.

| Integration point | Interface | Swap file | Mock implementation |
|---|---|---|---|
| Offers and loans API | `MigoApi` in `src/api/types.ts` | `src/api/client.ts` | `mockApi` in `src/api/mock/index.ts` |
| Payment settlement watcher | `MigoApi.watchPayment`, returning `Cancellable<PaymentEvent>` | `src/api/client.ts` | `mockApi.watchPayment` |
| SMS code retrieval | `SmsRetriever` in `src/api/interfaces/sms-retriever.ts` | `src/api/sms.ts` | `createMockSmsRetriever` in `src/api/mock/sms-retriever.ts` |
| Support chat transport | `ChatTransport` in `src/api/interfaces/chat-transport.ts` | `src/api/chat.ts` | `createMockChatTransport` in `src/api/mock/chat-transport.ts` |
| FAQ source | `FaqSource` in `src/api/interfaces/faq-source.ts` | `src/api/faq.ts` | `mockFaqSource` in `src/api/mock/faq-source.ts` |
| Device attestation | `MigoApi.bindDevice(publicKey)` and the `signature` argument of `MigoApi.acceptLoan` | `src/api/client.ts` | Placeholder strings. No key exists (see §3) |

All mock latencies are in `LATENCY` in `src/api/mock/fixtures.ts` and run
through the cancellable timer in `src/api/mock/delay.ts`, so screens can be
left mid-wait without stray state updates.

### 2.1 Offers and loans API

**Interface.** `MigoApi` (`src/api/types.ts`): `requestCode`, `verifyCode`,
`ussdCode`, `bindDevice`, `getOffers`, `listAccounts`, `listBanks`,
`resolveAccount`, `requestAccountCode`, `confirmAccount`, `acceptLoan`,
`getLoan`, `getWallet`, `watchPayment`, `quoteExtension`, `extendLoan`. Wired in
`src/api/client.ts` as `export const api: MigoApi = mockApi`.

**What the mock does.**

- `requestCode` sends nothing and returns a 60-second resend timer.
- `verifyCode` accepts any six-character code.
- `ussdCode` returns a fixed code.
- `getOffers` returns the fixture tenors and amounts after 1.8 seconds. No credit
  decision is made.
- `listAccounts` returns two fictional payout accounts, plus any added this
  session.
- Adding a payout account: `resolveAccount` returns the borrower's name for any
  ten-digit number except two fixtures (one unknown to the bank, one held under
  someone else's BVN). `requestAccountCode` refuses an account already on file
  (judged by bank and last four digits, all a masked number allows) or on a
  different BVN before sending anything, and otherwise "sends" a code
  to a fixed BVN phone number. `confirmAccount` accepts any six digits. **No
  bank is queried and no BVN is checked**: the "different BVN" refusal is one
  fixture number, not a comparison.
- `acceptLoan` builds a loan locally with `loan-math`. Nothing is disbursed.
- `getWallet` returns a fixture account number for the chosen bank, quoting the
  next instalment as the amount due.
- `quoteExtension` and `extendLoan` compute the extension through one shared
  function, so the quoted figures are the applied figures.

There is one borrower and one loan. **The loan, its repayments and extension,
and any added accounts survive an app restart**: the mock writes them to
SecureStore (`src/api/mock/server-store.ts`) and reads them back on the first
call after a cold start. That storage stands in for a server's database. It is
not a production design, and it goes when `src/api/mock/` does. Signing out
leaves it alone, as a server would, so the loan is still there once the phone is
authorised again.

**Production replacement.** An HTTP client implementing `MigoApi`, assigned in
`src/api/client.ts`. `src/api/mock/` is then deleted. That needs, from Migo:
the real endpoints, an auth scheme bound to the device credential, an error
model (the mock never fails, so error paths are only exercised in tests), real
offer and pricing data, real payout accounts (a bank name lookup, and BVN matching against the account
the bank returns), and loan state that persists
server-side. The interface was shaped from the screens' needs, not from a real
contract, so expect it to change at the edges when one exists.

### 2.2 Payment settlement watcher

**Interface.** `MigoApi.watchPayment(wallet: Wallet): Cancellable<PaymentEvent>`
(`src/api/types.ts`). Cancellable because the borrower routinely leaves the
`wallet` screen mid-wait.

**What the mock does.** Resolves `{ received: true }` after 6 seconds, always,
for the instalment amount, and marks one instalment paid. No money moves and no
bank is contacted. Under- and over-payment are not modelled.

**Production replacement.** Driven by the settlement notification from whoever
issues the virtual wallet accounts. Whether that reaches the app as a poll, a
push notification or a socket, the `wallet` screen consumes the same
`Cancellable<PaymentEvent>`. Partial payments, late settlement and failures
need adding to `PaymentEvent`.

### 2.3 SMS code retrieval

**Interface.** `SmsRetriever` (`src/api/interfaces/sms-retriever.ts`): `start`,
`stop`, `onCode`. Wired in `src/api/sms.ts`.

**What the mock does.** "Receives" a fixed six-digit code 3.2 seconds after
`start`. The `otp` screen's auto-fill, auto-advance, resend countdown and USSD
detour are real UI behaviour exercised against that simulated arrival.

**Production replacement.** Android's SMS Retriever API, for example through
`react-native-otp-verify`. It needs a server that actually sends the SMS, and
that SMS must contain the app's 11-character hash. Neither exists, so **the real
retriever is untested**. The mock runs on iOS too, but iOS has no equivalent
API: a production iOS build would need its own approach (for example the
system's one-time-code suggestion on a text field, which the current keypad
entry does not use) or would simply ask the borrower to type the code.

### 2.4 Support chat transport

**Interface.** `ChatTransport` (`src/api/interfaces/chat-transport.ts`):
`history`, `send`, `subscribe`. Wired in `src/api/chat.ts` through the factory
`createChatTransport(getFacts)`.

**What the mock does.** A scripted agent (`src/data/chat-scripts.ts`) replies
after a 1.6-second typing indicator. Signed in, it quotes the borrower's loan and
extension figures from app state; signed out, it asks for the phone number.
Quick-reply chips drive it; the free-text composer is inert. The conversation
lives in memory for the session. No person is on the other end.

**Production replacement.** A live-chat SDK behind the same three methods. The
header comment in `src/api/interfaces/chat-transport.ts` records what a Zoho
SalesIQ Mobilisten implementation would need (visitor registration on sign-in
and removal on sign-out, `minSdk 23`, iOS 13+, the vendor's Maven repository).
The chat UI itself is the app's own and stays.

### 2.5 FAQ source

**Interface.** `FaqSource` (`src/api/interfaces/faq-source.ts`): `sections`,
`search`. Wired in `src/api/faq.ts`.

**What the mock does.** Serves illustrative help content bundled with the app
as typed data in `src/data/faq.ts`. It is not Migo's copy and is not kept in
sync with any live page. Search is a case-insensitive substring match over
questions and answers.

**Production replacement.** Fetch from whatever knowledge base backs Migo's
web help, so the app and the website answer from one source. Caching for
offline reading would need adding.

### 2.6 Device attestation

**Interface.** `MigoApi.bindDevice(publicKey: string)` and
`MigoApi.acceptLoan(selection, signature: string)` (`src/api/types.ts`).

**What the mock does.** Nothing. `src/app/(onboarding)/bind.tsx` passes the
literal string `'device-public-key'`, and `src/app/(loan)/confirm.tsx` passes
`'device-signature'`. The mock ignores both.

**Production replacement.** Covered with the rest of the security gaps in §3.

---

## 3. Security scope

The device-bound credential is the thesis, and **in this build it is a flow,
not a cryptographic fact.** What exists is the on-device half: the biometric
gate, the PIN, secure storage and the lockout. Nothing proves to a server that
a request came from an enrolled handset.

Not done:

| Gap | What is there today | What production needs |
|---|---|---|
| **Device key** | None. No keypair is generated or stored. `bindDevice` receives a placeholder string | A non-exportable key generated in the Secure Enclave (iOS) or Android Keystore/StrongBox, its public half registered at enrolment |
| **Key verification** | None. `acceptLoan` receives a placeholder string, and the server side does not exist to check it | Server-issued challenges signed by the device key, verified server-side, for sign-in and for loan acceptance |
| **Biometric-to-key binding** | Biometrics returns a local yes/no that sets `authed` in app state | Use of the device key gated by the biometric, so a successful prompt is what produces a valid signature |
| **Server attestation** | None | Play Integrity (Android) and App Attest / DeviceCheck (iOS), verified server-side |
| **Certificate pinning** | None. There is no backend connection to pin | Pinning on the API client once one exists |
| **New-device authorisation** | The `newdevice` screen asks the borrower to dial a USSD code, then trusts an "I've authorised it" button and moves on to setting a new PIN, which re-binds the device | Server confirmation that the USSD session completed on the account's SIM before the device is re-bound |
| **OTP verification** | Any six-character code passes, for sign-in and for adding a payout account | Server-side verification with expiry and rate limits |
| **PIN hashing strength** | One round of salted SHA-256. A six-digit PIN falls to brute force quickly for anyone who extracts the stored hash and salt | A memory-hard KDF, or better, the PIN unlocking a hardware-held key that never leaves the device |
| **PIN lockout reset** | The counter is cleared only by a correct PIN or by setting a new PIN. After a lockout the PIN path stays locked; biometrics still works | A server-driven reset tied to re-authorisation |
| **Loan acceptance without biometrics** | On a handset with no usable sensor, hold-to-accept submits without a second check | A PIN re-entry, or a key signature, on every acceptance |
| **Relock on background** | None. `authed` is cleared on a cold start, not when the app is backgrounded | An inactivity or background timeout |
| **SecureStore options** | Library defaults. Items are not individually gated behind biometrics | Access-control options chosen deliberately, per item |

Also out of scope: root and jailbreak detection, screenshot protection on
sensitive screens, and anything regulatory (consent capture, data retention).

---

## 4. Figures are illustrative

Every number and identifier in the app is a stand-in. None is Migo's rate table,
pricing or account data. Most live in `src/api/mock/fixtures.ts` and reach
screens only through `MigoApi`, so no screen hard-codes a rate.

| Figure | Value in this build | Source |
|---|---|---|
| Loan amounts | ₦49,900 / ₦99,600 / ₦199,700 | `AMOUNTS` |
| Tenors (days / payments) | 14/1, 30/1, 60/2, 90/3 | `TENORS` |
| Total-repayable multipliers | 1.10 / 1.16 / 1.27 / 1.37 | `TENORS` |
| Extension: share paid today | 30% of the outstanding | `EXTENSION.pct` |
| Extension: carry period | 30 days from the due date being extended past | `EXTENSION.days` |
| Extension: rate on the carried amount | ×1.16 | `EXTENSION.rate` |
| Borrower, payout accounts, wallet account numbers | Fictional | `BORROWER`, `ACCOUNTS`, `WALLETS` |
| Banks a payout account can be added at; the BVN phone; the unknown and other-BVN account numbers | Fictional | `BANKS`, `BVN_PHONE`, `UNKNOWN_ACCOUNT`, `OTHER_BVN_ACCOUNT`, `OTHER_BVN_HOLDER` |
| Wallet banks | Sterling Bank, Fidelity Bank | `src/features/repayment/banks.ts` |
| SMS code | `419736` | `createMockSmsRetriever` in `src/api/mock/sms-retriever.ts` |
| USSD fallback code | `419 736` at enrolment; its first four digits on the new-device screen | `USSD` |
| New-device shortcode | `*561*9#` | `NEW_DEVICE_CODE` in `src/lib/ussd.ts` |
| PIN lockout | 5 attempts | `MAX_ATTEMPTS` in `src/lib/secure-pin.ts` |
| Latencies | 0 to 6 seconds per call | `LATENCY` |

**The extension terms are an assumption.** "Pay 30% of the outstanding now, and
the remainder is carried for 30 days" is taken from Migo's published FAQ, not
from any agreement with Migo. The rate applied to the carried amount is not
published there; ×1.16 is the build's own 30-day multiplier, chosen so that a
30-day carry costs what a 30-day loan costs. All three values are parameters, so
real terms are a change to `EXTENSION` or to the API that replaces it.

The one real identifier is the enrolment shortcode `*561#` (`ENROL_CODE` in
`src/lib/ussd.ts`), which Migo publishes. The new-device shortcode extends it
with an invented suffix; everything in the table above is invented for the
demo.
