import type { Cancellable } from '../types';

/**
 * Cancellable timers.
 *
 * Every mock latency goes through here. A bare `setTimeout` behind a promise
 * cannot be abandoned, and screens in this app unmount mid-request constantly —
 * backing out of `loading`, leaving `wallet` during the 6s watch. PLAN §6a
 * calls this out as the one thing a naive mock gets wrong.
 */
export function delay<T>(ms: number, value: T): Cancellable<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const promise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      if (!cancelled) resolve(value);
    }, ms);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    },
  };
}

/**
 * The common case: await a latency and get the value.
 *
 * Uncancellable by design — use `delay` directly when the caller needs to
 * abandon the wait.
 */
export function after<T>(ms: number, value: T): Promise<T> {
  return delay(ms, value).promise;
}
