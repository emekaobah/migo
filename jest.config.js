/**
 * Jest configuration (PLAN §6b).
 *
 * Moved out of `package.json` so the decisions below can carry their reasons.
 * JSON cannot hold a comment, and a `_why` key trips Jest's config validator.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'jest-expo',

  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  /**
   * Jest's 5s default is sized for unit tests.
   *
   * An RNTL screen suite pays module load, Babel transform and — under
   * `test:coverage` — instrumentation of a whole React Native tree before its
   * first assertion runs. On a 2-core CI runner that alone can exceed 5s:
   * three suites timed out on their **first** test while all fourteen passed
   * locally, including under `--coverage --maxWorkers=2`.
   *
   * This is headroom for a cold, contended runner, not cover for a hang. A
   * genuinely stuck test still fails, just later, and every `waitFor` keeps its
   * own much tighter timeout — so a real regression is still caught in seconds.
   */
  testTimeout: 20_000,

  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(test).ts?(x)'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    // Dev-only route, stripped from production builds.
    '!src/app/(dev)/**',
    // Token tables — data, not behaviour.
    '!src/theme/**',
  ],

  /**
   * The **pnpm-shaped** variant. Expo documents this per package manager and
   * pnpm's is not the default one: without the leading `.pnpm` alternative, the
   * hoisted store paths never match and every React Native module arrives
   * untransformed.
   */
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg))',
  ],

  coverageReporters: ['text-summary', 'lcov'],
  coverageDirectory: 'coverage',
};
