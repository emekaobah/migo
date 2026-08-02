import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { clear, EMPTY, load, save, type DurableState } from './persistence';

/**
 * Enrolment and session state.
 *
 * Context + useReducer, no store library — the handoff's state list is 18
 * fields across two clear domains, and a dependency would be carried for the
 * rest of the project to save nothing (PLAN §4).
 */

type AuthState = DurableState & {
  /** Session-only. Never persisted: a restart must land on the lock screen. */
  authed: boolean;
  /** Has the durable slice been read yet? Boot must not route before it has. */
  hydrated: boolean;
};

type Action =
  | { type: 'hydrated'; durable: DurableState }
  | { type: 'enrolled'; phone: string; name: string }
  | { type: 'deviceBound' }
  | { type: 'bioEnrolled' }
  | { type: 'pinSet' }
  | { type: 'authed'; value: boolean }
  | { type: 'signedOut' };

const INITIAL: AuthState = { ...EMPTY, authed: false, hydrated: false };

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'hydrated':
      return { ...state, ...action.durable, hydrated: true };
    case 'enrolled':
      return { ...state, enrolled: true, phone: action.phone, name: action.name };
    case 'deviceBound':
      return { ...state, deviceBound: true };
    case 'bioEnrolled':
      return { ...state, bio: true };
    case 'pinSet':
      return { ...state, pinSet: true };
    case 'authed':
      return { ...state, authed: action.value };
    case 'signedOut':
      // Sign-out unbinds the device but keeps nothing else — the confirmation
      // screen promises the loan, limit and dates are untouched, and those live
      // server-side rather than here.
      return { ...INITIAL, hydrated: true };
  }
}

type AuthContextValue = AuthState & {
  markEnrolled: (phone: string, name: string) => void;
  markDeviceBound: () => void;
  markBioEnrolled: () => void;
  markPinSet: () => void;
  setAuthed: (value: boolean) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    let active = true;
    void load().then((durable) => {
      if (active) dispatch({ type: 'hydrated', durable });
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist the durable slice whenever it changes, but never before hydration —
  // otherwise the initial empty state overwrites what was on disk.
  useEffect(() => {
    if (!state.hydrated) return;
    const { authed: _authed, hydrated: _hydrated, ...durable } = state;
    void save(durable);
  }, [state]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      markEnrolled: (phone, name) => dispatch({ type: 'enrolled', phone, name }),
      markDeviceBound: () => dispatch({ type: 'deviceBound' }),
      markBioEnrolled: () => dispatch({ type: 'bioEnrolled' }),
      markPinSet: () => dispatch({ type: 'pinSet' }),
      setAuthed: (v) => dispatch({ type: 'authed', value: v }),
      signOut: async () => {
        await clear();
        dispatch({ type: 'signedOut' });
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
