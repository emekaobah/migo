import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { Avatar, Button, InlineError, Screen, Spinner } from '@/components/ui';
import { AmountList } from '@/features/loans/amount-list';
import { ScheduleCard } from '@/features/loans/schedule-card';
import { TenorGrid } from '@/features/loans/tenor-grid';
import { naira } from '@/lib/format';
import { buildSchedule, totalRepayable } from '@/lib/loan-math';
import { useAuth } from '@/state/auth-context';
import { useLoan } from '@/state/loan-context';
import { color, control, space, type } from '@/theme';

/**
 * Screen 8 — pick duration, then amount, **in that order** (HANDOFF §8).
 *
 * The two stages are sequential rather than side by side because the amount
 * rows quote a real per-payment figure, and that figure does not exist until a
 * tenor's multiplier is known. Showing amounts first would mean showing a range
 * and then correcting it, which is how a borrower ends up remembering the wrong
 * number.
 */
export default function OffersScreen() {
  const router = useRouter();
  const { name } = useAuth();
  const {
    offers,
    offersLoaded,
    tenor,
    principal,
    selectTenor,
    selectPrincipal,
    accountChosen,
  } = useLoan();

  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Normally a no-op: `loading` fetched these and this screen renders with them
  // already in hand. This covers the two cases where it did not — a failed
  // fetch upstream, and arriving here directly — without a redirect that could
  // bounce between the two screens forever.
  useEffect(() => {
    if (offers || failed) return;
    let active = true;

    api
      .getOffers()
      .then((loaded) => {
        if (active) offersLoaded(loaded);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers, failed]);

  const total = tenor && principal ? totalRepayable(principal, tenor.multiplier) : null;

  // Frozen for the visit. Reading `new Date()` inside the memo factory made it
  // impure: React may discard and re-run a memo at any time, and Strict Mode
  // does it twice on mount, so each run would seed the schedule from a new
  // "now" and the quoted dates could shift under the borrower across midnight.
  const [origin] = useState(() => new Date());

  const schedule = useMemo(
    () => (tenor && principal ? buildSchedule(principal, tenor, origin) : null),
    [tenor, principal, origin],
  );

  function onContinue() {
    // Validation lives in the press handler and surfaces inline, because
    // `Button` has no `disabled` prop by design (PLAN §3.3) — a dead CTA tells
    // a borrower nothing about what is missing.
    if (!tenor) {
      setError('Pick how long you need it.');
      return;
    }
    if (!principal) {
      setError('Pick how much you need.');
      return;
    }

    setError(null);
    // Routing is on whether an account has ever been chosen — stored, never
    // inferred from the loan or the screen history (HANDOFF §"Interactions").
    router.push(accountChosen ? '/(loan)/confirm' : '/(loan)/banks');
  }

  if (!offers) {
    return (
      <Screen surface="surface">
        <View style={styles.pending}>
          {failed ? (
            <>
              <InlineError message="We could not load your offers. Check your connection." />
              <Button label="Try again" onPress={() => setFailed(false)} variant="tonal" />
            </>
          ) : (
            <Spinner />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen surface="surface" scroll>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.approved}>You&rsquo;re approved</Text>
          <Text style={styles.h1}>How long do you need it?</Text>
        </View>
        <Avatar name={name ?? ''} onPress={() => router.push('/(account)/account')} />
      </View>

      <TenorGrid tenors={offers.tenors} selected={tenor} onSelect={selectTenor} />

      {tenor ? (
        <View style={styles.stage}>
          <Text style={styles.h2}>How much do you need?</Text>
          <AmountList
            amounts={offers.amounts}
            tenor={tenor}
            selected={principal}
            onSelect={selectPrincipal}
          />
        </View>
      ) : null}

      {schedule ? (
        <View style={styles.stage}>
          <ScheduleCard schedule={schedule} />
        </View>
      ) : null}

      <View style={styles.footer}>
        {error ? <InlineError message={error} /> : null}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total owed</Text>
          <Text style={styles.totalValue}>{total === null ? '—' : naira(total)}</Text>
        </View>

        <Button label="Continue" onPress={onContinue} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pending: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    minHeight: control.tap,
    paddingVertical: space.md,
  },
  headerText: { flex: 1 },
  approved: { ...type.caption, color: color.success, fontWeight: '700' },
  h1: { ...type.h1, marginTop: space.xs },
  h2: { ...type.h2, marginBottom: space.md },
  stage: { marginTop: space.xl },
  // `marginTop: 'auto'` against the scroll container's `flexGrow: 1` pins the
  // footer to the bottom when the content is short, and lets it follow the
  // content when a three-payment schedule pushes the page past a screenful.
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { ...type.bodyLarge },
  totalValue: { ...type.h2, fontVariant: ['tabular-nums'] },
});
