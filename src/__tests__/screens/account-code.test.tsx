import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AccountCodeScreen from '@/app/(loan)/account-code';
import { api } from '@/api/client';

const mockDismissTo = jest.fn();
const mockParams = { bankId: 'access', number: '0123456789', maskedPhone: '0802••••4123', resendIn: '60' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: mockDismissTo }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/api/client', () => ({
  api: { confirmAccount: jest.fn(), requestAccountCode: jest.fn() },
}));

const confirmAccount = () => api.confirmAccount as jest.Mock;
const requestAccountCode = () => api.requestAccountCode as jest.Mock;

const ADDED = {
  id: 'access-6789',
  bank: 'Access Bank',
  maskedNumber: '••6789',
  holder: 'Tunde Adeyemi',
  type: 'Savings',
};

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <AccountCodeScreen />
    </SafeAreaProvider>,
  );
}

type Screen = Awaited<ReturnType<typeof renderScreen>>;

async function typeCode(screen: Screen, digits: string) {
  for (const d of digits) await fireEvent.press(screen.getByLabelText(d));
}

beforeEach(() => {
  mockDismissTo.mockClear();
  confirmAccount().mockReset().mockResolvedValue({ ok: true, account: ADDED });
  requestAccountCode().mockReset().mockResolvedValue({ ok: true, maskedPhone: '0802••••4123', resendIn: 60 });
});

describe('account-code', () => {
  it('names the phone the code went to, which may not be this one', async () => {
    const screen = await renderScreen();
    expect(
      screen.queryByText("We sent a code to 0802••••4123, the number registered to this account's BVN."),
    ).not.toBeNull();
  });

  it('adds the account and returns to the payout list with it selected', async () => {
    const screen = await renderScreen();
    await typeCode(screen, '123456');

    await waitFor(() =>
      expect(mockDismissTo).toHaveBeenCalledWith({
        pathname: '/(loan)/banks',
        params: { added: 'access-6789' },
      }),
    );
    expect(confirmAccount()).toHaveBeenCalledWith('access', '0123456789', '123456');
  });

  it('keeps the borrower here on a wrong code', async () => {
    confirmAccount().mockResolvedValue({ ok: false });
    const screen = await renderScreen();
    await typeCode(screen, '999999');

    await waitFor(() =>
      expect(screen.queryByText('That code is not right. Check it and try again.')).not.toBeNull(),
    );
    expect(mockDismissTo).not.toHaveBeenCalled();
  });

  it('separates a failed check from a wrong code', async () => {
    confirmAccount().mockRejectedValue(new Error('offline'));
    const screen = await renderScreen();
    await typeCode(screen, '123456');

    await waitFor(() =>
      expect(screen.queryByText('We could not check that code. Try again.')).not.toBeNull(),
    );
  });

  describe('resend', () => {
    // Only these tests install fake timers, so only they advance them.
    beforeEach(() => jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick'] }));
    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('counts down, then offers a new code', async () => {
      const screen = await renderScreen();
      expect(screen.queryByText('Resend in 1:00')).not.toBeNull();
      expect(screen.queryByLabelText('Send a new code')).toBeNull();

      for (let s = 0; s < 60; s++) {
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      }

      await fireEvent.press(screen.getByLabelText('Send a new code'));
      expect(requestAccountCode()).toHaveBeenCalledWith('access', '0123456789');
    });
  });
});
