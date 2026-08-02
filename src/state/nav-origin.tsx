import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Where Help and Chat were opened from.
 *
 * **Stored, never inferred.** The handoff attributes four separate defects to
 * deriving this from the current screen, so no screen may inspect
 * `usePathname()` to decide where Back goes. Help opened from `active` returns
 * to `active`; Help opened from `enrol` returns to `enrol` — including from the
 * signed-out screens, which is the case inference always got wrong.
 */

export type Origin = string | null;

type NavOriginValue = {
  helpFrom: Origin;
  chatFrom: Origin;
  openHelpFrom: (route: string) => void;
  openChatFrom: (route: string) => void;
  clearHelp: () => void;
  clearChat: () => void;
};

const NavOriginContext = createContext<NavOriginValue | null>(null);

export function NavOriginProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [helpFrom, setHelpFrom] = useState<Origin>(null);
  const [chatFrom, setChatFrom] = useState<Origin>(null);

  const value = useMemo<NavOriginValue>(
    () => ({
      helpFrom,
      chatFrom,
      openHelpFrom: setHelpFrom,
      openChatFrom: setChatFrom,
      clearHelp: () => setHelpFrom(null),
      clearChat: () => setChatFrom(null),
    }),
    [helpFrom, chatFrom],
  );

  return <NavOriginContext.Provider value={value}>{children}</NavOriginContext.Provider>;
}

export function useNavOrigin(): NavOriginValue {
  const value = useContext(NavOriginContext);
  if (!value) throw new Error('useNavOrigin must be used inside NavOriginProvider');
  return value;
}
