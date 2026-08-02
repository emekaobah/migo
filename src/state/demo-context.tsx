import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { runtimePlatform, type TargetPlatform } from '@/theme/platform';

/**
 * Demo affordances — a first-class feature here, not debt (PLAN §1).
 *
 * The prototype had a left rail that switched Android/iOS and jumped between
 * journeys. A proposal has to be walkable in any order without reinstalling,
 * so the app gets the equivalent as a dev-only overlay.
 *
 * Dev-only by construction: the provider still mounts in production so hooks
 * do not conditionally exist, but `enabled` is false and the overlay renders
 * nothing.
 */

export type Journey = 'first-run' | 'returning' | 'active-loan' | 'new-phone';

export type DemoValue = {
  /** False in production builds — the overlay and scenario seeding are off. */
  enabled: boolean;
  /**
   * Which platform's copy and controls to show. Consumed through
   * `usePlatform()`, which is what makes the override take effect rather than
   * just colouring the overlay's own chips.
   */
  platform: TargetPlatform;
  setPlatform: (platform: TargetPlatform) => void;
  journey: Journey | null;
  setJourney: (journey: Journey | null) => void;
};

/**
 * Exported so `usePlatform()` can read it optionally — a primitive must still
 * render outside the provider, and platform tokens have a correct answer
 * without one.
 */
export const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [platform, setPlatform] = useState<TargetPlatform>(runtimePlatform);
  const [journey, setJourney] = useState<Journey | null>(null);

  const value = useMemo<DemoValue>(
    () => ({ enabled: __DEV__, platform, setPlatform, journey, setJourney }),
    [platform, journey],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}
