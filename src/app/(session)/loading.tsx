import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { BrandMark, Screen, Spinner } from '@/components/ui';
import { useLoan } from '@/state/loan-context';
import { color, onNavy, space, type } from '@/theme';

/**
 * Screen 7 — the beat while offers are fetched.
 *
 * Routes on what came back rather than on where the borrower came from: a
 * returning borrower with a live loan lands on `active`, everyone else on
 * `offers`. Deriving that from the previous screen is the mistake the handoff
 * attributes four defects to.
 */
export default function LoadingScreen() {
  const router = useRouter();
  const { loanLoaded, loanTaken } = useLoan();

  useEffect(() => {
    let active = true;

    api
      .getLoan()
      .then((loan) => {
        if (!active) return;
        loanLoaded(loan);
        router.replace(loan ? '/(loan)/active' : '/(loan)/offers');
      })
      .catch(() => {
        // Offers are the safe landing: a borrower who cannot be shown their
        // loan should not be stranded on a spinner.
        if (active) router.replace('/(loan)/offers');
      });

    return () => {
      active = false;
    };
    // Runs once on mount. `loanLoaded` is stable enough that re-running would
    // only re-fetch, and re-navigating mid-transition is worse than not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen surface="navy">
      <View style={styles.body}>
        <BrandMark height={32} />
        <Spinner />
        <Text style={styles.label}>
          {loanTaken ? 'Getting your loan' : 'Getting your available offers'}
        </Text>
        <Text style={styles.caption}>This takes a few seconds.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl },
  label: { ...type.bodyLarge, color: color.card },
  caption: { ...type.caption, color: onNavy.caption },
});
