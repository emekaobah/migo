import { agentReply, opener, type ChatFacts } from '@/data/chat-scripts';

import type { ChatMessage, ChatTransport } from '../interfaces/chat-transport';
import { delay } from './delay';
import { LATENCY } from './fixtures';

/**
 * The scripted agent, behind `ChatTransport`.
 *
 * Holds the conversation in memory for the life of the session: the handoff's
 * chat has no history to restore, and inventing persistence would model a
 * SalesIQ behaviour nobody has specified.
 *
 * `send` resolves once the borrower's own message is recorded; the agent's
 * reply arrives later through `subscribe`, after the typing indicator. That
 * split is deliberate — a `send` that resolved with the reply would make the
 * screen unable to show typing at all.
 *
 * Facts are read **after** the typing delay, not captured before it. The 1.6s
 * pause is long enough for an in-flight extension quote to land, and the whole
 * reason `getFacts` is a getter rather than a value is to pick that up.
 */
export function createMockChatTransport(getFacts: () => ChatFacts): ChatTransport {
  let log: ChatMessage[] = [];
  const listeners = new Set<(message: ChatMessage) => void>();
  let pending: { cancel: () => void } | null = null;
  let seq = 0;

  // The increment is its own statement. Folding `seq += 1` into the template
  // hid a mutation inside an expression that reads as pure formatting.
  const nextId = () => {
    seq += 1;
    return `msg-${seq}`;
  };

  const push = (message: ChatMessage) => {
    log = [...log, message];
    listeners.forEach((listener) => listener(message));
  };

  return {
    async history(): Promise<ChatMessage[]> {
      if (log.length === 0) {
        log = opener(getFacts()).map((seed) => ({
          id: nextId(),
          from: seed.from,
          text: seed.text,
          at: new Date(),
        }));
      }
      return log;
    },

    async send(text: string): Promise<void> {
      push({ id: nextId(), from: 'user', text, at: new Date() });

      // One reply in flight at a time. Tapping three chips quickly should not
      // produce three overlapping typing indicators and three answers landing
      // together — the last one asked is the one being answered.
      pending?.cancel();

      const typing = delay(LATENCY.agentTyping, null);
      pending = typing;

      void typing.promise
        .then(() => {
          pending = null;
          push({
            id: nextId(),
            from: 'agent',
            text: agentReply(labelFor(text), getFacts()),
            at: new Date(),
          });
        })
        .catch(() => {
          // Cancelled by a newer message; the newer one owns the reply.
        });
    },

    subscribe(listener: (message: ChatMessage) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * Chips send prose, but the script is keyed by chip label. Rather than thread
 * the label through `ChatTransport` — which a real transport would have no
 * concept of — the mock maps the sent text back to its label.
 */
function labelFor(sent: string): string {
  const entry = SENT_TO_LABEL[sent];
  return entry ?? sent;
}

const SENT_TO_LABEL: Record<string, string> = {
  'I asked for a code to set up the app and it has not arrived.': 'My code has not arrived',
  'I have a new phone and cannot get back into my account.': 'I changed my phone',
  'The number on my Migo account is not one I can use any more.': 'Wrong number on my account',
  'I sent money to the wallet but my balance has not changed.': 'Payment not showing',
  'I want to extend. How much do I need to pay today?': 'Extend my loan',
  'Can I change the account my loan is paid into?': 'Change my bank',
};
