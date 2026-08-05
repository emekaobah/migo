import type { ChatFacts } from '@/data/chat-scripts';

import { createMockChatTransport } from './mock/chat-transport';

import type { ChatTransport } from './interfaces/chat-transport';

/**
 * The single place the chat implementation is named (PLAN §2).
 *
 * A factory rather than a singleton because the scripted agent needs the loan
 * context to quote live figures, and that context lives in React state. A
 * Mobilisten implementation would ignore `getFacts` and register the visitor
 * instead — the signature is what stays.
 */
export const createChatTransport: (getFacts: () => ChatFacts) => ChatTransport =
  createMockChatTransport;
