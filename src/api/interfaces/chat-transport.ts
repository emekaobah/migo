/**
 * Support chat, behind an interface.
 *
 * Built to the handoff's own bubble spec rather than embedding a vendor UI —
 * for a proposal that is the better outcome anyway, since the chat screen is
 * the thing being proposed.
 *
 * A Mobilisten implementation would need: `registerVisitor()` on sign-in,
 * `unregisterVisitor()` on sign-out, launcher visibility `NEVER`, `minSdk 23`,
 * iOS 13+, and the `maven.zohodl.com` repository. Recorded here so the swap is
 * a known quantity if this is ever commissioned.
 */
export type ChatMessage = {
  id: string;
  from: 'agent' | 'user' | 'system';
  text: string;
  at: Date;
};

export interface ChatTransport {
  history(): Promise<ChatMessage[]>;
  send(text: string): Promise<void>;
  /** Returns an unsubscribe function. */
  subscribe(listener: (message: ChatMessage) => void): () => void;
}
