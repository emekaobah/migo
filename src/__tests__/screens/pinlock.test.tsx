import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PinlockScreen from '@/app/(session)/pinlock';
import { MAX_ATTEMPTS, setPin } from '@/lib/secure-pin';
import { AuthProvider } from '@/state/auth-context';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: mockBack }),
}));

/**
 * PLAN §8a: lockout at five attempts.
 *
 * The lockout is the only thing standing between a lost handset and someone
 * grinding six digits, so it gets asserted end to end through the screen rather
 * than only at the `secure-pin` layer.
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
        <PinlockScreen />
      </AuthProvider>
    </SafeAreaProvider>,
  );
}

const enter = async (getByLabelText: (l: string) => never, digits: string) => {
  for (const digit of digits) {
    await fireEvent.press(getByLabelText(digit));
  }
};

const CORRECT = '123456';
const WRONG = '000000';

describe('pinlock', () => {
  beforeEach(async () => {
    await setPin(CORRECT);
  });

  it('signs in on the correct PIN, without waiting for a submit', async () => {
    const { getByLabelText } = await renderScreen();

    await enter(getByLabelText as never, CORRECT);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/loading'));
  });

  it('counts down remaining tries on a wrong PIN', async () => {
    const { getByLabelText, queryByText } = await renderScreen();

    await enter(getByLabelText as never, WRONG);

    await waitFor(() => expect(queryByText(/4 tries left/i)).not.toBeNull());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('warns differently on the last try', async () => {
    const { getByLabelText, queryByText } = await renderScreen();

    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
      await enter(getByLabelText as never, WRONG);
      await waitFor(() => expect(queryByText(/tries left|One more try/i)).not.toBeNull());
    }

    expect(queryByText(/One more try before you have to re-authorise/i)).not.toBeNull();
  });

  it(
    `routes to newdevice after ${MAX_ATTEMPTS} failures`,
    async () => {
      const { getByLabelText } = await renderScreen();

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await enter(getByLabelText as never, WRONG);
      }

      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/newdevice'));
      // And never signed in along the way.
      expect(mockReplace).not.toHaveBeenCalledWith('/(session)/loading');
    },
    15_000,
  );

  it('clears the entry after a wrong PIN so the next try starts fresh', async () => {
    const { getByLabelText, queryByText } = await renderScreen();

    await enter(getByLabelText as never, WRONG);
    await waitFor(() => expect(queryByText(/tries left/i)).not.toBeNull());

    // A correct PIN entered straight afterwards must still work — proving the
    // buffer was emptied rather than appended to.
    await enter(getByLabelText as never, CORRECT);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(session)/loading'));
  });

  it('clears the error when the borrower starts correcting', async () => {
    const { getByLabelText, queryByText } = await renderScreen();

    await enter(getByLabelText as never, WRONG);
    await waitFor(() => expect(queryByText(/tries left/i)).not.toBeNull());

    await fireEvent.press(getByLabelText('1') as never);

    expect(queryByText(/tries left/i)).toBeNull();
  });
});
