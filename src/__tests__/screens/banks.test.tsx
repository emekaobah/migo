import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import BanksScreen from '@/app/(loan)/banks';
import { api } from '@/api/client';
import type { PayoutAccount } from '@/api/types';
import { LoanProvider } from '@/state/loan-context';

const mockPush = jest.fn();
const mockParams: { added?: string } = {};

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => mockParams,
    // Focus is mount in a single-screen render; the refetch-on-return path is
    // the same effect running again.
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});

jest.mock('@/api/client', () => ({
  api: { listAccounts: jest.fn() },
}));

const listAccounts = () => api.listAccounts as jest.Mock;

const GTB: PayoutAccount = {
  id: 'gt-4412',
  bank: 'GTBank',
  maskedNumber: '••4412',
  holder: 'Tunde Adeyemi',
  type: 'Savings',
};
const ACCESS: PayoutAccount = {
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
      <LoanProvider>
        <BanksScreen />
      </LoanProvider>
    </SafeAreaProvider>,
  );
}

beforeEach(() => {
  mockPush.mockClear();
  delete mockParams.added;
  listAccounts().mockReset();
});

describe('banks — adding an account', () => {
  it('offers to add an account under the list', async () => {
    listAccounts().mockResolvedValue([GTB]);
    const { getByLabelText } = await renderScreen();

    await waitFor(() => expect(getByLabelText('Add an account')).toBeTruthy());
    await fireEvent.press(getByLabelText('Add an account'));

    expect(mockPush).toHaveBeenCalledWith('/(loan)/add-account');
  });

  it('with no account on file, offers only Add — never a choice from nothing', async () => {
    listAccounts().mockResolvedValue([]);
    const { queryByText, queryByLabelText } = await renderScreen();

    await waitFor(() => expect(queryByLabelText('Add an account')).not.toBeNull());

    expect(queryByText('You have no payout account yet. Add one to receive your loan.')).not.toBeNull();
    expect(queryByLabelText('Use this account')).toBeNull();
  });

  it('comes back from adding with the new account listed and selected', async () => {
    listAccounts().mockResolvedValue([GTB, ACCESS]);
    mockParams.added = ACCESS.id;
    const { getByLabelText } = await renderScreen();

    const row = await waitFor(() => getByLabelText('Access Bank ••6789, Tunde Adeyemi · Savings'));
    expect(row.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  });
});
