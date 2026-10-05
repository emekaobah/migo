import { AppState, type AppStateStatus } from 'react-native';

import { ACTIVE_WAIT_MS, authenticate, untilActive } from '@/lib/biometrics';

import { localAuthMock } from '../setup';

/**
 * `authenticate` must not hand control back while the system sheet is still
 * dismissing: navigating in that window blanked the screen in iOS end-to-end
 * runs. These drive `AppState` by hand to check the wait and its cap.
 */
type Listener = (state: AppStateStatus) => void;

let listeners: Listener[] = [];

function setAppState(state: AppStateStatus) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true });
}

beforeEach(() => {
  listeners = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    listeners.push(listener as Listener);
    return { remove: () => (listeners = listeners.filter((l) => l !== listener)) };
  });
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
});

afterEach(() => {
  setAppState('active');
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** Lets pending promise callbacks run. */
const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

describe('untilActive', () => {
  it.each(['active', 'background', 'unknown'] as AppStateStatus[])(
    'resolves straight away when the app is %s, not inactive',
    async (state) => {
      setAppState(state);
      await expect(untilActive()).resolves.toBeUndefined();
      expect(listeners).toHaveLength(0);
    },
  );

  it('waits while the app is inactive and resolves when it becomes active', async () => {
    setAppState('inactive');
    let settled = false;
    void untilActive().then(() => (settled = true));

    await flush();
    expect(settled).toBe(false);

    listeners.forEach((l) => l('active'));
    await flush();
    expect(settled).toBe(true);
    expect(listeners).toHaveLength(0);
  });

  it('gives up waiting after the cap, so sign-in is delayed rather than blocked', async () => {
    setAppState('inactive');
    let settled = false;
    void untilActive().then(() => (settled = true));

    jest.advanceTimersByTime(ACTIVE_WAIT_MS - 1);
    await flush();
    expect(settled).toBe(false);

    jest.advanceTimersByTime(1);
    await flush();
    expect(settled).toBe(true);
    expect(listeners).toHaveLength(0);
  });
});

describe('authenticate', () => {
  it('returns its result only once the app is active again', async () => {
    setAppState('inactive');
    let result: boolean | undefined;
    void authenticate('Sign in').then((ok) => (result = ok));

    await flush();
    expect(result).toBeUndefined();

    listeners.forEach((l) => l('active'));
    await flush();
    expect(result).toBe(true);
  });

  it('still reports a failed prompt as false', async () => {
    localAuthMock.setScenario('failure');
    await expect(authenticate('Sign in')).resolves.toBe(false);
  });
});
