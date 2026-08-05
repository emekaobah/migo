import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FaqSection } from '@/api/interfaces/faq-source';
import { faqSource } from '@/api/faq';
import { Card, HeaderRow, Row, Screen, Spinner } from '@/components/ui';
import { ChatCard } from '@/features/support/chat-card';
import { FaqSearch } from '@/features/support/faq-search';
import { FaqSectionList } from '@/features/support/faq-section-list';
import { openLink } from '@/lib/links';
import { useNavOrigin } from '@/state/nav-origin';
import { space, type } from '@/theme';

/**
 * Screen 18 — the help index (HANDOFF §18).
 *
 * Back goes to `helpFrom`, the route stored when Help was opened — never
 * inferred from the stack or the current path. That is the convention the
 * handoff attributes four separate defects to getting wrong, and it is what
 * lets Help work identically from `active` and from the signed-out screens
 * (PLAN §3.3).
 */
export default function HelpScreen() {
  const router = useRouter();
  const { helpFrom, clearHelp, openChatFrom } = useNavOrigin();

  const [sections, setSections] = useState<FaqSection[] | null>(null);
  const [query, setQuery] = useState('');
  /**
   * Results carry the query they answer.
   *
   * Storing them bare would mean clearing them in the effect when the field
   * empties — a synchronous setState inside an effect, which cascades renders —
   * and would briefly show the previous query's matches under a new one. Keyed
   * results need neither: a stale set simply does not match.
   */
  const [results, setResults] = useState<{ query: string; sections: FaqSection[] } | null>(null);

  useEffect(() => {
    let active = true;
    faqSource
      .sections()
      .then((all) => {
        if (active) setSections(all);
      })
      .catch(() => {
        if (active) setSections([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const searching = query.trim().length > 0;

  useEffect(() => {
    if (!searching) return;

    let active = true;
    faqSource
      .search(query)
      .then((found) => {
        if (active) setResults({ query, sections: found });
      })
      .catch(() => {
        if (active) setResults({ query, sections: [] });
      });

    return () => {
      active = false;
    };
  }, [query, searching]);

  function goBack() {
    const origin = helpFrom;
    clearHelp();
    // Explicit over `router.back()`: the stored origin is the whole point, and
    // it is right even when Help was reached from a screen that replaced the
    // one below it.
    if (origin) router.replace(origin as Parameters<typeof router.replace>[0]);
    else router.back();
  }

  function openChat() {
    openChatFrom('/(support)/help');
    router.push('/(support)/chat');
  }

  // While a search is in flight for a *different* query, show nothing rather
  // than the previous query's matches.
  const matches = results?.query === query ? results.sections : null;
  const shown = searching ? matches : sections;

  return (
    <Screen surface="surface" scroll>
      <HeaderRow variant="back" onBack={goBack} />
      <Text style={styles.h1}>Help</Text>

      {/* Chat first, above search — someone opening Help is often stuck. */}
      <ChatCard onPress={openChat} />

      <View style={styles.search}>
        <FaqSearch value={query} onChange={setQuery} />
      </View>

      {shown === null ? (
        <View style={styles.pending}>
          <Spinner />
        </View>
      ) : null}

      {shown !== null && searching && shown.length === 0 ? (
        <Text style={styles.empty}>
          Nothing matches that. Try another word, or start a chat above.
        </Text>
      ) : null}

      {shown !== null && shown.length > 0 ? (
        <FaqSectionList
          sections={shown}
          onOpen={(section) => router.push(`/(support)/faq/${section.key}`)}
        />
      ) : null}

      {searching ? null : (
        <View style={styles.legal}>
          <Card>
            <Row label="Terms and conditions" onPress={() => openLink('terms')} chevron divider={false} />
            <Row label="Privacy policy" onPress={() => openLink('privacy')} chevron divider />
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.h1, marginTop: space.sm, marginBottom: space.xl },
  search: { marginVertical: space.xl },
  pending: { paddingVertical: space.xxl, alignItems: 'center' },
  empty: { ...type.body, paddingVertical: space.xl },
  legal: { marginTop: space.xl },
});
