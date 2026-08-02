import { useContext } from 'react';

import {
  platformTokens,
  runtimePlatform,
  type PlatformTokens,
  type TargetPlatform,
} from '@/theme/platform';

import { DemoContext } from './demo-context';

/**
 * Platform-dependent tokens and copy, for the platform currently being shown.
 *
 * Normally that is the platform the build is running on. In a dev build the
 * demo overlay can override it, so a walkthrough shows Android's pill buttons
 * and fingerprint copy on an iPhone without a second build (PLAN §1).
 *
 * Reads the context directly rather than through `useDemo()` so a component can
 * still render outside `DemoProvider` — in a unit test, say. There is a correct
 * answer without the provider (the real platform), so throwing would buy
 * nothing and would make every primitive untestable in isolation.
 */
/**
 * Both sets, resolved once. `platformTokens` is pure and there are exactly two
 * answers, so precomputing them keeps the returned object referentially stable
 * across renders — a fresh object every render would defeat memoisation in
 * anything downstream that depends on it.
 */
const TOKENS: Record<TargetPlatform, PlatformTokens> = {
  android: platformTokens('android'),
  ios: platformTokens('ios'),
};

export function usePlatform(): PlatformTokens {
  const demo = useContext(DemoContext);
  // `enabled` is false in production, so a release build always reports the
  // platform it is actually running on whatever the override happens to hold.
  return TOKENS[demo?.enabled ? demo.platform : runtimePlatform];
}
