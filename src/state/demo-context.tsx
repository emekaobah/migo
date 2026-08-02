import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

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

export type DemoPlatform = 'android' | 'ios';

type DemoValue = {
  /** False in production builds — the overlay and scenario seeding are off. */
  enabled: boolean;
  /** Overrides platform-dependent copy and controls, for walkthroughs. */
  platform: DemoPlatform;
  setPlatform: (platform: DemoPlatform) => void;
  journey: Journey | null;
  setJourney: (journey: Journey | null) => void;
};

const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [platform, setPlatform] = useState<DemoPlatform>(
    Platform.OS === 'android' ? 'android' : 'ios',
  );
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
