import { StyleSheet, View } from 'react-native';

import type { WalletBank } from '@/api/types';
import { RadioRow } from '@/components/ui';
import { space } from '@/theme';

/**
 * The two banks Migo issues wallets with (HANDOFF §13).
 *
 * Fixed rather than fetched: these are not the borrower's accounts, they are
 * where Migo can open a wallet, and the pair is a property of the product. When
 * that stops being true it becomes an API call, and this list is the only thing
 * that changes.
 */
const BANKS: readonly { id: WalletBank; name: string }[] = [
  { id: 'sterling', name: 'Sterling Bank' },
  { id: 'fidelity', name: 'Fidelity Bank' },
] as const;

type Props = Readonly<{
  selected: WalletBank | null;
  onSelect: (bank: WalletBank) => void;
}>;

export function BankChoice({ selected, onSelect }: Props) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {BANKS.map((bank) => (
        <RadioRow
          key={bank.id}
          label={bank.name}
          labelRole="name"
          selected={selected === bank.id}
          onPress={() => onSelect(bank.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm },
});
