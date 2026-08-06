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

  /**
   * Keyed by the route it answers.
   *
   * If this screen is ever reused for a new `key` rather than remounted, bare
   * state would show the previous section until the fetch resolved. Clearing it
   * at the top of the effect would be a synchronous setState inside an effect;
   * keying sidesteps both, and matches how `help` holds its search results.
   */
  const [loaded, setLoaded] = useState<{ key: string; section: FaqSection | null } | null>(null);
  /** Lifted so only one answer is open at a time (HANDOFF §19). */
  const [opened, setOpened] = useState<{ key: string; question: string } | null>(null);

  const forThisKey = loaded?.key === key ? loaded : null;
  const section = forThisKey?.section ?? null;
  const missing = forThisKey !== null && forThisKey.section === null;
  const openKey = opened?.key === key ? opened.question : null;

  useEffect(() => {
    let active = true;

    faqSource
      .sections()
      .then((all) => {
        if (!active) return;
        setLoaded({ key, section: all.find((s) => s.key === key) ?? null });
      })
      .catch(() => {
        if (active) setLoaded({ key, section: null });
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
          onToggle={(question) =>
            setOpened((current) =>
              current?.key === key && current.question === question ? null : { key, question },
            )
          }
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
