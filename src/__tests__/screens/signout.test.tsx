import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SignoutScreen from '@/app/(account)/signout';
import { bootRedirect } from '@/features/session/boot-redirect';
import { isPinSet, setPin } from '@/lib/secure-pin';
import { AuthProvider, useAuth } from '@/state/auth-context';
import { LoanProvider } from '@/state/loan-context';
import { load, save, SIGNED_OUT } from '@/state/persistence';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));

/** Signing out before hydration would be overwritten by it — wait for it. */
function Hydrated() {
  return useAuth().hydrated ? <Text>hydrated</Text> : null;
}

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <AuthProvider>
        <LoanProvider>
          <Hydrated />
          <SignoutScreen />
        </LoanProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  );
}

describe('signout', () => {
  beforeEach(async () => {
    await save({
      enrolled: true,
      deviceBound: true,
      bio: true,
      pinSet: true,
      phone: '8031234567',
      name: 'Tunde',
    });
    await setPin('123456');
  });

  it('keeps only `enrolled`, so a cold start re-authorises rather than re-enrols', async () => {
    const { getByTestId, findByText } = await renderScreen();
    await findByText('hydrated');

    await fireEvent.press(getByTestId('sign-out'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/newdevice'));
    await waitFor(async () => expect(await load()).toEqual(SIGNED_OUT));
    // The in-session route and the cold-start route agree.
    expect(bootRedirect(await load())).toBe('/(session)/newdevice');
  });

  it('clears the PIN material', async () => {
    const { getByTestId, findByText } = await renderScreen();
    await findByText('hydrated');

    await fireEvent.press(getByTestId('sign-out'));

    await waitFor(() => expect(mockReplace).toHaveBeenCalled());
    await expect(isPinSet()).resolves.toBe(false);
  });
});
