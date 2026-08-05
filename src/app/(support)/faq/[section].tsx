import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FaqSection } from '@/api/interfaces/faq-source';
import { faqSource } from '@/api/faq';
import { Accordion, Button, HeaderRow, Screen, Spinner } from '@/components/ui';
import { useNavOrigin } from '@/state/nav-origin';
import { space, type } from '@/theme';

/**
 * Screen 19 — one FAQ section (HANDOFF §19).
 *
 * Back always returns to Help, which is a fixed relationship rather than a
 * stored origin: a section is only ever reachable from the index above it. The
 * origin machinery is for Help and Chat, which are reachable from anywhere.
 */
export default function FaqSectionScreen() {
  const { section: key } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const { openChatFrom } = useNavOrigin();

  const [section, setSection] = useState<FaqSection | null>(null);
  const [missing, setMissing] = useState(false);
  /** Lifted so only one answer is open at a time (HANDOFF §19). */
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    faqSource
      .sections()
      .then((all) => {
        if (!active) return;
        const found = all.find((s) => s.key === key) ?? null;
        setSection(found);
        setMissing(found === null);
      })
      .catch(() => {
        if (active) setMissing(true);
      });

    return () => {
      active = false;
    };
  }, [key]);

  function stillStuck() {
    openChatFrom(`/(support)/faq/${key}`);
    router.push('/(support)/chat');
  }

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" title="Help" onBack={() => router.back()} />

      {missing ? (
        <Text style={styles.h1}>We could not find that section</Text>
      ) : (
        <Text style={styles.h1}>{section?.title ?? ' '}</Text>
      )}

      {!section && !missing ? (
        <View style={styles.pending}>
          <Spinner />
        </View>
      ) : null}

      {section ? (
        <Accordion
          items={section.questions.map((item) => ({
            key: item.q,
            question: item.q,
            answer: item.a,
          }))}
          openKey={openKey}
          // Single-open: tapping the open one closes it, anything else replaces it.
          onToggle={(key) => setOpenKey((current) => (current === key ? null : key))}
        />
      ) : null}

      <View style={styles.stuck}>
        <Text style={styles.stuckLabel}>Still stuck?</Text>
        <Button label="Chat with support" onPress={stillStuck} variant="tonal" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.h1, marginTop: space.sm, marginBottom: space.xl },
  pending: { paddingVertical: space.xxl, alignItems: 'center' },
  stuck: { marginTop: 'auto', paddingTop: space.xxl, gap: space.md },
  stuckLabel: { ...type.bodyLarge },
});
