import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';

/** The longest a screen waits for its entry transition before going on anyway. */
export const ENTRY_FALLBACK_MS = 600;

/**
 * The slice of the native-stack navigation object this hook uses.
 *
 * `useNavigation` from expo-router is typed for the generic navigator, which
 * has no `transitionEnd` event; the native stack every layout here uses does.
 */
type TransitionNavigation = {
  addListener: (
    type: 'transitionEnd',
    listener: (event: { data?: { closing?: boolean } }) => void,
  ) => () => void;
};

type Deferred = { promise: Promise<void>; resolve: () => void };

function deferred(): Deferred {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
}

/**
 * Returns a function that resolves once this screen has finished animating in,
 * or after `ENTRY_FALLBACK_MS` if no transition is reported.
 *
 * For a screen that navigates away on its own as soon as it has data. Calling
 * `router.replace` while the replace that brought the screen in is still
 * animating can leave react-native-screens showing an empty native screen on
 * iOS: the window goes blank and nothing responds. `loading` hit exactly that
 * after a Face ID sign-in, because the mock answers `getLoan` instantly.
 */
export function useEntryTransition(): () => Promise<void> {
  const navigation = useNavigation() as unknown as TransitionNavigation;
  const entered = useRef<Deferred>(deferred());

  useEffect(() => {
    const done = entered.current.resolve;
    const timer = setTimeout(done, ENTRY_FALLBACK_MS);
    const unsubscribe = navigation.addListener('transitionEnd', (event) => {
      if (event.data?.closing) return;
      clearTimeout(timer);
      done();
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation]);

  return () => entered.current.promise;
}
