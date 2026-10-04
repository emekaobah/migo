import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import type { Bank } from '@/api/types';
import {
  Button,
  Card,
  HeaderRow,
  InlineError,
  Keypad,
  Row,
  Screen,
  Spinner,
} from '@/components/ui';
import { ACCOUNT_REFUSAL } from '@/features/loans/account-refusal';
import { error as errorHaptic, tick } from '@/lib/haptics';
import { color, space, type } from '@/theme';

const ACCOUNT_DIGITS = 10;

/** Where the name lookup has got to for the number on screen. */
type Lookup =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'found'; holder: string }
  | { state: 'unknown' }
  | { state: 'failed' };

/**
 * Screen 9a — adding a payout account: bank, number, then a code to the BVN's
 * phone.
 *
 * The holder's name is looked up as soon as the tenth digit is in and shown
 * for the borrower to check — it is how a mistyped number gets caught. It is
 * not compared with their name: only the BVN has to match, and the server
 * checks that before any code is sent, so a refusal lands here rather than on
 * the code screen.
 *
 * Continue is always enabled, as everywhere else: pressing it early says what
 * is missing.
 */
export default function AddAccountScreen() {
  const router = useRouter();

  const [banks, setBanks] = useState<Bank[] | null>(null);
  const [banksFailed, setBanksFailed] = useState(false);
  const [bank, setBank] = useState<Bank | null>(null);
  const [digits, setDigits] = useState('');
  /** The last lookup answer, with the bank and number it answered for. */
  const [answer, setAnswer] = useState<{ key: string; lookup: Lookup } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);

  useEffect(() => {
    if (banksFailed) return;
    let active = true;
    api
      .listBanks()
      .then((list) => {
        if (active) setBanks(list);
      })
      .catch(() => {
        if (active) setBanksFailed(true);
      });
    return () => {
      active = false;
    };
  }, [banksFailed]);

  // Look the holder up once the number is complete. The answer carries the
  // bank and number it was for, so one that arrives after either has changed
  // is simply not shown — and "checking" is whatever has no answer yet.
  const key = bank && digits.length === ACCOUNT_DIGITS ? `${bank.id}:${digits}` : null;
  const lookup = lookupFor(key, answer);

  useEffect(() => {
    if (!bank || digits.length !== ACCOUNT_DIGITS) return;

    const asked = `${bank.id}:${digits}`;
    let active = true;
    api
      .resolveAccount(bank.id, digits)
      .then((found) => {
        if (!active) return;
        setAnswer({
          key: asked,
          lookup: found ? { state: 'found', holder: found.holder } : { state: 'unknown' },
        });
      })
      .catch(() => {
        if (active) setAnswer({ key: asked, lookup: { state: 'failed' } });
      });
    return () => {
      active = false;
    };
  }, [bank, digits]);

  const append = (digit: string) => {
    if (digits.length >= ACCOUNT_DIGITS) return;
    tick();
    setError(null);
    setDigits((current) => current + digit);
  };

  const backspace = () => {
    tick();
    setError(null);
    setDigits((current) => current.slice(0, -1));
  };

  const fail = (message: string) => {
    errorHaptic();
    setError(message);
  };

  async function onContinue() {
    if (!bank) return fail('Pick your bank first.');
    if (digits.length < ACCOUNT_DIGITS) return fail('Account numbers have 10 digits.');
    if (lookup.state === 'checking') return fail('Still checking the account. Try again in a moment.');
    // Unknown and failed lookups already say what is wrong, beside the number.
    if (lookup.state !== 'found' || sending.current) return;

    sending.current = true;
    setError(null);
    try {
      const sent = await api.requestAccountCode(bank.id, digits);
      if (!sent.ok) {
        fail(ACCOUNT_REFUSAL[sent.reason]);
        return;
      }
      router.push({
        pathname: '/(loan)/account-code',
        params: {
          bankId: bank.id,
          number: digits,
          maskedPhone: sent.maskedPhone,
          resendIn: String(sent.resendIn),
        },
      });
    } catch {
      fail('We could not send the code. Check your connection and try again.');
    } finally {
      sending.current = false;
    }
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={() => router.back()} />
      <Text style={styles.h1}>Add an account</Text>

      {bank ? (
        <Row label="Bank" value={bank.name} chevron onPress={() => setBank(null)} />
      ) : (
        <View style={styles.list}>
          {banksFailed ? (
            <View style={styles.pending}>
              <InlineError message="We could not load the list of banks. Check your connection." />
              <Button label="Try again" onPress={() => setBanksFailed(false)} variant="tonal" />
            </View>
          ) : null}
          {!banksFailed && banks === null ? (
            <View style={styles.pending}>
              <Spinner />
            </View>
          ) : null}
          {/* A bank is picked and the list folds away, so these are plain
              choices that move on — not radios that stay on screen. */}
          {banks?.map((b) => (
            <Row
              key={b.id}
              label={b.name}
              chevron
              onPress={() => {
                setError(null);
                setBank(b);
              }}
            />
          ))}
        </View>
      )}

      {bank ? (
        <View style={styles.entry}>
          <Text style={styles.label}>Account number</Text>
          <Text style={styles.number} accessibilityLabel={`Account number, ${digits || 'empty'}`}>
            {digits.padEnd(ACCOUNT_DIGITS, '·')}
          </Text>

          <LookupResult lookup={lookup} bankName={bank.name} />

          <Keypad keyHeight={50} onDigit={append} onBackspace={backspace} />
        </View>
      ) : null}

      <View style={styles.footer}>
        {error ? <InlineError message={error} /> : null}
        <Button label="Continue" onPress={onContinue} />
        <Text style={styles.footnote}>
          We will send a code to the phone number registered to this account&apos;s BVN.
        </Text>
      </View>
    </Screen>
  );
}

/** What to show for the number on screen, given the last answer received. */
function lookupFor(key: string | null, answer: { key: string; lookup: Lookup } | null): Lookup {
  if (key === null) return { state: 'idle' };
  if (answer?.key === key) return answer.lookup;
  return { state: 'checking' };
}

function LookupResult({ lookup, bankName }: Readonly<{ lookup: Lookup; bankName: string }>) {
  switch (lookup.state) {
    case 'checking':
      return (
        <View style={styles.checking}>
          <Spinner />
          <Text style={styles.muted}>Checking the account…</Text>
        </View>
      );
    case 'found':
      return (
        <Card tone="white">
          <Text style={styles.muted}>Account name</Text>
          <Text style={styles.holder}>{lookup.holder}</Text>
        </Card>
      );
    case 'unknown':
      return <InlineError message={`${bankName} has no account with that number. Check it and try again.`} />;
    case 'failed':
      return <InlineError message="We could not check that account. Check your connection and try again." />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  h1: { ...type.h1, marginTop: space.sm, marginBottom: space.xl },
  pending: { paddingVertical: space.xxl, alignItems: 'center', gap: space.md },
  list: { gap: space.sm },
  entry: { gap: space.lg, marginTop: space.lg },
  label: { ...type.caption, color: color.textMuted },
  number: { ...type.h1, fontVariant: ['tabular-nums'], letterSpacing: 2 },
  checking: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  muted: { ...type.caption, color: color.textMuted },
  holder: { ...type.bodyLarge, fontWeight: '600', marginTop: space.xs },
  footer: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
  footnote: { ...type.caption, color: color.textMuted, textAlign: 'center' },
});
