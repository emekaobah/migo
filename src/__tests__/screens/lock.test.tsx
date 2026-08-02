import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LockScreen from '@/app/(session)/lock';
import { AuthProvider } from '@/state/auth-context';
import { NavOriginProvider } from '@/state/nav-origin';
import { localAuthMock } from '@/__tests__/setup';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

/**
 * The returning path — the product's whole thesis.
 *
 * The assertion that matters most is the negative one: **no SMS anywhere**. A
 * returning borrower reaches a signed-in session without a code being sent,
 * typed, or read aloud to an agent.
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
          <LockScreen />
        </NavOriginProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  );
}

describe('lock', () => {
  it('signs in on a successful biometric, after the recognition beat', async () => {
    localAuthMock.setScenario('success');
    const { getByTestId, queryByText } = await renderScreen();

    await fireEvent.press(getByTestId('biometric-target'));

    // The beat exists so the screen does not change under the finger.
    await waitFor(() => expect(queryByText(/Recognised — opening/i)).not.toBeNull());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/loading'), {
      timeout: 3000,
    });
  });

  it('stays put when the biometric is refused', async () => {
    localAuthMock.setScenario('failure');
    const { getByTestId, queryByText } = await renderScreen();

    await fireEvent.press(getByTestId('biometric-target'));

    await waitFor(() => expect(queryByText(/Recognised — opening/i)).toBeNull());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('offers the PIN as a full alternative, not a buried fallback', async () => {
    const { getByTestId } = await renderScreen();

    await fireEvent.press(getByTestId('use-pin'));

    expect(mockPush).toHaveBeenCalledWith('/(session)/pinlock');
  });

  it('falls back to the PIN prompt when the handset has no sensor', async () => {
    localAuthMock.setScenario('no-hardware');
    const { queryByText } = await renderScreen();

    await waitFor(() => expect(queryByText(/Use your PIN to sign in/i)).not.toBeNull());
  });

  it('never asks the borrower for a code', async () => {
    const { toJSON } = await renderScreen();
    const rendered = JSON.stringify(toJSON()).toLowerCase();

    // The product exists because SMS codes do not arrive. This screen may say
    // it signs you in *without* a code — that is the pitch — but it must never
    // send, mention receiving, or ask for one.
    for (const phrase of ['sms', 'otp', 'text you', 'we sent', 'enter the code', 'resend']) {
      expect(rendered).not.toContain(phrase);
    }

    // And the positive claim, so this test fails if the hint is ever softened.
    expect(rendered).toContain('without a code');
  });
});
