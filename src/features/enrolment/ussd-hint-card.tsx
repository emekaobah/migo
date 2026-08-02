import { StyleSheet, Text } from 'react-native';

import { Button, Card } from '@/components/ui';
import { ENROL_CODE } from '@/lib/ussd';
import { color, space, type } from '@/theme';

type Props = Readonly<{ onUseUssd: () => void }>;

/**
 * The escape hatch on `otp`.
 *
 * "Don't call us" is the whole point: agents reading codes aloud is the
 * revenue leak and security liability this product was built to close, so the
 * alternative has to be visible before the borrower reaches for the phone.
 */
export function UssdHintCard({ onUseUssd }: Props) {
  return (
    <Card tone="white">
      <Text style={styles.title}>Code not arriving?</Text>
      <Text style={styles.body}>
        Don&apos;t call us. Dial <Text style={styles.code}>{ENROL_CODE}</Text> from this SIM and
        choose <Text style={styles.strong}>Set up app</Text>.
      </Text>
      <Button
        label={`Verify with ${ENROL_CODE} instead`}
        variant="outlined"
        small
        onPress={onUseUssd}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { ...type.bodyLarge, fontWeight: '600', marginBottom: space.sm },
  body: { ...type.body, color: color.textSecondary, lineHeight: 22 },
  code: { fontWeight: '700', color: color.navy },
  strong: { fontWeight: '700' },
  button: { marginTop: space.lg },
});
