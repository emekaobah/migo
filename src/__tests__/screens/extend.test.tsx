import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ExtendScreen from '@/app/(loan)/extend';
import { api } from '@/api/client';
import type { Loan } from '@/api/types';
import { LoanProvider, useLoan } from '@/state/loan-context';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/api/client', () => {
  const loan = {
    id: 'loan-1',
    principal: 99_600,
    total: 136_452,
    tenor: { days: 90, payments: 3, multiplier: 1.37 },
    schedule: [
      { index: 1, amount: 45_484, dueAt: new Date('2026-09-04T00:00:00Z') },
      { index: 2, amount: 45_484, dueAt: new Date('2026-10-04T00:00:00Z') },
    ],
    paidCount: 0,
    disbursedTo: null,
    extendedTo: null,
  };

  return {
    api: {
      quoteExtension: jest.fn(async () => ({
        pct: 0.3,
        days: 30,
        outstanding: 90_968,
        payToday: 27_290,
        carried: 63_678,
        newOutstanding: 73_866,
        newDueAt: new Date('2026-10-04T00:00:00Z'),
      })),
      extendLoan: jest.fn(async () => ({ ...loan, extendedTo: new Date('2026-10-04T00:00:00Z') })),
    },
  };
});

/** `extend` reads the loan from context to know there is one to extend. */
function Seed() {
  const { loanLoaded } = useLoan();

  useEffect(() => {
    loanLoaded({
      id: 'loan-1',
      principal: 99_600,
      total: 136_452,
      tenor: { days: 90, payments: 3, multiplier: 1.37 },
      schedule: [
        { index: 1, amount: 45_484, dueAt: new Date('2026-09-04T00:00:00Z') },
        { index: 2, amount: 45_484, dueAt: new Date('2026-10-04T00:00:00Z') },
      ],
      paidCount: 0,
      // The screen never reads the payout account; only its presence matters
      // to the type.
      disbursedTo: null as unknown as Loan['disbursedTo'],
      extendedTo: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

async function renderScreen() {
  const utils = await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <LoanProvider>
        <Seed />
        <ExtendScreen />
      </LoanProvider>
    </SafeAreaProvider>,
  );

  await waitFor(() => expect(utils.queryByText(/Pay ₦27,290 and extend/)).not.toBeNull());
  return utils;
}

describe('extend', () => {
  it('shows the published terms, every figure from the quote', async () => {
    const { queryByText } = await renderScreen();

    // 30% carried 30 days — client-confirmed, superseding the handoff's 20%.
    expect(queryByText('Pay today (30%)')).not.toBeNull();
    expect(queryByText("You'll owe after 30 days")).not.toBeNull();

    // "You owe now" comes from the quote, not from a client-side loan snapshot,
    // so the three figures on screen are one reading of the balance and add up.
    expect(queryByText('₦90,968')).not.toBeNull();
    expect(queryByText('₦27,290')).not.toBeNull();
    expect(queryByText('₦63,678')).not.toBeNull();
    expect(queryByText('₦73,866')).not.toBeNull();
  });

  it('extends once however fast the button is pressed twice', async () => {
    const { getByText } = await renderScreen();

    const cta = getByText(/Pay ₦27,290 and extend/);

    // Both presses land before the re-render swaps the button for a spinner.
    // Guarding on `busy` state would let both through, because the closure
    // still reads the pre-update value — and a second `extendLoan` applies a
    // second extension, charging `payToday` again.
    await Promise.all([fireEvent.press(cta), fireEvent.press(cta)]);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(loan)/active'));
    expect(api.extendLoan as jest.Mock).toHaveBeenCalledTimes(1);
    expect(api.extendLoan as jest.Mock).toHaveBeenCalledWith(0.3);
  });
});
