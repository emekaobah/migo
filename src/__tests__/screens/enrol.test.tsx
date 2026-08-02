import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EnrolScreen from '@/app/(onboarding)/enrol';
import { NavOriginProvider } from '@/state/nav-origin';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

/**
 * PLAN §8a: short number → inline error, CTA never disabled.
 *
 * This is the screen where the no-disabled-buttons convention earns its place —
 * a borrower who mistypes their number must be told what is wrong, not left
 * pressing a dead control.
 */
function renderScreen() {
  return render(
    // SafeAreaProvider: `Screen` renders a SafeAreaView, which measures nothing
    // and renders no children without a provider above it.
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <NavOriginProvider>
        <EnrolScreen />
      </NavOriginProvider>
    </SafeAreaProvider>,
  );
}

/** RNTL v14 events are async — awaiting each press lets state flush. */
const type = async (getByLabelText: (l: string) => unknown, digits: string) => {
  for (const digit of digits) {
    await fireEvent.press(getByLabelText(digit) as never);
  }
};

describe('enrol', () => {
  it('shows an inline error for a short number instead of blocking the button', async () => {
    const { getByTestId, getByLabelText, queryByText } = await renderScreen();

    await type(getByLabelText, '0803');
    await fireEvent.press(getByTestId('continue'));

    expect(queryByText(/needs all 10 digits/i)).not.toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('never disables Continue, at any input length', async () => {
    const { getByTestId, getByLabelText } = await renderScreen();

    expect(getByTestId('continue').props.accessibilityState?.disabled).toBeFalsy();

    await type(getByLabelText, '080');
    expect(getByTestId('continue').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('clears the error as soon as the borrower resumes typing', async () => {
    const { getByTestId, getByLabelText, queryByText } = await renderScreen();

    await type(getByLabelText, '0803');
    await fireEvent.press(getByTestId('continue'));
    expect(queryByText(/needs all 10 digits/i)).not.toBeNull();

    await type(getByLabelText, '1');

    expect(queryByText(/needs all 10 digits/i)).toBeNull();
  });

  it('advances with ten digits, carrying the number forward', async () => {
    const { getByTestId, getByLabelText } = await renderScreen();

    await type(getByLabelText, '8031234567');
    await fireEvent.press(getByTestId('continue'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(onboarding)/otp',
      params: { phone: '8031234567' },
    });
  });

  it('stops accepting digits past ten', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await type(getByLabelText, '80312345678888');

    // Rendered in 3-3-4 groups; an eleventh digit must not appear.
    expect(getByText('803 123 4567')).toBeTruthy();
  });

  it('backspace removes the last digit', async () => {
    const { getByLabelText, getByText } = await renderScreen();

    await type(getByLabelText, '803123');
    await fireEvent.press(getByLabelText('Delete'));

    expect(getByText('803 12')).toBeTruthy();
  });
});
