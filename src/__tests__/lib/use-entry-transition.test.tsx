import { renderHook } from '@testing-library/react-native';

import { ENTRY_FALLBACK_MS, useEntryTransition } from '@/lib/use-entry-transition';

/**
 * A screen that navigates away as soon as it has data must wait until it has
 * finished animating in: replacing it mid-transition blanked the window on iOS.
 */
type Listener = (event: { data?: { closing?: boolean } }) => void;

let mockListeners: Listener[] = [];

jest.mock('expo-router', () => ({
  useNavigation: () => ({
    addListener: (_type: string, listener: Listener) => {
      mockListeners.push(listener);
      return () => (mockListeners = mockListeners.filter((l) => l !== listener));
    },
  }),
}));

beforeEach(() => {
  mockListeners = [];
  jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] });
});

afterEach(() => {
  jest.useRealTimers();
});

const flush = () => new Promise<void>((resolve) => setImmediate(() => resolve()));

async function track() {
  const { result, unmount } = await renderHook(() => useEntryTransition());
  const state = { entered: false };
  void result.current().then(() => (state.entered = true));
  return { state, unmount };
}

it('resolves when the screen finishes animating in', async () => {
  const { state } = await track();
  await flush();
  expect(state.entered).toBe(false);

  mockListeners.forEach((l) => l({ data: { closing: false } }));
  await flush();
  expect(state.entered).toBe(true);
});

it('ignores the end of a closing transition', async () => {
  const { state } = await track();
  mockListeners.forEach((l) => l({ data: { closing: true } }));
  await flush();
  expect(state.entered).toBe(false);
});

it('goes on anyway when no transition is reported', async () => {
  const { state } = await track();

  jest.advanceTimersByTime(ENTRY_FALLBACK_MS - 1);
  await flush();
  expect(state.entered).toBe(false);

  jest.advanceTimersByTime(1);
  await flush();
  expect(state.entered).toBe(true);
});

it('stops listening once the screen unmounts', async () => {
  const { unmount } = await track();
  expect(mockListeners).toHaveLength(1);
  await unmount();
  expect(mockListeners).toHaveLength(0);
});
