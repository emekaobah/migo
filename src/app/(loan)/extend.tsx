import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { ExtensionQuote } from '@/api/types';
import { Amount, Button, Card, HeaderRow, InlineError, Row, Screen, Spinner } from '@/components/ui';
import { fullDate, naira } from '@/lib/format';
import { outstandingAfter } from '@/lib/loan-math';
import { useLoan } from '@/state/loan-context';
import { color, space, type } from '@/theme';

/**
 * Screen 15 — extend rather than repay in full (HANDOFF §15).
 *
 * **30% of the outstanding, carried 30 days** — client-confirmed 2026-08-02,
 * superseding the handoff's 20%/same-duration figure, whose ⚠ conflict note is
 * now closed in favour of the published FAQ (PLAN §5). The FAQ text shipped in
 * this app says the same thing, so screen and FAQ agree on the same device.
 *
 * Every figure is quoted by the API rather than computed here. The percentage,
 * the window and the rate are business inputs that will change, and a screen
 * doing this arithmetic would be a second place to update when they do — and a
 * place a borrower could be shown terms other than the ones applied.
 */
export default function ExtendScreen() {
  const router = useRouter();
  const { loan, loanLoaded } = useLoan();

  const [quote, setQuote] = useState<ExtensionQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (failed) return;
    let active = true;

    api
      .quoteExtension()
      .then((q) => {
        if (active) setQuote(q);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
    };
  }, [failed]);

  if (!loan) return <Redirect href="/(loan)/offers" />;

  const outstanding = outstandingAfter(loan.schedule, loan.paidCount);

  async function onExtend() {
    if (!quote || busy) return;

    setBusy(true);
    setError(null);

    try {
      // The quote carries the pct it was priced at, so what gets applied is
      // what was shown — not a constant this screen happens to hold.
      const extended = await api.extendLoan(quote.pct);
      loanLoaded(extended);
      router.replace('/(loan)/active');
    } catch {
      setError('We could not extend this just now. Try again.');
      setBusy(false);
    }
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />
      <Text style={styles.h1}>Extend your loan</Text>

      {failed ? (
        <View style={styles.pending}>
          <InlineError message="We could not load your extension terms. Check your connection." />
          <Button label="Try again" onPress={() => setFailed(false)} variant="tonal" />
        </View>
      ) : null}

      {!failed && !quote ? (
        <View style={styles.pending}>
          <Spinner />
        </View>
      ) : null}

      {quote ? (
        <>
          <Card tone="tonal">
            <Text style={styles.owedLabel}>You owe now</Text>
            <Amount value={naira(outstanding)} size="h2" />
          </Card>

          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Pay today ({Math.round(quote.pct * 100)}%)</Text>
            <Amount value={naira(quote.payToday)} size="display" />
          </View>

          <Card>
            <Row label="Carries over" value={naira(quote.carried)} divider />
            <Row
              label={`You'll owe after ${quote.days} days`}
              value={naira(quote.newOutstanding)}
              divider
            />
            <Row label="New due date" value={fullDate(quote.newDueAt)} />
          </Card>

          <Text style={styles.note}>
            Interest applies to the amount that carries over. Paying before the
            new date costs no more.
          </Text>

          <View style={styles.footer}>
            {error ? <InlineError message={error} /> : null}

            {busy ? (
              <View style={styles.busy}>
                <Spinner size={32} />
              </View>
            ) : (
              <Button
                label={`Pay ${naira(quote.payToday)} and extend`}
                onPress={onExtend}
                variant="success"
              />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.h1, marginTop: space.sm, marginBottom: space.xl },
  pending: { paddingVertical: space.xxl, alignItems: 'center', gap: space.lg },
  owedLabel: { ...type.caption, marginBottom: space.xs },
  hero: { marginVertical: space.xl },
  heroLabel: { ...type.caption, color: color.warningText, fontWeight: '700' },
  note: { ...type.caption, marginTop: space.lg },
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
  busy: { alignItems: 'center', paddingVertical: space.lg },
});
