import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { seedScenario } from '@/features/session/scenarios';
import { useAuth } from '@/state/auth-context';
import { useDemo, type Journey } from '@/state/demo-context';
import { useLoan } from '@/state/loan-context';
import { color, control, onNavy, radius, space, type } from '@/theme';

const JOURNEYS: { key: Journey; label: string }[] = [
  { key: 'first-run', label: 'First run' },
  { key: 'returning', label: 'Returning' },
  { key: 'active-loan', label: 'Active loan' },
  { key: 'new-phone', label: 'New phone' },
];

/**
 * The demo rail — the prototype's left rail, as a floating overlay.
 *
 * A proposal has to be walkable in any order, and reinstalling between journeys
 * is not a walkthrough. Demo affordances are a feature here, not debt (PLAN §1)
 * — but this one is visibly a dev tool so nobody mistakes it for product.
 *
 * Renders nothing unless `__DEV__`.
 */
export function DemoOverlay() {
  const { enabled, platform, setPlatform, journey, setJourney } = useDemo();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const loan = useLoan();

  if (!enabled) return null;

  const jump = async (next: Journey) => {
    setJourney(next);
    const destination = await seedScenario(next, { auth, loan });
    router.replace(destination);
    setOpen(false);
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open demo controls"
        style={styles.tab}
      >
        <Text style={styles.tabLabel}>demo</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>Demo controls</Text>
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close demo controls"
          style={styles.close}
        >
          <Text style={styles.closeLabel}>×</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Journey</Text>
      {JOURNEYS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => void jump(item.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: journey === item.key }}
          style={styles.row}
        >
          <Text style={[styles.rowLabel, journey === item.key && styles.rowLabelActive]}>
            {item.label}
          </Text>
        </Pressable>
      ))}

      <Text style={styles.section}>Platform copy</Text>
      <View style={styles.switchRow}>
        {(['android', 'ios'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setPlatform(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: platform === option }}
            style={[styles.chip, platform === option && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, platform === option && styles.chipLabelActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/(dev)/kitchen-sink')}
        accessibilityRole="button"
        style={styles.row}
      >
        <Text style={styles.rowLabel}>Kitchen sink</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    right: 0,
    top: '40%',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minHeight: control.tap,
    justifyContent: 'center',
    backgroundColor: color.ink,
    borderTopLeftRadius: radius.panel,
    borderBottomLeftRadius: radius.panel,
    opacity: 0.85,
  },
  tabLabel: { ...type.micro, color: color.amber, letterSpacing: 1 },
  panel: {
    position: 'absolute',
    right: space.md,
    top: '18%',
    width: 220,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: color.ink,
    gap: space.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { ...type.caption, color: color.card, fontWeight: '700', flex: 1 },
  close: { minWidth: control.tap, minHeight: control.tap, alignItems: 'flex-end', justifyContent: 'center' },
  closeLabel: { fontSize: 24, color: color.card },
  section: {
    ...type.micro,
    color: color.amber,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
  },
  row: { minHeight: control.tap, justifyContent: 'center' },
  rowLabel: { ...type.body, color: color.card },
  rowLabelActive: { color: color.amber, fontWeight: '700' },
  switchRow: { flexDirection: 'row', gap: space.sm },
  chip: {
    flex: 1,
    minHeight: control.tap,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: onNavy.keypad,
  },
  chipActive: { backgroundColor: color.amber },
  chipLabel: { ...type.caption, color: color.card },
  chipLabelActive: { color: color.navy, fontWeight: '700' },
});
