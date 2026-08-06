import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api } from '@/api/client';
import { createChatTransport } from '@/api/chat';
import type { ChatMessage, ChatTransport } from '@/api/interfaces/chat-transport';
import { Chip, Screen } from '@/components/ui';
import {
  AGENT_NAME,
  SIGNED_IN_REPLIES,
  SIGNED_OUT_REPLIES,
  type ChatFacts,
  type QuickReply,
} from '@/data/chat-scripts';
import { Composer } from '@/features/support/composer';
import { MessageBubble } from '@/features/support/message-bubble';
import { TypingIndicator } from '@/features/support/typing-indicator';
import { nextInstalment, outstandingAfter } from '@/lib/loan-math';
import { useAuth } from '@/state/auth-context';
import { useLoan } from '@/state/loan-context';
import { useNavOrigin } from '@/state/nav-origin';
import { color, control, onNavy, space, type } from '@/theme';

/**
 * Screen 20 — support chat (HANDOFF §20).
 *
 * Reachable while signed out, which is the case that matters most: a borrower
 * stuck at the code step reaches a person without leaving the app. Back returns
 * to `chatFrom`, so the same screen works from `help`, from a FAQ section and
 * from `account` without inspecting the stack.
 */
export default function ChatScreen() {
  const router = useRouter();
  const { authed, name } = useAuth();
  const { loan } = useLoan();
  const { chatFrom, clearChat } = useNavOrigin();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const scroller = useRef<ScrollView>(null);

  /**
   * What the agent is allowed to know, read at send time.
   *
   * A ref rather than a captured value because `ChatTransport` holds the getter
   * for the life of the screen — closing over the first render's loan would
   * have the agent quoting a balance that has since changed.
   */
  const facts = useRef<ChatFacts>({ firstName: name, authed, loan: null, extension: null });

  useEffect(() => {
    const outstanding = loan ? outstandingAfter(loan.schedule, loan.paidCount) : 0;
    const next = loan ? nextInstalment(loan.schedule, loan.paidCount) : null;

    facts.current = {
      firstName: name,
      authed,
      loan: loan
        ? { principal: loan.principal, outstanding, nextDueAt: next?.dueAt ?? null }
        : null,
      extension: facts.current.extension,
    };
  }, [authed, name, loan]);

  // The extension terms the agent quotes come from the API, never a literal.
  useEffect(() => {
    if (!loan) return;
    let active = true;

    api
      .quoteExtension()
      .then((quote) => {
        if (!active || !quote) return;
        facts.current = {
          ...facts.current,
          extension: { pct: quote.pct, days: quote.days, payToday: quote.payToday },
        };
      })
      .catch(() => {
        // The agent falls back to copy that quotes no figures.
      });

    return () => {
      active = false;
    };
  }, [loan]);

  /**
   * Built in an effect, not in render.
   *
   * The transport closes over a getter for `facts.current`, and constructing it
   * during render would be reading a ref while rendering — which React's lint
   * rules flag for good reason: a render-time read cannot make the component
   * update, and here it would silently freeze the agent's view of the loan.
   */
  const transport = useRef<ChatTransport | null>(null);

  useEffect(() => {
    const chat = createChatTransport(() => facts.current);
    transport.current = chat;

    let active = true;

    void chat.history().then((history) => {
      if (active) setMessages(history);
    });

    const unsubscribe = chat.subscribe((message) => {
      if (!active) return;
      setMessages((current) => [...current, message]);
      // The borrower's own message starts the typing indicator; the agent's
      // reply ends it.
      setTyping(message.from === 'user');
    });

    return () => {
      active = false;
      unsubscribe();
      transport.current = null;
    };
  }, []);

  function goBack() {
    const origin = chatFrom;
    clearChat();
    if (origin) router.replace(origin as Parameters<typeof router.replace>[0]);
    else router.back();
  }

  function send(reply: QuickReply) {
    void transport.current?.send(reply.sends);
  }

  const chips = authed ? SIGNED_IN_REPLIES : SIGNED_OUT_REPLIES;

  return (
    <Screen surface="navy" padded={false}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.back}
        >
          <Text style={styles.chevron}>‹</Text>
        </Pressable>

        <View style={styles.agentAvatar}>
          <Text style={styles.agentGlyph}>{AGENT_NAME.charAt(0)}</Text>
        </View>

        <View>
          <Text style={styles.agentName}>{AGENT_NAME}</Text>
          <Text style={styles.agentMeta}>Migo support · replies in ~2 min</Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          ref={scroller}
          style={styles.flex}
          contentContainerStyle={styles.log}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {typing ? <TypingIndicator /> : null}
        </ScrollView>

        <View style={styles.chips}>
          {chips.map((reply) => (
            <Chip key={reply.label} label={reply.label} onPress={() => send(reply)} />
          ))}
        </View>

        <Composer />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    minHeight: control.tap,
  },
  back: {
    minWidth: control.tap,
    minHeight: control.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: { fontSize: 30, color: color.card },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentGlyph: { ...type.bodyLarge, fontWeight: '700', color: color.navy },
  agentName: { ...type.bodyLarge, color: color.card },
  agentMeta: { ...type.caption, color: onNavy.caption },
  // The conversation sits on the light surface; only the header is navy.
  sheet: {
    flex: 1,
    backgroundColor: color.surface,
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
  },
  log: { paddingVertical: space.xl, gap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, flexShrink: 0 },
});
