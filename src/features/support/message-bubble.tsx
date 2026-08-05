import { StyleSheet, Text, View } from 'react-native';

import type { ChatMessage } from '@/api/interfaces/chat-transport';
import { color, radius, space, type } from '@/theme';

type Props = Readonly<{ message: ChatMessage }>;

/**
 * One chat bubble (HANDOFF §20).
 *
 * The asymmetric corners carry the speaker: agent bubbles are 16/16/16/4 and
 * sit left, the borrower's are 16/16/4/16 and sit right. System lines are
 * centred and unbubbled. Each bubble is one accessibility element so a screen
 * reader announces the message, not its fragments.
 */
export function MessageBubble({ message }: Props) {
  if (message.from === 'system') {
    return (
      <Text style={styles.system} accessible accessibilityLabel={message.text}>
        {message.text}
      </Text>
    );
  }

  const fromAgent = message.from === 'agent';

  return (
    <View
      style={[styles.bubble, fromAgent ? styles.agent : styles.user]}
      accessible
      accessibilityLabel={`${fromAgent ? 'Support' : 'You'}: ${message.text}`}
    >
      <Text style={fromAgent ? styles.agentText : styles.userText}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '86%',
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexShrink: 0,
  },
  agent: {
    alignSelf: 'flex-start',
    backgroundColor: color.card,
    borderBottomLeftRadius: radius.tail,
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: color.navy,
    borderBottomRightRadius: radius.tail,
  },
  agentText: { ...type.body, color: color.text },
  userText: { ...type.body, color: color.card },
  system: { ...type.caption, textAlign: 'center', marginVertical: space.sm },
});
