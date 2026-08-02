/**
 * Where the app opens, decided from persisted state.
 *
 * A pure function so every branch is unit-testable without mounting a
 * navigator (PLAN §4). The routing rule is small and the cost of getting it
 * wrong is high — a returning borrower dropped back into enrolment would be
 * asked for an SMS code, which is the exact failure this product exists to
 * remove.
 */

export type BootState = {
  enrolled: boolean;
  /** This device holds a key the server recognises. */
  deviceBound: boolean;
};

export type BootRoute =
  | '/(onboarding)/enrol'
  | '/(session)/newdevice'
  | '/(session)/lock';

export function bootRedirect({ enrolled, deviceBound }: BootState): BootRoute {
  if (!enrolled) return '/(onboarding)/enrol';
  if (!deviceBound) return '/(session)/newdevice';
  return '/(session)/lock';
}
