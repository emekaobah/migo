import { render } from '@testing-library/react-native';

import {
  Accordion,
  Avatar,
  Button,
  Chip,
  HeaderRow,
  HoldButton,
  Keypad,
  Pill,
  RadioRow,
  Row,
  SegmentedProgress,
} from '@/components/ui';
import { PaymentSchedule } from '@/features/loans/payment-schedule';
import { DetectionState } from '@/features/repayment/detection-state';
import { BiometricTarget } from '@/features/session/biometric-target';
import { control } from '@/theme';

/**
 * The handoff's accessibility list, checked mechanically (PLAN §8a).
 *
 * Walks the rendered tree rather than inspecting source, so it catches a
 * primitive that stops meeting the bar as well as one that never did. The list
 * being verified, verbatim from HANDOFF §"Accessibility":
 *
 *   - No disabled buttons. Validate on submit with an inline message.
 *   - Nothing depends on colour alone — payment status is a word, selection
 *     has a radio.
 *   - 48px targets, including back rows and quick-reply chips.
 *   - Fixed-height controls need flex-shrink: 0 inside scrolling columns.
 *
 * Contrast is covered separately in `theme/contrast.test.ts`, per the plan's
 * note that it is checked once against the token table rather than per screen.
 */

/**
 * The shape RNTL's `toJSON()` returns.
 *
 * Declared here rather than imported from `react-test-renderer`, which is not a
 * dependency of this project — pulling in a package for one type would be a
 * heavier change than the type is worth.
 */
type Node = {
  type: string;
  props: Record<string, unknown> & {
    accessibilityRole?: string;
    accessibilityLabel?: string;
    accessibilityState?: Record<string, unknown>;
    style?: unknown;
  };
  children: (Node | string)[] | null;
};

/** Every node in the tree, depth-first. */
function walk(node: Node | Node[] | string | null): Node[] {
  if (node === null || typeof node === 'string') return [];
  if (Array.isArray(node)) return node.flatMap(walk);
  const children = node.children ?? [];
  return [node, ...children.flatMap((child) => walk(child))];
}

/** RN styles arrive as objects, arrays, or nested arrays. Flatten to one object. */
function flattenStyle(style: unknown): Record<string, unknown> {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle));
  return style as Record<string, unknown>;
}

const INTERACTIVE_ROLES = new Set(['button', 'radio', 'link', 'checkbox', 'switch']);

const isInteractive = (node: Node) => {
  const role = node.props?.accessibilityRole;
  return typeof role === 'string' && INTERACTIVE_ROLES.has(role);
};

/** The declared height of a node, whichever way it was expressed. */
function declaredHeight(node: Node): number | null {
  const style = flattenStyle(node.props?.style);
  for (const key of ['minHeight', 'height'] as const) {
    const value = style[key];
    if (typeof value === 'number') return value;
  }
  return null;
}

const noop = () => {};

describe('no disabled buttons — the convention, swept across primitives', () => {
  it.each([
    ['Button', <Button key="b" label="Continue" onPress={noop} />],
    ['HoldButton', <HoldButton key="h" onComplete={noop} />],
    ['Chip', <Chip key="c" label="Extend my loan" onPress={noop} />],
    ['Row', <Row key="r" label="Payout account" onPress={noop} chevron />],
    ['Pill', <Pill key="p" label="14 days" sub="1 payment" selected={false} onPress={noop} />],
  ])('%s never reports itself disabled', async (_name, element) => {
    const { toJSON } = await render(element);

    walk(toJSON() as Node)
      .filter(isInteractive)
      .forEach((node) => {
        expect(node.props.accessibilityState?.disabled).toBeFalsy();
      });
  });
});

describe('the one control allowed to disable itself', () => {
  /**
   * `BiometricTarget` is the single exception to "no disabled buttons", and it
   * is an exception to the letter of the rule rather than its intent: the rule
   * exists so a borrower can always discover what is wrong, and a handset with
   * no sensor is not something they can fix. PIN is offered beside it as a
   * complete alternative.
   *
   * Asserted rather than described, so a control that starts disabling itself
   * for *validation* — the thing the handoff actually forbids — fails here.
   */
  it('is enabled whenever the handset has a sensor', async () => {
    const { getByTestId } = await render(
      <BiometricTarget onPress={noop} recognised={false} />,
    );

    expect(getByTestId('biometric-target').props.accessibilityState?.disabled).toBeFalsy();
  });

  it('disables itself only when no sensor exists, and says why', async () => {
    const { getByTestId } = await render(
      <BiometricTarget onPress={noop} recognised={false} unavailable />,
    );

    const target = getByTestId('biometric-target');
    expect(target.props.accessibilityState?.disabled).toBe(true);
    // Silence would be the real failure — a screen-reader user meeting a dead
    // control with no explanation.
    expect(String(target.props.accessibilityLabel).trim().length).toBeGreaterThan(0);
  });
});

describe('48px targets — including the ones the handoff names', () => {
  it.each([
    ['a back row', <HeaderRow key="h" variant="back" title="Help" onBack={noop} />],
    ['a quick-reply chip', <Chip key="c" label="My code has not arrived" onPress={noop} />],
    ['a list row', <Row key="r" label="Help & FAQs" onPress={noop} chevron />],
    ['a tenor pill', <Pill key="p" label="90 days" sub="3 payments" selected onPress={noop} />],
    ['an amount row', <RadioRow key="a" label="₦49,900" selected={false} onPress={noop} />],
    ['the avatar', <Avatar key="v" name="Tunde Adeyemi" onPress={noop} />],
    ['a primary button', <Button key="b" label="Continue" onPress={noop} />],
    ['a small button', <Button key="s" label="Extend" onPress={noop} small />],
  ])('%s is at least 48px tall', async (_name, element) => {
    const { toJSON } = await render(element);
    const targets = walk(toJSON() as Node).filter(isInteractive);

    expect(targets.length).toBeGreaterThan(0);
    targets.forEach((node) => {
      const height = declaredHeight(node);
      // A node with no declared height is sized by its content and padding,
      // which this test cannot measure — those are covered by the on-device
      // pass. What it can catch is a control that declares a height under the
      // floor, which is the regression that actually happens.
      if (height !== null) expect(height).toBeGreaterThanOrEqual(control.tap);
    });
  });

  it('keeps every keypad key above the floor at all three heights', async () => {
    for (const keyHeight of [50, 54, 56] as const) {
      const { toJSON } = await render(
        <Keypad keyHeight={keyHeight} onDigit={noop} onBackspace={noop} />,
      );

      walk(toJSON() as Node)
        .filter(isInteractive)
        .forEach((node) => {
          const height = declaredHeight(node);
          if (height !== null) expect(height).toBeGreaterThanOrEqual(control.tap);
        });
    }
  });
});

describe('every interactive element names itself', () => {
  it.each([
    ['Button', <Button key="b" label="Get my wallet details" onPress={noop} />],
    ['Chip', <Chip key="c" label="Payment not showing" onPress={noop} />],
    ['Row', <Row key="r" label="Terms and conditions" onPress={noop} chevron />],
    ['Pill', <Pill key="p" label="30 days" sub="1 payment" selected={false} onPress={noop} />],
    ['RadioRow', <RadioRow key="a" label="GTBank ••4412" selected onPress={noop} />],
    ['Avatar', <Avatar key="v" name="Tunde Adeyemi" onPress={noop} />],
    ['HoldButton', <HoldButton key="h" onComplete={noop} />],
    ['back row', <HeaderRow key="hb" variant="back" onBack={noop} />],
    ['help row', <HeaderRow key="hh" variant="brand" onHelp={noop} />],
  ])('%s carries a non-empty accessibility label', async (_name, element) => {
    const { toJSON } = await render(element);

    walk(toJSON() as Node)
      .filter(isInteractive)
      .forEach((node) => {
        const label = node.props.accessibilityLabel;
        expect(typeof label).toBe('string');
        expect((label as string).trim().length).toBeGreaterThan(0);
      });
  });

  it('gives the avatar a usable label even before the name loads', async () => {
    // Screens pass `name ?? ''` while the profile is still loading.
    const { getByLabelText } = await render(<Avatar name="" onPress={noop} />);
    expect(getByLabelText('Account')).toBeTruthy();
  });
});

describe('nothing depends on colour alone', () => {
  const SCHEDULE = [
    { index: 1, amount: 45_484, dueAt: new Date('2026-09-04T00:00:00Z') },
    { index: 2, amount: 45_484, dueAt: new Date('2026-10-04T00:00:00Z') },
    { index: 3, amount: 45_484, dueAt: new Date('2026-11-03T00:00:00Z') },
  ];

  it('states payment status as a word, not a colour', async () => {
    const { queryByText } = await render(<PaymentSchedule schedule={SCHEDULE} paidCount={1} />);

    // One of each, so the mapping itself is under test rather than the mere
    // presence of some word.
    expect(queryByText('Paid')).not.toBeNull();
    expect(queryByText('Next')).not.toBeNull();
    expect(queryByText('Upcoming')).not.toBeNull();
  });

  it('announces each schedule row as one sentence, status included', async () => {
    const { getByLabelText } = await render(<PaymentSchedule schedule={SCHEDULE} paidCount={1} />);

    // A label on a non-accessible View is read past by VoiceOver, so this also
    // guards the `accessible` prop that makes the composed label win.
    expect(getByLabelText(/Payment 1,.*Paid/)).toBeTruthy();
    expect(getByLabelText(/Payment 2,.*Next/)).toBeTruthy();
  });

  it('names the wallet detection state in words', async () => {
    const waiting = await render(<DetectionState received={false} amount={45_484} />);
    expect(waiting.queryByText('Waiting for your transfer')).not.toBeNull();

    const received = await render(<DetectionState received amount={45_484} />);
    expect(received.queryByText('Payment received')).not.toBeNull();
  });

  it('exposes selection through a radio state, not just a fill', async () => {
    const { toJSON } = await render(
      <RadioRow label="₦199,700" selected onPress={noop} />,
    );

    const radios = walk(toJSON() as Node).filter((n) => n.props?.accessibilityRole === 'radio');
    expect(radios.length).toBeGreaterThan(0);
    radios.forEach((node) => expect(node.props.accessibilityState?.selected).toBe(true));
  });

  it('exposes accordion open state, not just a rotated chevron', async () => {
    const { toJSON } = await render(
      <Accordion
        items={[{ key: 'q', question: 'How do I extend my loan?', answer: ['Repay 30%.'] }]}
        openKey="q"
        onToggle={noop}
      />,
    );

    const headers = walk(toJSON() as Node).filter(isInteractive);
    expect(headers.some((n) => n.props.accessibilityState?.expanded === true)).toBe(true);
  });

  it('gives the progress bar a text equivalent rather than segments alone', async () => {
    // `SegmentedProgress` is decorative; `OutstandingCard` states "N of M
    // payments cleared" beside it. Assert the bar claims no meaning of its own.
    const { toJSON } = await render(<SegmentedProgress total={3} cleared={1} />);
    const interactive = walk(toJSON() as Node).filter(isInteractive);
    expect(interactive).toHaveLength(0);
  });
});
