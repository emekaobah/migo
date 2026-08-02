import { act, fireEvent, render } from '@testing-library/react-native';

import { Button, HoldButton } from '@/components/ui';

/**
 * The two hard conventions from PLAN §3.3, asserted rather than trusted.
 *
 * The handoff attributes four separate defects to breaking these, so they get
 * tests rather than a code review comment.
 *
 * Queries come from `render()` rather than the global `screen` — RNTL's screen
 * export is not wired up in this setup and throws `notImplemented`.
 */

describe('Button is never disabled', () => {
  const VARIANTS = [
    'primary-amber',
    'primary-navy',
    'tonal',
    'outlined',
    'destructive',
    'tertiary',
  ] as const;

  it.each(VARIANTS)('%s exposes no disabled accessibility state', async (variant) => {
    const { getByTestId } = await render(
      <Button label="Continue" variant={variant} onPress={() => {}} testID="cta" />,
    );

    expect(getByTestId('cta').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('always fires onPress — validation belongs in the handler, not the control', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<Button label="Continue" onPress={onPress} testID="cta" />);

    fireEvent.press(getByTestId('cta'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has no disabled prop in its public type', async () => {
    // A compile-time guard made explicit: adding `disabled` should fail review.
    // @ts-expect-error — Button must not accept a disabled prop.
    await render(<Button label="Continue" onPress={() => {}} disabled />);
  });
});

describe('HoldButton', () => {
  /**
   * `doNotFake` keeps the microtask queue real. RNTL v14's `render` is async,
   * and faking every timer stalls both it and the auto-cleanup between tests —
   * which shows up as "unable to find testID" in whichever test runs next,
   * rather than as a failure in the test that actually caused it.
   */
  beforeEach(() => {
    jest.useFakeTimers({
      doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick', 'performance'],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderHeld = (onComplete: () => void) =>
    render(<HoldButton onComplete={onComplete} testID="hold" />);

  it('completes after about a second, and fires exactly once however long it is held', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await renderHeld(onComplete);

    fireEvent(getByTestId('hold'), 'pressIn');
    act(() => {
      // 6% per 60ms → 100% needs 17 ticks, just over 1s.
      jest.advanceTimersByTime(17 * 60);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);

    // Holding well past completion must not accept the loan twice.
    act(() => jest.advanceTimersByTime(40 * 60));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not complete early', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await renderHeld(onComplete);

    fireEvent(getByTestId('hold'), 'pressIn');
    act(() => jest.advanceTimersByTime(10 * 60)); // 60%

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('resets to zero when released early, rather than accumulating', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await renderHeld(onComplete);

    fireEvent(getByTestId('hold'), 'pressIn');
    act(() => jest.advanceTimersByTime(10 * 60)); // 60%
    fireEvent(getByTestId('hold'), 'pressOut');

    expect(getByTestId('hold').props.accessibilityValue?.now).toBe(0);

    // A second partial hold must not finish the job the first one started.
    fireEvent(getByTestId('hold'), 'pressIn');
    act(() => jest.advanceTimersByTime(10 * 60));
    fireEvent(getByTestId('hold'), 'pressOut');

    expect(onComplete).not.toHaveBeenCalled();
  });

});
