/**
 * Android's SMS Retriever API, behind an interface.
 *
 * The real implementation needs a server sending an SMS containing an
 * 11-character app hash — neither exists yet, so the mock simulates arrival at
 * 3.2s. What Phase 3 can verify is the interface and the UI behaviour: arrival,
 * auto-fill, auto-advance, the resend countdown, the USSD detour. The real
 * thing is untested until there is a backend (PLAN §8a).
 *
 * Swap target: `react-native-otp-verify`.
 */
export interface SmsRetriever {
  /** Begin listening. Resolves when listening has started, not when a code arrives. */
  start(): Promise<void>;
  stop(): void;
  /** Returns an unsubscribe function. */
  onCode(listener: (code: string) => void): () => void;
}
