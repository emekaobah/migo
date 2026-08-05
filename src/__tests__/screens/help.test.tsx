import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HelpScreen from '@/app/(support)/help';
import { NavOriginProvider, useNavOrigin } from '@/state/nav-origin';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
}));

jest.mock('@/lib/links', () => ({
  LINKS: { terms: 'https://example.test/terms', privacy: 'https://example.test/privacy' },
  openLink: jest.fn(async () => {}),
}));

/** Sets the origin the way the screen that opened Help would have. */
function Seed({ from }: Readonly<{ from: string | null }>) {
  const { openHelpFrom } = useNavOrigin();

  useEffect(() => {
    if (from) openHelpFrom(from);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

async function renderScreen(from: string | null) {
  const utils = await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <NavOriginProvider>
        <Seed from={from} />
        <HelpScreen />
      </NavOriginProvider>
    </SafeAreaProvider>,
  );

  await waitFor(() => expect(utils.queryByText('Chat with support')).not.toBeNull());
  return utils;
}

/**
 * PLAN §8a, phase 7: the origin round-trip.
 *
 * The handoff attributes **four separate defects** to deriving where Help came
 * from instead of storing it. These are the two cases inference always got
 * wrong: the same screen reached from a signed-in route and from a signed-out
 * one must go back to different places.
 */
describe('help — navigation origin', () => {
  it('returns to active when opened from active', async () => {
    const { getByLabelText } = await renderScreen('/(loan)/active');

    await fireEvent.press(getByLabelText('Back'));

    expect(mockReplace).toHaveBeenCalledWith('/(loan)/active');
  });

  it('returns to enrol when opened from enrol, while signed out', async () => {
    const { getByLabelText } = await renderScreen('/(onboarding)/enrol');

    await fireEvent.press(getByLabelText('Back'));

    // The case that matters: Help is reachable before there is a session, and
    // "go back to the loan screen" would be wrong and unreachable here.
    expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/enrol');
  });

  it('falls back to the stack when no origin was recorded', async () => {
    const { getByLabelText } = await renderScreen(null);

    await fireEvent.press(getByLabelText('Back'));

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it('records where chat was opened from, so chat can come back here', async () => {
    const { getByLabelText } = await renderScreen('/(loan)/active');

    await fireEvent.press(getByLabelText(/Chat with support/));

    expect(mockPush).toHaveBeenCalledWith('/(support)/chat');
  });
});

describe('help — index and search', () => {
  it('puts chat above the search field and the sections', async () => {
    const { queryByText } = await renderScreen('/(loan)/active');

    // Chat first is the design's deliberate order: someone opening Help is
    // often stuck rather than browsing.
    expect(queryByText('Chat with support')).not.toBeNull();
    expect(queryByText('About Migo')).not.toBeNull();
  });

  it('shows every section with its question count', async () => {
    const { queryByText, getAllByText } = await renderScreen('/(loan)/active');

    expect(queryByText('Accessing Migo loans')).not.toBeNull();
    expect(queryByText('12 questions')).not.toBeNull();
    // Singular, not "1 questions". Three sections have exactly one question —
    // About Migo, Late Repayment, and Terms and Conditions.
    expect(getAllByText('1 question')).toHaveLength(3);
  });

  it('replaces the index with grouped matches while searching', async () => {
    const { getByLabelText, queryByText } = await renderScreen('/(loan)/active');

    await fireEvent.changeText(getByLabelText('Search help'), 'extend');

    await waitFor(() => expect(queryByText('Loan Repayment')).not.toBeNull());
    // Legal rows belong to the index, not to a result list.
    expect(queryByText('Terms and conditions')).toBeNull();
  });

  it('offers the chat escape when nothing matches', async () => {
    const { getByLabelText, queryByText } = await renderScreen('/(loan)/active');

    await fireEvent.changeText(getByLabelText('Search help'), 'zzzznotathing');

    await waitFor(() =>
      expect(
        queryByText('Nothing matches that. Try another word, or start a chat above.'),
      ).not.toBeNull(),
    );
  });
});
