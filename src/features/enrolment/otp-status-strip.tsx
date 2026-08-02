import { StyleSheet, Text, View } from 'react-native';

import { countdown } from '@/lib/format';
import { color, radius, space, type } from '@/theme';

type Props = Readonly<{
  /** Seconds until the code can be resent. */
  resendIn: number;
  received: boolean;
}>;

/**
 * Waiting / received strip under the code boxes.
 *
 * The countdown is live so the wait is legible rather than open-ended —
 * "nothing is happening" is exactly the state that drives borrowers to call
 * support, which is the cost this product exists to remove.
 */
export function OtpStatusStrip({ resendIn, received }: Props) {
  return (
    <View style={[styles.strip, received ? styles.received : styles.waiting]}>
      <Text style={[type.caption, received ? styles.receivedText : styles.waitingText]}>
        {received
          ? 'Code received. Filled in for you.'
          : `Waiting for your code… Resend in ${countdown(resendIn)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    borderRadius: radius.panel,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    flexShrink: 0,
  },
  waiting: { backgroundColor: color.surfaceAlt },
  received: { backgroundColor: color.successBg },
  waitingText: { color: color.textMuted },
  receivedText: { color: color.successText, fontWeight: '600' },
});
