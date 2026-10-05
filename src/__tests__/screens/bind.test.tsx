import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import BindScreen from '@/app/(onboarding)/bind';
import { bootRedirect } from '@/features/session/boot-redirect';
import { MAX_ATTEMPTS, setPin, verifyPin } from '@/lib/secure-pin';
import { AuthProvider } from '@/state/auth-context';
import { NavOriginProvider } from '@/state/nav-origin';
import { load, save, SIGNED_OUT } from '@/state/persistence';

const mockReplace = jest.fn();
const mockParams: { phone?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/api/client', () => ({
  api: {
    bindDevice: jest.fn(async () => ({ ok: true, name: 'Tunde', phone: '8031234567' })),
  },
}));

/**
 * `bind` as step 2 of re-authorising, reached from `newdevice` with no `phone`
 * param. Enrolment's use of it is covered end to end by 01-first-run.yaml.
 */
function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <AuthProvider>
        <NavOriginProvider>
          <BindScreen />
        </NavOriginProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  );
}

type Screen = Awaited<ReturnType<typeof renderScreen>>;

async function setNewPin(screen: Screen, digits: string) {
  for (const d of digits) await fireEvent.press(screen.getByLabelText(d));
  await fireEvent.press(screen.getByTestId('finish'));
}

const NEW_PIN = '246810';

describe('bind, re-authorising', () => {
  beforeEach(() => {
    delete mockParams.phone;
  });

  it('restores the name and phone from the server after a sign-out', async () => {
    await save(SIGNED_OUT);
    const screen = await renderScreen();

    await setNewPin(screen, NEW_PIN);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/loading'));
    await waitFor(async () =>
      expect(await load()).toEqual({
        enrolled: true,
        deviceBound: true,
        bio: false,
        pinSet: true,
        phone: '8031234567',
        name: 'Tunde',
      }),
    );
    // And a cold start from here is the ordinary returning path.
    expect(bootRedirect(await load())).toBe('/(session)/lock');
  });

  it('sets a PIN that signs in', async () => {
    await save(SIGNED_OUT);
    const screen = await renderScreen();

    await setNewPin(screen, NEW_PIN);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/loading'));
    await expect(verifyPin(NEW_PIN)).resolves.toEqual({ ok: true });
  });

  it('lifts a PIN lockout', async () => {
    // Lockout routes to `newdevice` too. Without a new PIN the attempt counter
    // stays at its limit and the PIN pad reports "locked" for good.
    await setPin('111111');
    for (let i = 0; i < MAX_ATTEMPTS; i++) await verifyPin('000000');
    await expect(verifyPin('111111')).resolves.toEqual({ ok: false, reason: 'locked' });

    const screen = await renderScreen();
    await setNewPin(screen, NEW_PIN);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/loading'));
    await expect(verifyPin(NEW_PIN)).resolves.toEqual({ ok: true });
  });

  it('keeps the phone typed at enrolment when there is one', async () => {
    mockParams.phone = '8099999999';
    const screen = await renderScreen();

    await setNewPin(screen, NEW_PIN);

    await waitFor(async () => expect((await load()).phone).toBe('8099999999'));
  });
});
