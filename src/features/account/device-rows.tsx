import { Card, Row } from '@/components/ui';
import { biometric } from '@/theme';

type Props = Readonly<{
  /** Null until the profile loads. */
  phone: string | null;
  bioEnabled: boolean;
}>;

/**
 * "This device" and "Signing in with" (HANDOFF §16).
 *
 * Both are statements, not controls. What the borrower can act on lives lower
 * down as Lock and Sign out, kept deliberately apart from these.
 */
export function DeviceRows({ phone, bioEnabled }: Props) {
  return (
    <Card>
      <Row label="This device" value={phone ?? '—'} divider />
      <Row
        label="Signing in with"
        value={bioEnabled ? `${biometric.noun} and PIN` : 'PIN'}
      />
    </Card>
  );
}
