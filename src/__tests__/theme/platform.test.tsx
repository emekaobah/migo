import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DemoContext, type DemoValue } from '@/state/demo-context';
import { usePlatform } from '@/state/use-platform';
import { platformTokens, radius, runtimePlatform } from '@/theme';

/**
 * The demo overlay's platform switch, asserted rather than assumed.
 *
 * These values were module constants resolved from `Platform.OS` at import
 * time, which made the switch silently inert — the overlay's chips changed
 * colour and nothing else moved. That is the failure this file exists to catch,
 * because it is invisible in every other test: everything still renders, just
 * always for one platform.
 */

describe('platformTokens', () => {
  it('gives Android M3 pill buttons and iOS a rounded rect', () => {
    expect(platformTokens('android').buttonRadius).toBe(radius.pill);
    expect(platformTokens('ios').buttonRadius).toBe(radius.card);
  });

  it('omits the in-screen back affordance on Android, where the gesture is the back', () => {
    expect(platformTokens('android').showsInScreenBack).toBe(false);
    expect(platformTokens('ios').showsInScreenBack).toBe(true);
  });

  it('uses the platform noun in user-facing biometric copy', () => {
    expect(platformTokens('android').biometric.noun).toBe('fingerprint');
    expect(platformTokens('ios').biometric.noun).toBe('Face ID');
  });

  it('gives the PIN equal prominence only on iOS', () => {
    expect(platformTokens('ios').pinHasEqualProminence).toBe(true);
    expect(platformTokens('android').pinHasEqualProminence).toBe(false);
  });
});

function Probe() {
  const { biometric, buttonRadius } = usePlatform();
  return <Text testID="probe">{`${biometric.noun}:${buttonRadius}`}</Text>;
}

const demo = (overrides: Partial<DemoValue>): DemoValue => ({
  enabled: true,
  platform: 'ios',
  setPlatform: () => {},
  journey: null,
  setJourney: () => {},
  ...overrides,
});

describe('usePlatform', () => {
  it('reaches components when the demo overlay overrides the platform', async () => {
    const { getByTestId } = await render(
      <DemoContext.Provider value={demo({ platform: 'android' })}>
        <Probe />
      </DemoContext.Provider>,
    );

    expect(getByTestId('probe').props.children).toBe(`fingerprint:${radius.pill}`);
  });

  it('ignores the override in a production build, where the overlay is off', async () => {
    const { getByTestId } = await render(
      // A release build cannot reach the overlay, so whatever the stored value
      // happens to be must not change what a borrower sees.
      <DemoContext.Provider value={demo({ enabled: false, platform: 'android' })}>
        <Probe />
      </DemoContext.Provider>,
    );

    const { biometric, buttonRadius } = platformTokens(runtimePlatform);
    expect(getByTestId('probe').props.children).toBe(`${biometric.noun}:${buttonRadius}`);
  });

  it('falls back to the real platform with no provider at all', async () => {
    // Primitives must stay renderable in isolation — a unit test should not
    // have to mount the demo provider to render a Button.
    const { getByTestId } = await render(<Probe />);

    const { biometric, buttonRadius } = platformTokens(runtimePlatform);
    expect(getByTestId('probe').props.children).toBe(`${biometric.noun}:${buttonRadius}`);
  });
});
