import { StyleSheet, Text, View } from 'react-native';

import type { Wallet } from '@/api/types';
import { Card } from '@/components/ui';
import { accountNumber } from '@/lib/format';
import { color, onNavy, space, type } from '@/theme';

import { WALLET_BANKS } from './banks';

type Props = Readonly<{ wallet: Wallet }>;

/**
 * The account to transfer into (HANDOFF §14).
 *
 * The number is the whole point of this screen — it gets copied by hand into
 * another banking app, so it is set large, grouped in fours and tabular, and
 * carries an accessibility label that reads the digits individually rather
 * than letting a screen reader announce ten billion.
 */
export function WalletCard({ wallet }: Props) {
  const grouped = accountNumber(wallet.accountNumber);

  return (
    <Card tone="navy">
      <Text style={styles.label}>Transfer to</Text>

      <Text
        style={styles.number}
        accessibilityLabel={`Account number ${wallet.accountNumber.split('').join(' ')}`}
      >
        {grouped}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.name}>{wallet.accountName}</Text>
      <Text style={styles.bank}>{WALLET_BANKS[wallet.bank]}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { ...type.caption, color: onNavy.label },
  number: {
    fontSize: 32,
    fontWeight: '700',
    // 0.06em at 32px, per the handoff. Wide tracking is what makes a ten-digit
    // string transcribable without losing your place.
    letterSpacing: 32 * 0.06,
    color: color.card,
    fontVariant: ['tabular-nums'],
    marginTop: space.xs,
  },
  divider: {
    height: 1,
    backgroundColor: onNavy.divider,
    marginVertical: space.lg,
  },
  name: { ...type.bodyLarge, color: color.card },
  bank: { ...type.caption, color: onNavy.caption, marginTop: space.xs },
});
