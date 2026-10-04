import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AddAccountScreen from '@/app/(loan)/add-account';
import { api } from '@/api/client';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/api/client', () => ({
  api: {
    listBanks: jest.fn(async () => [
      { id: 'access', name: 'Access Bank' },
      { id: 'uba', name: 'UBA' },
    ]),
    resolveAccount: jest.fn(),
    requestAccountCode: jest.fn(),
  },
}));

const resolveAccount = () => api.resolveAccount as jest.Mock;
const requestAccountCode = () => api.requestAccountCode as jest.Mock;

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <AddAccountScreen />
    </SafeAreaProvider>,
  );
}

type Screen = Awaited<ReturnType<typeof renderScreen>>;

async function pickBank(screen: Screen, name: string) {
  await waitFor(() => expect(screen.getByLabelText(name)).toBeTruthy());
  await fireEvent.press(screen.getByLabelText(name));
}

async function typeNumber(screen: Screen, digits: string) {
  for (const d of digits) await fireEvent.press(screen.getByLabelText(d));
}

beforeEach(() => {
  mockPush.mockClear();
  resolveAccount().mockReset().mockResolvedValue({ holder: 'Tunde Adeyemi' });
  requestAccountCode().mockReset().mockResolvedValue({ ok: true, maskedPhone: '0802••••4123', resendIn: 60 });
});

describe('add-account', () => {
  it('asks for the bank before anything else', async () => {
    const screen = await renderScreen();
    await fireEvent.press(screen.getByLabelText('Continue'));
    expect(screen.queryByText('Pick your bank first.')).not.toBeNull();
  });

  it('asks for all ten digits', async () => {
    const screen = await renderScreen();
    await pickBank(screen, 'Access Bank');
    await typeNumber(screen, '01234');

    await fireEvent.press(screen.getByLabelText('Continue'));

    expect(screen.queryByText('Account numbers have 10 digits.')).not.toBeNull();
    expect(resolveAccount()).not.toHaveBeenCalled();
  });

  it('looks up the holder as soon as the tenth digit is in, and shows the name to check', async () => {
    const screen = await renderScreen();
    await pickBank(screen, 'Access Bank');
    await typeNumber(screen, '0123456789');

    await waitFor(() => expect(screen.queryByText('Tunde Adeyemi')).not.toBeNull());
    expect(resolveAccount()).toHaveBeenCalledWith('access', '0123456789');
  });

  it('says so when the bank does not know the number', async () => {
    resolveAccount().mockResolvedValue(null);
    const screen = await renderScreen();
    await pickBank(screen, 'UBA');
    await typeNumber(screen, '0000000000');

    await waitFor(() =>
      expect(screen.queryByText('UBA has no account with that number. Check it and try again.')).not.toBeNull(),
    );
  });

  it('sends the code and moves on, naming the phone it went to', async () => {
    const screen = await renderScreen();
    await pickBank(screen, 'Access Bank');
    await typeNumber(screen, '0123456789');
    await waitFor(() => expect(screen.queryByText('Tunde Adeyemi')).not.toBeNull());

    await fireEvent.press(screen.getByLabelText('Continue'));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(loan)/account-code',
        params: { bankId: 'access', number: '0123456789', maskedPhone: '0802••••4123', resendIn: '60' },
      }),
    );
  });

  it.each([
    ['already-added', 'That account is already on file.'],
    [
      'different-bvn',
      'This account is linked to a different BVN. Only accounts in your own name can receive a Migo loan.',
    ],
  ])('refuses %s before any code is sent', async (reason, message) => {
    requestAccountCode().mockResolvedValue({ ok: false, reason });
    const screen = await renderScreen();
    await pickBank(screen, 'Access Bank');
    await typeNumber(screen, '0123456789');
    await waitFor(() => expect(screen.queryByText('Tunde Adeyemi')).not.toBeNull());

    await fireEvent.press(screen.getByLabelText('Continue'));

    await waitFor(() => expect(screen.queryByText(message)).not.toBeNull());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('says it is still checking when Continue comes before the name', async () => {
    resolveAccount().mockReturnValue(new Promise(() => {}));
    const screen = await renderScreen();
    await pickBank(screen, 'Access Bank');
    await typeNumber(screen, '0123456789');

    await fireEvent.press(screen.getByLabelText('Continue'));

    expect(screen.queryByText('Still checking the account. Try again in a moment.')).not.toBeNull();
    expect(requestAccountCode()).not.toHaveBeenCalled();
  });

  it('offers a retry when the bank list will not load, rather than spinning', async () => {
    (api.listBanks as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    const screen = await renderScreen();

    await waitFor(() => expect(screen.queryByLabelText('Try again')).not.toBeNull());
    await fireEvent.press(screen.getByLabelText('Try again'));

    await waitFor(() => expect(screen.queryByLabelText('Access Bank')).not.toBeNull());
  });

  it('separates a failed lookup from an unknown account', async () => {
    resolveAccount().mockRejectedValue(new Error('offline'));
    const screen = await renderScreen();
    await pickBank(screen, 'Access Bank');
    await typeNumber(screen, '0123456789');

    await waitFor(() =>
      expect(screen.queryByText('We could not check that account. Check your connection and try again.')).not.toBeNull(),
    );
  });
});
