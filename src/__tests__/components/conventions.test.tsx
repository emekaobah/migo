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
 *
 * **`render` and `fireEvent` are both awaited throughout.** On RNTL v14 with
 * React 19 they return promises and open an `act` scope; leaving one unawaited
 * means the next `act` starts inside it, and React logs "overlapping act()
 * calls" for every one. The assertions still pass, so the cost is a green run
 * full of console errors — which is how the first real warning gets missed.
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

    await fireEvent.press(getByTestId('cta'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores a disabled prop even if one is forced past the type', async () => {
    // `@ts-expect-error` alone is a compile-time guard and asserts nothing at
    // runtime. This forces the prop through and proves the button still works,
    // so a future refactor cannot quietly start honouring it.
    const onPress = jest.fn();
    const { getByTestId } = await render(
      // @ts-expect-error — Button must not accept a disabled prop.
      <Button label="Continue" onPress={onPress} testID="cta" disabled />,
    );

    await fireEvent.press(getByTestId('cta'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(getByTestId('cta').props.accessibilityState?.disabled).toBeFalsy();
  });
});

describe('HoldButton', () => {
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  /**
   * Renders, *then* installs fake timers.
   *
   * Both RNTL's async `render` and its auto-cleanup need the real timer queue.
   * Faking around them stalls the cleanup, and the symptom lands in whichever
   * test runs next as "unable to find testID" rather than in the test that
   * caused it. The hold interval is only created on `pressIn`, which happens
   * after this returns, so nothing under test escapes the fakes.
   *
   * `doNotFake` keeps the microtask queue real so React's own act scopes still
   * settle.
   */
  const renderHeld = async (onComplete: () => void) => {
    const utils = await render(<HoldButton onComplete={onComplete} testID="hold" />);
    jest.useFakeTimers({
      doNotFake: ['queueMicrotask', 'setImmediate', 'nextTick', 'performance'],
    });
    return utils;
  };

  /** Advances the sweep by `ms`, flushing the renders it triggers. */
  const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

  it('completes after about a second, and fires exactly once however long it is held', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await renderHeld(onComplete);

    await fireEvent(getByTestId('hold'), 'pressIn');
    // 6% per 60ms → 100% needs 17 ticks, just over 1s.
    await advance(17 * 60);

    expect(onComplete).toHaveBeenCalledTimes(1);

    // Holding well past completion must not accept the loan twice.
    await advance(40 * 60);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not complete early', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await renderHeld(onComplete);

    await fireEvent(getByTestId('hold'), 'pressIn');
    await advance(10 * 60); // 60%

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('resets to zero when released early, rather than accumulating', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = await renderHeld(onComplete);

    await fireEvent(getByTestId('hold'), 'pressIn');
    await advance(10 * 60); // 60%
    await fireEvent(getByTestId('hold'), 'pressOut');

    expect(getByTestId('hold').props.accessibilityValue?.now).toBe(0);

    // A second partial hold must not finish the job the first one started.
    await fireEvent(getByTestId('hold'), 'pressIn');
    await advance(10 * 60);
    await fireEvent(getByTestId('hold'), 'pressOut');

    expect(onComplete).not.toHaveBeenCalled();
  });

});
