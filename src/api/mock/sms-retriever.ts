import type { SmsRetriever } from '../interfaces/sms-retriever';
import { delay } from './delay';
import { LATENCY } from './fixtures';

/**
 * Simulated SMS arrival.
 *
 * **This is the one thing in the build that cannot be verified locally.** The
 * real Android SMS Retriever needs a server sending a message containing an
 * 11-character app hash; neither exists. What this lets Phase 3 verify is the
 * interface and the UI behaviour around it — arrival, auto-fill, auto-advance,
 * the resend countdown, the USSD detour — against a code that arrives at 3.2s.
 *
 * Cancellable, because the borrower leaves `otp` for the USSD path mid-wait.
 */
export function createMockSmsRetriever(code = '419736'): SmsRetriever {
  let listeners: ((code: string) => void)[] = [];
  let pending: { cancel: () => void } | null = null;

  return {
    async start() {
      pending?.cancel();

      const arrival = delay(LATENCY.smsArrival, code);
      pending = arrival;

      void arrival.promise.then((received) => {
        for (const listener of listeners) listener(received);
      });
    },

    stop() {
      pending?.cancel();
      pending = null;
      listeners = [];
    },

    onCode(listener) {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
  };
}
