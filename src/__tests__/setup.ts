/**
 * Jest setup (PLAN §6b).
 *
 * Mocks the two native modules whose real behaviour needs hardware, so the
 * genuinely-real security code in `lib/secure-pin.ts` and `lib/biometrics.ts`
 * stays testable without a device:
 *
 * - `expo-secure-store` as an in-memory map
 * - `expo-local-authentication` as a scriptable success / failure / no-hardware
 *
 * Both expose helpers so a test can drive them:
 *   `secureStoreMock.reset()`, `localAuthMock.setScenario('no-hardware')`
 *
 * The `mock` prefix on the module-scope variables is required, not stylistic:
 * jest hoists `jest.mock()` above everything else and rejects out-of-scope
 * references unless the name begins with `mock`.
 */

// RNTL >= 12.4 registers its matchers automatically — there is no
// `extend-expect` entry point to import, and doing so fails to resolve.

// ---------------------------------------------------------------- SecureStore

const mockStore = new Map<string, string>();

export const secureStoreMock = {
  reset: () => mockStore.clear(),
  seed: (key: string, value: string) => mockStore.set(key, value),
  peek: (key: string) => mockStore.get(key) ?? null,
  size: () => mockStore.size,
};

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
}));

// ---------------------------------------------------------- LocalAuthentication

type AuthScenario = 'success' | 'failure' | 'no-hardware' | 'not-enrolled';

const mockAuth: { scenario: AuthScenario } = { scenario: 'success' };

export const localAuthMock = {
  setScenario: (next: AuthScenario) => {
    mockAuth.scenario = next;
  },
  reset: () => {
    mockAuth.scenario = 'success';
  },
};

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => mockAuth.scenario !== 'no-hardware'),
  isEnrolledAsync: jest.fn(
    async () => mockAuth.scenario !== 'no-hardware' && mockAuth.scenario !== 'not-enrolled',
  ),
  authenticateAsync: jest.fn(async () =>
    mockAuth.scenario === 'success' ? { success: true } : { success: false, error: 'user_cancel' },
  ),
  supportedAuthenticationTypesAsync: jest.fn(async () => [1, 2]),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
}));

// -------------------------------------------------------------------- Crypto

/**
 * Backed by Node's real SHA-256 rather than a stub, so `secure-pin` tests
 * exercise actual hashing — a fake digest would make "wrong PIN is rejected"
 * pass for the wrong reason. Randomness is a deterministic counter so salts
 * differ between calls without making the tests flaky.
 */
let mockRandomCounter = 0;

jest.mock('expo-crypto', () => {
  // jest.mock factories are hoisted above imports, so require is the only way
  // to reach node:crypto from in here.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require('node:crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: jest.fn(async (_algorithm: string, data: string) =>
      createHash('sha256').update(data).digest('hex'),
    ),
    getRandomBytesAsync: jest.fn(async (size: number) => {
      mockRandomCounter += 1;
      return Uint8Array.from({ length: size }, (_, i) => (mockRandomCounter * 31 + i) % 256);
    }),
  };
});

// ------------------------------------------------------------------- Haptics

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

beforeEach(() => {
  // Clears call history on the native mocks. The resets below only clear the
  // data and the scripted scenario, so without this a test asserting
  // "setItemAsync called once" would see the previous test's calls too.
  jest.clearAllMocks();
  secureStoreMock.reset();
  localAuthMock.reset();
});
