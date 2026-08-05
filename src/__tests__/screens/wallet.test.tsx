import { act, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WalletScreen from '@/app/(loan)/wallet';
import { api } from '@/api/client';
import { LoanProvider, useLoan } from '@/state/loan-context';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/api/client', () => {
  const wallet = {
    bank: 'sterling',
    accountNumber: '0123456789',
    accountName: 'MIGO — TUNDE ADEYEMI',
    amountDue: 45_484,
  };

  /** Captured so a test can assert the screen cancelled its watch. */
  const cancel = jest.fn();

  return {
    api: {
      getWallet: jest.fn(async () => wallet),
      getLoan: jest.fn(async () => ({
        id: 'loan-1',
        principal: 99_600,
        total: 136_452,
        tenor: { days: 90, payments: 3, multiplier: 1.37 },
        schedule: [
          { index: 1, amount: 45_484, dueAt: new Date('2026-09-04T00:00:00Z') },
          { index: 2, amount: 45_484, dueAt: new Date('2026-10-04T00:00:00Z') },
          { index: 3, amount: 45_484, dueAt: new Date('2026-11-03T00:00:00Z') },
        ],
        paidCount: 1,
        disbursedTo: null,
        extendedTo: null,
      })),
      watchPayment: jest.fn(() => ({
        // Never resolves on its own. Each test drives the outcome it wants, so
        // none of them depend on a 6s timer firing.
        promise: new Promise(() => {}),
        cancel,
      })),
      __cancel: cancel,
    },
  };
});

/** Puts a chosen bank into loan state — normally set by `repay`. */
function Seed() {
  const { choosePayBank } = useLoan();

  useEffect(() => {
    choosePayBank('sterling');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

async function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <LoanProvider>
        <Seed />
        <WalletScreen />
      </LoanProvider>
    </SafeAreaProvider>,
  );
}

const cancelMock = () => (api as unknown as { __cancel: jest.Mock }).__cancel;

describe('wallet', () => {
  it('shows the account to transfer into, and that it is waiting', async () => {
    const { queryByTestId, queryByText } = await renderScreen();

    await waitFor(() => expect(queryByTestId('payment-waiting')).not.toBeNull());

    // Grouped in fours because this gets copied by hand into another app.
    expect(queryByText('0123 4567 89')).not.toBeNull();
    expect(queryByText('MIGO — TUNDE ADEYEMI')).not.toBeNull();
    expect(queryByTestId('payment-received')).toBeNull();
  });

  it('carries no in-app trigger to short-circuit the wait', async () => {
    const { toJSON } = await renderScreen();

    await waitFor(() => expect(toJSON()).not.toBeNull());
    const rendered = JSON.stringify(toJSON()).toLowerCase();

    // The prototype's "Demo: I've sent the money" button does not carry over
    // (PLAN §5). Nothing here may exist to skip the detection window.
    for (const phrase of ["i've sent", 'i have sent', 'demo', 'simulate', 'skip']) {
      expect(rendered).not.toContain(phrase);
    }
  });

  it('cancels the watch when the borrower leaves mid-wait', async () => {
    const { unmount, queryByTestId } = await renderScreen();

    await waitFor(() => expect(queryByTestId('payment-waiting')).not.toBeNull());
    cancelMock().mockClear();

    // Leaving is the normal case here, not an edge case: the transfer itself
    // happens in another banking app. An uncancelled watcher fires into an
    // unmounted tree (PLAN §6a).
    //
    // `unmount` is awaited because RNTL does not flush effect cleanups
    // synchronously under React 19 — asserting straight after a bare
    // `unmount()` sees zero calls even when the cleanup is correct.
    await unmount();

    expect(cancelMock()).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('settles the balance and returns to the loan once the payment lands', async () => {
    let resolvePayment: ((event: { received: boolean; amount: number }) => void) | undefined;
    (api.watchPayment as jest.Mock).mockImplementationOnce(() => ({
      promise: new Promise<{ received: boolean; amount: number }>((resolve) => {
        resolvePayment = resolve;
      }),
      cancel: cancelMock(),
    }));

    const { queryByTestId } = await renderScreen();
    await waitFor(() => expect(queryByTestId('payment-waiting')).not.toBeNull());

    await act(async () => {
      resolvePayment?.({ received: true, amount: 45_484 });
    });

    await waitFor(() => expect(queryByTestId('payment-received')).not.toBeNull());
    // The words land before the screen changes under them.
    expect(mockReplace).not.toHaveBeenCalled();

    // `loanLoaded` re-reads the server rather than incrementing a local count,
    // so the balance shown on `active` is the one the server holds.
    await waitFor(() => expect(api.getLoan as jest.Mock).toHaveBeenCalled(), { timeout: 3000 });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(loan)/active'), {
      timeout: 3000,
    });
  });
});
