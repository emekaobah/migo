import { fullDate, naira } from '@/lib/format';

/**
 * The scripted support agent (HANDOFF §20).
 *
 * Two scripts, as designed: signed in, where the agent already has loan context
 * and quotes live figures; and signed out, where she asks for the number. The
 * wording is the prototype's, with one deliberate departure noted below.
 *
 * These are **templates over facts**, not fixed strings. The prototype hard-
 * coded the extension at 20%; quoting a rate in chat copy is the same mistake
 * as quoting one in a screen, so the figures come from whatever the API says
 * the terms are. That also means chat and the `extend` screen cannot disagree.
 */

/** What the agent is allowed to know. Assembled by the chat screen. */
export type ChatFacts = {
  firstName: string | null;
  authed: boolean;
  loan: {
    principal: number;
    outstanding: number;
    nextDueAt: Date | null;
  } | null;
  /** Live extension terms; null when there is nothing to extend. */
  extension: { pct: number; days: number; payToday: number } | null;
};

export type ScriptedMessage = { from: 'agent' | 'system'; text: string };

/** Migo support, as the prototype names her. */
export const AGENT_NAME = 'Amaka';

export function opener(facts: ChatFacts): ScriptedMessage[] {
  const first = facts.firstName?.trim().split(/\s+/)[0] ?? '';
  let greeting: string;

  if (facts.authed && facts.loan) {
    const due = facts.loan.nextDueAt ? ` and the payment due ${fullDate(facts.loan.nextDueAt)}` : '';
    greeting = `Hi ${first}, ${AGENT_NAME} here. I can see your ${naira(facts.loan.principal)} loan${due}. What can I help with?`;
  } else if (facts.authed) {
    greeting = `Hi ${first}, ${AGENT_NAME} here. You have no loan running at the moment. What can I help with?`;
  } else {
    greeting = `Hi, ${AGENT_NAME} here. You are not signed in yet, so start by telling me the number you are trying to use and I will look it up.`;
  }

  return [
    { from: 'system', text: 'Chat started · Migo support' },
    { from: 'agent', text: greeting },
  ];
}

export type QuickReply = {
  /** Chip text. */
  label: string;
  /** What it sends as the borrower. */
  sends: string;
};

/** Signed out — the borrower cannot get in, so every chip is about access. */
export const SIGNED_OUT_REPLIES: readonly QuickReply[] = [
  {
    label: 'My code has not arrived',
    sends: 'I asked for a code to set up the app and it has not arrived.',
  },
  {
    label: 'I changed my phone',
    sends: 'I have a new phone and cannot get back into my account.',
  },
  {
    label: 'Wrong number on my account',
    sends: 'The number on my Migo account is not one I can use any more.',
  },
] as const;

/** Signed in — the borrower has a loan, so the chips are about the loan. */
export const SIGNED_IN_REPLIES: readonly QuickReply[] = [
  {
    label: 'Payment not showing',
    sends: 'I sent money to the wallet but my balance has not changed.',
  },
  { label: 'Extend my loan', sends: 'I want to extend. How much do I need to pay today?' },
  { label: 'Change my bank', sends: 'Can I change the account my loan is paid into?' },
] as const;

const REPLIES: Record<string, (facts: ChatFacts) => string> = {
  'My code has not arrived': () =>
    'Sorry about that — delivery can lag when the networks are busy. Dial *561# on that SIM and choose Set up app; the code shows on screen straight away. I will stay here while you try.',

  'I changed my phone': () =>
    'No problem, and you do not need me to read you anything. On the new phone, dial *561*9# from your Migo SIM and confirm the four digits the app is showing. That authorises it in about a minute.',

  'Wrong number on my account': () =>
    'I can start that change. For your safety it needs an identity check first, so I will send the steps here — we will never ask for a code or PIN to do it.',

  'Payment not showing': () =>
    'Let me look. Transfers into your wallet match automatically, usually within two minutes. I can see one pending — I will confirm it here as soon as it lands, you do not need to send anything again.',

  // The one reply that quotes money. Figures come from the live extension
  // terms, never a literal — the prototype's hard-coded 20% is exactly what
  // PLAN §5 supersedes, and a rate written here would be a second place to
  // change it and a second chance for chat to contradict the extend screen.
  'Extend my loan': (facts) => {
    // These are two different situations and must not share a reply. Collapsing
    // them told a borrower with a live loan that they had none, purely because
    // the quote had not come back yet — alarming, and false.
    if (!facts.loan) {
      return 'You have no loan running at the moment, so there is nothing to extend. As soon as you take one, Extend appears on your loan screen.';
    }

    if (!facts.extension) {
      return 'I can see your loan, but I cannot pull the exact extension figures this second. Open Extend on your loan screen and it will show you what you would pay today.';
    }

    const pct = Math.round(facts.extension.pct * 100);
    return `On this loan you would pay ${naira(facts.extension.payToday)} today, which is ${pct}% of your ${naira(facts.loan.outstanding)} balance, and the rest carries over ${facts.extension.days} days at the same rate. You can do it yourself under Extend on your loan screen.`;
  },

  'Change my bank': () =>
    'Yes. Open Confirm or your account page and tap the payout account to switch it. It has to be an account in your own name.',
};

/** The agent's scripted answer to a chip, or a graceful fallback. */
export function agentReply(label: string, facts: ChatFacts): string {
  const reply = REPLIES[label];
  return reply
    ? reply(facts)
    : 'Let me check that for you and come back here with an answer.';
}
