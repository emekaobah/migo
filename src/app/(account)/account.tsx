import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, Card, HeaderRow, Row, Screen } from '@/components/ui';
import { DeviceRows } from '@/features/account/device-rows';
import { phone as formatPhone } from '@/lib/format';
import { useAuth } from '@/state/auth-context';
import { useNavOrigin } from '@/state/nav-origin';
import { space, type } from '@/theme';

/**
 * Screen 16 — account (HANDOFF §16).
 *
 * **Locking and signing out are deliberately separated.** Locking is routine
 * and immediate — it just ends the session. Signing out unbinds the phone and
 * needs a USSD code to undo, so it is destructive, sits at the bottom in red,
 * and gets its own confirmation screen. Putting them next to each other as
 * equal-weight rows is how a borrower loses their device binding by accident.
 */
export default function AccountScreen() {
  const router = useRouter();
  const { name, phone, bio, setAuthed } = useAuth();
  const { openHelpFrom, openChatFrom } = useNavOrigin();

  function lock() {
    // Session-only. The device stays bound and the PIN stays set, so the next
    // sign-in is a fingerprint away.
    setAuthed(false);
    router.replace('/(session)/lock');
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />

      <View style={styles.identity}>
        <Avatar name={name ?? ''} size={64} />
        <Text style={styles.name}>{name ?? 'Your account'}</Text>
        <Text style={styles.phone}>{phone ? formatPhone(phone) : '—'}</Text>
      </View>

      <Card>
        <Row
          label="Payout account"
          onPress={() => router.push('/(loan)/banks')}
          chevron
          divider={false}
        />
      </Card>

      <View style={styles.block}>
        <DeviceRows phone={phone ? formatPhone(phone) : null} bioEnabled={bio} />
      </View>

      <View style={styles.block}>
        <Card>
          <Row
            label="Chat with support"
            onPress={() => {
              openChatFrom('/(account)/account');
              router.push('/(support)/chat');
            }}
            chevron
            divider={false}
          />
          <Row
            label="Help & FAQs"
            onPress={() => {
              openHelpFrom('/(account)/account');
              router.push('/(support)/help');
            }}
            chevron
            divider
          />
        </Card>
      </View>

      <View style={styles.actions}>
        <Button label="Lock the app" onPress={lock} variant="outlined" />
        <Button
          label="Sign out of this phone"
          onPress={() => router.push('/(account)/signout')}
          variant="tertiary"
          style={styles.signOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl },
  name: { ...type.h2 },
  phone: { ...type.caption, fontVariant: ['tabular-nums'] },
  block: { marginTop: space.lg },
  // Pushed to the bottom and visually separated from Lock — destructive
  // actions should not sit a thumb-width from routine ones.
  actions: { marginTop: 'auto', paddingTop: space.xxl, gap: space.lg },
  signOut: { marginTop: space.sm },
});
