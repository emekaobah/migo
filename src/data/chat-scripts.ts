import { fullDate, naira } from '@/lib/format';
import { ENROL_CODE, NEW_DEVICE_CODE } from '@/lib/ussd';

/**
 * The scripted support agent (HANDOFF §20) — a local stand-in for the
 * live-chat provider, not a record of real support conversations.
 *
 * Two scripts, as designed: signed in, where the agent already has loan context
 * and quotes live figures; and signed out, where it asks for the number. Every
 * line is illustrative wording written for this build, and the only specifics
 * it names are the app's own screens and codes, so a reply never points the
 * borrower somewhere the app does not.
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

/**
 * A team, not a named person. A named agent would read like a transcript of a
 * real conversation; this is a script standing in for whoever answers.
 */
export const AGENT_NAME = 'Migo support';

export function opener(facts: ChatFacts): ScriptedMessage[] {
  const first = facts.firstName?.trim().split(/\s+/)[0] ?? '';
  let greeting: string;

  if (facts.authed && facts.loan) {
    const due = facts.loan.nextDueAt ? ` and the payment due ${fullDate(facts.loan.nextDueAt)}` : '';
    greeting = `Hi ${first}, you are through to ${AGENT_NAME}. We can see your ${naira(facts.loan.principal)} loan${due}. What can we help with?`;
  } else if (facts.authed) {
    greeting = `Hi ${first}, you are through to ${AGENT_NAME}. You have no loan running at the moment. What can we help with?`;
  } else {
    greeting = `Hi, you are through to ${AGENT_NAME}. You are not signed in yet, so tell us the number you are trying to use and we will look it up.`;
  }

  return [
    { from: 'system', text: 'Chat started · scripted preview' },
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
  // The codes are the app's own constants, so this reply and the screens that
  // show them cannot drift apart.
  'My code has not arrived': () =>
    `Texts can be slow to land. You can skip the wait: dial ${ENROL_CODE} from the SIM you are signing up with and the code appears on screen. Stay in this chat while you try.`,

  'I changed my phone': () =>
    `That is fine, and you will not need to read anything out to us. On the new phone, dial ${NEW_DEVICE_CODE} from the SIM on your account and check the digits match the ones the app shows. The new phone is then set up.`,

  'Wrong number on my account': () =>
    'We can help change it. It starts with a check that the account is yours, and the steps will appear in this chat. Nobody here will ever ask you for a code or PIN.',

  'Payment not showing': () =>
    'Checking now. Transfers into your wallet are matched automatically, normally within a few minutes. One is still pending, and we will confirm here once it lands, so there is no need to send it again.',

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
      return 'We can see your loan, but cannot pull up the exact extension figures right now. Open Extend on your loan screen and it will show you what you would pay today.';
    }

    const pct = Math.round(facts.extension.pct * 100);
    return `On this loan you would pay ${naira(facts.extension.payToday)} today, which is ${pct}% of your ${naira(facts.loan.outstanding)} balance, and the rest carries over ${facts.extension.days} days at the same rate. You can do it yourself under Extend on your loan screen.`;
  },

  'Change my bank': () =>
    'Yes. On Confirm or your account page, tap the payout account to switch it. The new account must be in your own name.',
};

/** The agent's scripted answer to a chip, or a graceful fallback. */
export function agentReply(label: string, facts: ChatFacts): string {
  const reply = REPLIES[label];
  return reply
    ? reply(facts)
    : 'We will look into that and come back here with an answer.';
}
