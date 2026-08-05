import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ConfirmScreen from '@/app/(loan)/confirm';
import { api } from '@/api/client';
import { localAuthMock } from '@/__tests__/setup';
import { AuthProvider } from '@/state/auth-context';
import { LoanProvider, useLoan } from '@/state/loan-context';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

jest.mock('@/lib/links', () => ({
  LINKS: { terms: 'https://example.test/terms', privacy: 'https://example.test/privacy' },
  openLink: jest.fn(async () => {}),
}));

/**
 * Fixtures live inside the factory: `jest.mock` is hoisted above every `const`
 * in this file, so a factory closing over one would hit its temporal dead zone
 * the first time the module is required.
 */
jest.mock('@/api/client', () => {
  const accounts = [
    {
      id: 'gt-4412',
      bank: 'GTBank',
      maskedNumber: '••4412',
      holder: 'Tunde Adeyemi',
      type: 'Savings',
    },
  ];

  return {
    api: {
      listAccounts: jest.fn(async () => accounts),
      acceptLoan: jest.fn(async (selection: { principal: number; tenor: unknown }) => ({
        id: 'loan-1',
        principal: selection.principal,
        total: 54_890,
        tenor: selection.tenor,
        schedule: [{ index: 1, amount: 54_890, dueAt: new Date('2026-09-12T00:00:00Z') }],
        paidCount: 0,
        disbursedTo: accounts[0],
        extendedTo: null,
      })),
    },
  };
});

const TENOR = { days: 14, payments: 1, multiplier: 1.1 };
const PRINCIPAL = 49_900;

/** The transient offer selections `confirm` reads — normally set by `offers`. */
function Seed() {
  const { selectTenor, selectPrincipal, chooseAccount } = useLoan();

  useEffect(() => {
    selectTenor(TENOR);
    selectPrincipal(PRINCIPAL);
    chooseAccount('gt-4412');
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
      <AuthProvider>
        <LoanProvider>
          <Seed />
          <ConfirmScreen />
        </LoanProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  );

  // Waiting for the hold button *is* waiting for both probes: the screen does
  // not render it until the capability check and the account lookup have both
  // reported. That is a property worth relying on, and `does not offer the hold
  // until both probes have settled` below is what keeps it true.
  await waitFor(() => expect(utils.queryByTestId('hold-to-accept')).not.toBeNull());
  return utils;
}

/**
 * Fake timers are installed *after* render — RNTL's async render and its
 * auto-cleanup both need the real queue, and the hold interval is only created
 * on `pressIn`. This mirrors the component-level pattern in
 * `conventions.test.tsx`.
 */
function installFakeTimers() {
  jest.useFakeTimers({
    doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick', 'performance'],
  });
}

/** 6% per 60ms → 17 ticks completes the sweep, just over a second. */
const HOLD_MS = 17 * 60;

describe('confirm', () => {
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('states everything being agreed to before the hold', async () => {
    const { queryByText } = await renderScreen();

    // The principal received, the total repayable, the destination, and the
    // date. If any of these moved off this screen, the hold would be confirming
    // something the borrower had not been shown.
    expect(queryByText('₦49,900')).not.toBeNull();
    expect(queryByText(/You repay ₦54,890/)).not.toBeNull();
    expect(queryByText('GTBank ••4412')).not.toBeNull();
    expect(queryByText('14 days')).not.toBeNull();
    expect(queryByText('₦4,990')).not.toBeNull(); // interest and fees
  });

  it('re-asserts the biometric and accepts the loan on a completed hold', async () => {
    localAuthMock.setScenario('success');
    const { getByTestId } = await renderScreen();
    installFakeTimers();

    await fireEvent(getByTestId('hold-to-accept'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(HOLD_MS);
    });

    await waitFor(() => expect(api.acceptLoan as jest.Mock).toHaveBeenCalledTimes(1));

    // The selection reaches the API intact — the tenor object carries the
    // multiplier the offer was priced with, not one the screen re-derived.
    expect(api.acceptLoan as jest.Mock).toHaveBeenCalledWith(
      { tenor: TENOR, principal: PRINCIPAL, accountId: 'gt-4412' },
      expect.any(String),
    );
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(loan)/success'));
  });

  it('does not accept when the biometric is refused, and leaves a live control', async () => {
    localAuthMock.setScenario('failure');
    const { getByTestId, queryByText } = await renderScreen();
    installFakeTimers();

    await fireEvent(getByTestId('hold-to-accept'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(HOLD_MS);
    });

    await waitFor(() => expect(queryByText(/could not confirm it was you/i)).not.toBeNull());
    expect(api.acceptLoan as jest.Mock).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();

    // The hold latches internally once it completes, so the screen must give
    // back a fresh one — otherwise a refused fingerprint strands the borrower
    // on a dead button with no way to try again.
    expect(getByTestId('hold-to-accept').props.accessibilityValue?.now).toBe(0);
  });

  it('releasing early neither accepts nor accumulates across attempts', async () => {
    localAuthMock.setScenario('success');
    const { getByTestId } = await renderScreen();
    installFakeTimers();

    await fireEvent(getByTestId('hold-to-accept'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(10 * 60); // 60%
    });
    await fireEvent(getByTestId('hold-to-accept'), 'pressOut');

    expect(getByTestId('hold-to-accept').props.accessibilityValue?.now).toBe(0);

    // A second partial hold must not finish what the first started.
    await fireEvent(getByTestId('hold-to-accept'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(10 * 60);
    });
    await fireEvent(getByTestId('hold-to-accept'), 'pressOut');

    expect(api.acceptLoan as jest.Mock).not.toHaveBeenCalled();
  });

  it('does not offer the hold until both probes have settled', async () => {
    localAuthMock.setScenario('success');

    /*
     * Held pending for the whole test. Two things make this necessary:
     * the mocks otherwise resolve before `render` returns, so the unsettled
     * frame is unobservable; and `mockReturnValueOnce` is not enough, because
     * the account effect runs twice — once at `accountId: null`, then again
     * once `Seed` chooses one.
     *
     * That unsettled frame is exactly what this guards. If the hold existed
     * while a probe was outstanding, a fast borrower could complete it with
     * `bioAvailable` still null, skipping the biometric re-assert while the
     * caption below claimed one had happened.
     */
    const listAccounts = api.listAccounts as jest.Mock;
    const settled = listAccounts.getMockImplementation();
    listAccounts.mockImplementation(() => new Promise(() => {}));

    try {
      const { queryByTestId, queryByText } = await render(
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 393, height: 852 },
            insets: { top: 47, left: 0, right: 0, bottom: 34 },
          }}
        >
          <AuthProvider>
            <LoanProvider>
              <Seed />
              <ConfirmScreen />
            </LoanProvider>
          </AuthProvider>
        </SafeAreaProvider>,
      );

      expect(queryByTestId('hold-to-accept')).toBeNull();
      // And no signing caption either — it must never describe a state that
      // has not been determined.
      expect(queryByText(/Signed/)).toBeNull();
    } finally {
      // `jest.clearAllMocks()` in setup.ts clears calls, not implementations,
      // so this has to be put back by hand or every later test hangs.
      listAccounts.mockImplementation(settled!);
    }
  });

  it('still lets a handset without a sensor take the loan, and says so honestly', async () => {
    localAuthMock.setScenario('no-hardware');
    const { getByTestId, queryByText } = await renderScreen();

    await waitFor(() => expect(queryByText('Signed on this device')).not.toBeNull());
    installFakeTimers();

    await fireEvent(getByTestId('hold-to-accept'), 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(HOLD_MS);
    });

    // Gating on a biometric that cannot exist would make the loan impossible to
    // take on a large share of this market's handsets.
    await waitFor(() => expect(api.acceptLoan as jest.Mock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(loan)/success'));
  });
});
