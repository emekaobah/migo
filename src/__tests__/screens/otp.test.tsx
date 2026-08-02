import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OtpScreen from '@/app/(onboarding)/otp';
import { NavOriginProvider } from '@/state/nav-origin';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ phone: '8031234567' }),
}));

/**
 * PLAN §8a: the simulated arrival auto-fills and advances.
 *
 * The whole product thesis is that the borrower types nothing here on the happy
 * path. Manual entry still has to work, because the retriever is best-effort.
 *
 * Real timers with a generous `waitFor` rather than fake timers: RNTL v14's
 * async render and events already wrap in `act`, and nesting an explicit
 * `act(() => jest.advanceTimersByTime(...))` inside that produces overlapping
 * act() warnings. The arrival is 3.2s, so the waits are short.
 */
function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <NavOriginProvider>
        <OtpScreen />
      </NavOriginProvider>
    </SafeAreaProvider>,
  );
}

/** Arrival 3.2s + advance 1.4s, with headroom. */
const THROUGH_ADVANCE = { timeout: 8000 };

describe('otp', () => {
  it('waits before the code lands, showing a live countdown', async () => {
    const { queryByText } = await renderScreen();

    expect(queryByText(/Waiting for your code/i)).not.toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it(
    'auto-fills when the code arrives',
    async () => {
      const { queryByText } = await renderScreen();

      await waitFor(() => expect(queryByText(/Code received/i)).not.toBeNull(), { timeout: 6000 });
    },
    15_000,
  );

  // 15s ceiling: the real flow is 3.2s arrival + 1.4s beat, which overruns
  // jest's 5s default once render is included.
  it(
    'advances to bind after the arrival beat, exactly once',
    async () => {
      await renderScreen();

      await waitFor(
        () => expect(mockPush).toHaveBeenCalledWith('/(onboarding)/bind'),
        THROUGH_ADVANCE,
      );
      expect(mockPush).toHaveBeenCalledTimes(1);
    },
    15_000,
  );

  it('advances on manual entry of six digits', async () => {
    const { getByLabelText } = await renderScreen();

    for (const digit of '419736') {
      await fireEvent.press(getByLabelText(digit));
    }

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/(onboarding)/bind'), {
      timeout: 3000,
    });
  });

  it('offers the USSD route without waiting for the code', async () => {
    const { getByText } = await renderScreen();

    await fireEvent.press(getByText(/Verify with \*561# instead/i));

    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/ussd');
  });
});
