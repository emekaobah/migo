import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OffersScreen from '@/app/(loan)/offers';
import { api } from '@/api/client';
import { AuthProvider } from '@/state/auth-context';
import { LoanProvider, useLoan } from '@/state/loan-context';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

/**
 * Two tenors with deliberately different multipliers, so a total that failed to
 * recompute would still be visibly wrong rather than coincidentally right.
 */
const mockOffers = {
  tenors: [
    { days: 14, payments: 1, multiplier: 1.1 },
    { days: 90, payments: 3, multiplier: 1.37 },
  ],
  amounts: [49_900, 199_700],
};

jest.mock('@/api/client', () => ({
  api: { getOffers: jest.fn(async () => mockOffers) },
}));

const getOffers = () => api.getOffers as jest.Mock;

/** Puts the provider into a state the screen cannot reach on its own. */
function Seed({ accountId }: Readonly<{ accountId?: string }>) {
  const { chooseAccount } = useLoan();

  useEffect(() => {
    if (accountId) chooseAccount(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function renderScreen(options: Readonly<{ accountId?: string }> = {}) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <AuthProvider>
        <LoanProvider>
          <Seed accountId={options.accountId} />
          <OffersScreen />
        </LoanProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  );
}

const pickTenor = (getByLabelText: (l: string) => unknown, label: string) =>
  fireEvent.press(getByLabelText(label) as never);

describe('offers', () => {
  it('asks for duration before it shows any amount', async () => {
    const { queryByText, getByLabelText } = await renderScreen();

    await waitFor(() => expect(getByLabelText('14 days, 1 payment')).toBeTruthy());

    // Stage two does not exist yet. An amount shown before a tenor is picked
    // could only quote a range, and the handoff orders these deliberately.
    expect(queryByText('₦49,900')).toBeNull();
    expect(queryByText('How much do you need?')).toBeNull();

    await pickTenor(getByLabelText, '14 days, 1 payment');

    await waitFor(() => expect(queryByText('How much do you need?')).not.toBeNull());
    expect(queryByText('₦49,900')).not.toBeNull();
  });

  it('recomputes every total when the tenor changes', async () => {
    const { getByLabelText, queryByText, getAllByText } = await renderScreen();

    await waitFor(() => expect(getByLabelText('14 days, 1 payment')).toBeTruthy());
    await pickTenor(getByLabelText, '14 days, 1 payment');

    // 49,900 × 1.10 and 199,700 × 1.10.
    await waitFor(() => expect(queryByText('₦54,890')).not.toBeNull());
    expect(queryByText('₦219,670')).not.toBeNull();

    await pickTenor(getByLabelText, '90 days, 3 payments');

    // 49,900 × 1.37 and 199,700 × 1.37 — the whole list follows the multiplier
    // the API returned, so no screen ever holds a rate of its own.
    await waitFor(() => expect(queryByText('₦68,363')).not.toBeNull());
    expect(queryByText('₦273,589')).not.toBeNull();
    expect(queryByText('₦54,890')).toBeNull();

    // And the per-payment line follows with it: three parts, not one.
    expect(getAllByText('3 × ₦22,787').length).toBeGreaterThan(0);
  });

  it('keeps Continue live and says what is missing, rather than disabling it', async () => {
    const { getByText, queryByText, getByLabelText } = await renderScreen();

    await waitFor(() => expect(getByLabelText('14 days, 1 payment')).toBeTruthy());

    const cta = getByText('Continue');
    await fireEvent.press(cta);

    expect(queryByText('Pick how long you need it.')).not.toBeNull();
    expect(mockPush).not.toHaveBeenCalled();

    await pickTenor(getByLabelText, '14 days, 1 payment');
    await fireEvent.press(getByText('Continue'));

    // The error moves on to the next missing thing rather than repeating.
    expect(queryByText('Pick how much you need.')).not.toBeNull();
    expect(queryByText('Pick how long you need it.')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('sends a first-time borrower to pick a payout account', async () => {
    const { getByText, getByLabelText } = await renderScreen();

    await waitFor(() => expect(getByLabelText('14 days, 1 payment')).toBeTruthy());
    await pickTenor(getByLabelText, '14 days, 1 payment');
    await fireEvent.press(getByLabelText('₦49,900') as never);
    await fireEvent.press(getByText('Continue'));

    expect(mockPush).toHaveBeenCalledWith('/(loan)/banks');
  });

  it('offers a retry when the fetch fails, rather than an empty screen', async () => {
    // `loading` normally supplies these, and falls through to this screen when
    // it cannot. Without the retry the borrower would be left on a permanent
    // spinner with no way to recover.
    getOffers().mockRejectedValueOnce(new Error('offline'));

    const { getByText, queryByText, getByLabelText } = await renderScreen();

    await waitFor(() => expect(queryByText(/could not load your offers/i)).not.toBeNull());
    expect(queryByText('How long do you need it?')).toBeNull();

    await fireEvent.press(getByText('Try again'));

    // The retry re-runs the effect, and the second call resolves.
    await waitFor(() => expect(getByLabelText('14 days, 1 payment')).toBeTruthy());
    expect(queryByText(/could not load your offers/i)).toBeNull();
    expect(getOffers()).toHaveBeenCalledTimes(2);
  });

  it('skips straight to confirm once an account has been chosen', async () => {
    const { getByText, getByLabelText } = await renderScreen({ accountId: 'gt-4412' });

    await waitFor(() => expect(getByLabelText('14 days, 1 payment')).toBeTruthy());
    await pickTenor(getByLabelText, '14 days, 1 payment');
    await fireEvent.press(getByLabelText('₦49,900') as never);
    await fireEvent.press(getByText('Continue'));

    // Routed on the stored `accountChosen`, not on anything derived from the
    // screen history — the distinction the handoff blames four defects on.
    expect(mockPush).toHaveBeenCalledWith('/(loan)/confirm');
  });
});
