import { StyleSheet, View } from 'react-native';

import type { WalletBank } from '@/api/types';
import { RadioRow } from '@/components/ui';
import { space } from '@/theme';

import { WALLET_BANK_ORDER, WALLET_BANKS } from './banks';

type Props = Readonly<{
  selected: WalletBank | null;
  onSelect: (bank: WalletBank) => void;
}>;

/** Where Migo opens the wallet (HANDOFF §13). Names come from `banks.ts`. */
export function BankChoice({ selected, onSelect }: Props) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {WALLET_BANK_ORDER.map((bank) => (
        <RadioRow
          key={bank}
          label={WALLET_BANKS[bank]}
          labelRole="name"
          selected={selected === bank}
          onPress={() => onSelect(bank)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
});
