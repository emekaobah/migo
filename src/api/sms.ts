import { createMockSmsRetriever } from './mock/sms-retriever';
import type { SmsRetriever } from './interfaces/sms-retriever';

/**
 * The SMS-retrieval swap point, alongside `client.ts`.
 *
 * Screens import `smsRetriever` from here and never reach into `api/mock/`
 * directly, so replacing the simulation with `react-native-otp-verify` is one
 * line in this file rather than an edit to `otp.tsx`. Same reasoning as
 * `client.ts` for `MigoApi` — an interface with no single place to swap it is
 * only half a seam.
 */
export const smsRetriever: SmsRetriever = createMockSmsRetriever();

export type { SmsRetriever };
