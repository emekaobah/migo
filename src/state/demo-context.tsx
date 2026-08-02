import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Journey seeding, so a walkthrough can start anywhere.
 *
 * The prototype's left rail also switched Android/iOS. That does **not** carry
 * over: this is a real app, built and installed twice, and an Android build
 * shows Android's controls because it is running on Android. What makes this
 * build a proposal is that the data is mocked and the flows are walkable — not
 * an in-app toggle. Platform behaviour comes from `theme/platform.ts`, resolved
 * from `Platform.OS` and not overridable.
 *
 * Dev-only by construction: the provider still mounts in production so hooks
 * do not conditionally exist, but `enabled` is false and the overlay renders
 * nothing.
 */

export type Journey = 'first-run' | 'returning' | 'active-loan' | 'new-phone';

export type DemoValue = {
  /** False in production builds — the overlay and scenario seeding are off. */
  enabled: boolean;
  journey: Journey | null;
  setJourney: (journey: Journey | null) => void;
};

const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [journey, setJourney] = useState<Journey | null>(null);

  const value = useMemo<DemoValue>(
    () => ({ enabled: __DEV__, journey, setJourney }),
    [journey],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}
