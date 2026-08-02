import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Accordion,
  Amount,
  BrandMark,
  Button,
  Card,
  Chip,
  CodeBoxes,
  HeaderRow,
  HoldButton,
  InlineError,
  Keypad,
  Pill,
  PinDots,
  RadioRow,
  Row,
  Screen,
  SegmentedProgress,
  Spinner,
} from '@/components/ui';
import { instalmentLine, naira } from '@/lib/format';
import { color, space, type } from '@/theme';

/**
 * Every primitive in every state, for side-by-side comparison with the
 * prototype at a 393×852 viewport (PLAN §8a).
 *
 * Dev-only. Phase 2 adds the route guard that strips `(dev)` from production
 * builds; until then nothing links here, so it is only reachable by typing the
 * path.
 */
export default function KitchenSink() {
  const [tenor, setTenor] = useState(1);
  const [amount, setAmount] = useState(0);
  const [code, setCode] = useState('123');
  const [pin, setPin] = useState(2);
  const [openFaq, setOpenFaq] = useState<string | null>('a');
  const [held, setHeld] = useState(0);

  return (
    <Screen surface="surface" scroll>
      <Section label="Header rows">
        <View style={styles.navyBlock}>
          <HeaderRow variant="brand" onHelp={() => {}} />
        </View>
        <HeaderRow variant="step" step="Step 1 of 2" onHelp={() => {}} />
        <HeaderRow variant="back" title="Confirm the loan" onBack={() => {}} />
      </Section>

      <Section label="Brand mark — 26px and 32px (placeholder, see OPEN-QUESTIONS #5)">
        <View style={[styles.navyBlock, styles.rowGap]}>
          <BrandMark height={26} />
          <BrandMark height={32} />
        </View>
      </Section>

      <Section label="Buttons — never disabled">
        <Button label="Continue" onPress={() => {}} variant="primary-amber" />
        <Button label="View my loan" onPress={() => {}} variant="primary-navy" />
        <Button label="Extend" onPress={() => {}} variant="tonal" />
        <Button label="Verify with *561# instead" onPress={() => {}} variant="outlined" />
        <Button label="Sign out" onPress={() => {}} variant="destructive" />
        <Button label="Stay signed in" onPress={() => {}} variant="tertiary" />
        <View style={styles.navyBlock}>
          <Button label="Use PIN instead" onPress={() => {}} variant="outlined" onDark />
        </View>
      </Section>

      <Section label={`Hold to accept — completes at 100 (${held} completions)`}>
        <HoldButton onComplete={() => setHeld((n) => n + 1)} />
      </Section>

      <Section label="Amounts — tabular">
        <Amount value={naira(199_700)} size="displayLarge" />
        <Amount value={naira(99_600)} size="display" />
        <Amount value={naira(36_567)} size="h2" />
        <Text style={type.caption}>{instalmentLine(3, 36_567)}</Text>
      </Section>

      <Section label="Cards">
        <Card tone="white">
          <Text style={type.body}>White — cards and rows</Text>
        </Card>
        <Card tone="tonal">
          <Text style={type.body}>Tonal</Text>
        </Card>
        <Card tone="success">
          <Text style={[type.body, styles.successText]}>Payment received</Text>
        </Card>
        <Card tone="warning">
          <Text style={[type.body, styles.warningText]}>You repay ₦115,536 in three parts</Text>
        </Card>
        <Card tone="navy">
          <Text style={[type.caption, styles.onNavyLabel]}>Outstanding</Text>
          <Amount value={naira(115_536)} onDark />
          <View style={styles.spacer} />
          <SegmentedProgress total={3} cleared={1} />
          <Text style={[type.caption, styles.onNavyLabel]}>1 of 3 payments cleared</Text>
        </Card>
      </Section>

      <Section label="Tenor pills — selected and unselected">
        <View style={styles.pillGrid}>
          {[
            { label: '14 days', sub: '1 payment' },
            { label: '30 days', sub: '1 payment' },
            { label: '60 days', sub: '2 payments' },
            { label: '90 days', sub: '3 payments' },
          ].map((t, i) => (
            <Pill
              key={t.label}
              label={t.label}
              sub={t.sub}
              selected={i === tenor}
              onPress={() => setTenor(i)}
              style={styles.pillCell}
            />
          ))}
        </View>
      </Section>

      <Section label="Amount rows — radio, never colour alone">
        {[49_900, 99_600, 199_700].map((value, i) => (
          <RadioRow
            key={value}
            label={naira(value)}
            sub={instalmentLine(3, Math.round((value * 1.37) / 3))}
            selected={i === amount}
            onPress={() => setAmount(i)}
          />
        ))}
      </Section>

      <Section label="Rows">
        <Row label="Payout account" value="GTBank ••4412" chevron onPress={() => {}} />
        <Row label="This device" sub="iPhone 16 Pro" divider />
        <Row label="Sign out of this phone" destructive onPress={() => {}} />
      </Section>

      <Section label="Code boxes — filled, active, empty">
        <CodeBoxes value={code} />
        <View style={styles.rowGap}>
          <Button label="Add digit" small variant="tonal" onPress={() => setCode((c) => (c + '7').slice(0, 6))} />
          <Button label="Clear" small variant="tonal" onPress={() => setCode('')} />
        </View>
      </Section>

      <Section label="PIN dots — light and on navy">
        <PinDots filled={pin} />
        <View style={styles.navyBlock}>
          <PinDots filled={pin} onDark />
        </View>
        <Button label="Toggle" small variant="tonal" onPress={() => setPin((p) => (p + 1) % 7)} />
      </Section>

      <Section label="Keypad — 50 / 54 / 56px keys">
        <Keypad keyHeight={50} onDigit={() => {}} onBackspace={() => {}} />
        <View style={styles.navyBlock}>
          <Keypad keyHeight={56} onDark onDigit={() => {}} onBackspace={() => {}} />
        </View>
      </Section>

      <Section label="Chips">
        <View style={styles.rowGap}>
          <Chip label="My code has not arrived" onPress={() => {}} />
          <Chip label="I changed my phone" onPress={() => {}} />
        </View>
      </Section>

      <Section label="Spinner and progress">
        <View style={styles.navyBlock}>
          <Spinner />
        </View>
        <SegmentedProgress total={3} cleared={0} style={styles.onLight} />
        <SegmentedProgress total={3} cleared={2} style={styles.onLight} />
      </Section>

      <Section label="Inline errors — light and on navy">
        <InlineError message="Your number needs all 10 digits after +234." />
        <View style={styles.navyBlock}>
          <InlineError message="Your number needs all 10 digits after +234." onDark />
        </View>
      </Section>

      <Section label="Accordion — single open">
        <Card tone="white">
          <Accordion
            openKey={openFaq}
            onToggle={(key) => setOpenFaq((current) => (current === key ? null : key))}
            items={[
              { key: 'a', question: 'How do I get a Migo loan?', answer: ['Dial *561# from your registered line.'] },
              { key: 'b', question: 'What happens if I repay late?', answer: ['A late fee applies.'] },
            ]}
          />
        </Card>
      </Section>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingVertical: space.lg },
  sectionLabel: {
    ...type.micro,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: space.md,
  },
  sectionBody: { gap: space.md },
  navyBlock: {
    backgroundColor: color.navy,
    padding: space.lg,
    borderRadius: 16,
    gap: space.md,
  },
  rowGap: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', alignItems: 'center' },
  pillGrid: { flexDirection: 'row', gap: 7 },
  pillCell: { flex: 1 },
  spacer: { height: space.md },
  successText: { color: color.successText },
  warningText: { color: color.warningText },
  onNavyLabel: { color: color.card, opacity: 0.66 },
  onLight: { backgroundColor: color.surfaceAlt, borderRadius: 3 },
});
