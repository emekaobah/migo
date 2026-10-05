import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NewDeviceScreen from '@/app/(session)/newdevice';
import { bootRedirect } from '@/features/session/boot-redirect';
import { AuthProvider } from '@/state/auth-context';
import { NavOriginProvider } from '@/state/nav-origin';
import { load, save, SIGNED_OUT } from '@/state/persistence';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/api/client', () => ({
  api: { ussdCode: jest.fn(async () => ({ code: '4821', validMinutes: 10 })) },
}));

/**
 * Re-authorising after a sign-out or a PIN lockout.
 *
 * Neither leaves a PIN that can be used, so "I've authorised it" has to lead to
 * setting a new one. It used to bind the device and go to `lock`, which greeted
 * "Welcome back, there" and offered a PIN pad with no PIN behind it.
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
          <NewDeviceScreen />
        </NavOriginProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  );
}

describe('newdevice', () => {
  beforeEach(async () => {
    await save(SIGNED_OUT);
  });

  it('sends the borrower on to set a new PIN, not to the lock screen', async () => {
    const { getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('authorised'));

    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/bind');
    expect(mockReplace).not.toHaveBeenCalledWith('/(session)/lock');
  });

  it('leaves the device unbound until the new PIN is set', async () => {
    // A cold start between here and `bind` must come back to this screen —
    // not to a lock screen with no PIN, and not to enrolment.
    const { getByTestId, findByText } = await renderScreen();
    await findByText('4 8 2 1');

    await fireEvent.press(getByTestId('authorised'));

    const durable = await load();
    expect(durable.deviceBound).toBe(false);
    expect(bootRedirect(durable)).toBe('/(session)/newdevice');
  });
});
