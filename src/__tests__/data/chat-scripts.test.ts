import { agentReply, opener, type ChatFacts } from '@/data/chat-scripts';

/** A borrower with a live loan. */
const WITH_LOAN: ChatFacts = {
  firstName: 'Tunde',
  authed: true,
  loan: {
    principal: 99_600,
    outstanding: 90_968,
    nextDueAt: new Date('2026-09-04T00:00:00Z'),
  },
  extension: { pct: 0.3, days: 30, payToday: 27_290 },
};

describe('chat openers', () => {
  it('quotes the loan when signed in with one', () => {
    const [system, agent] = opener(WITH_LOAN);

    expect(system.from).toBe('system');
    expect(agent.text).toContain('Tunde');
    expect(agent.text).toContain('₦99,600');
  });

  it('says there is no loan when signed in without one', () => {
    const [, agent] = opener({ ...WITH_LOAN, loan: null, extension: null });
    expect(agent.text).toMatch(/no loan running/i);
  });

  it('asks for the number when signed out', () => {
    const [, agent] = opener({
      firstName: null,
      authed: false,
      loan: null,
      extension: null,
    });

    // The case the product exists for: a borrower stuck before there is a
    // session still reaches a person, and she asks for something they can give.
    expect(agent.text).toMatch(/not signed in/i);
    expect(agent.text).toMatch(/number/i);
  });
});

describe('the extension reply', () => {
  it('quotes the live terms rather than a hard-coded rate', () => {
    const reply = agentReply('Extend my loan', WITH_LOAN);

    // The prototype hard-coded 20%. The figures now come from whatever the API
    // says the terms are, so chat and the `extend` screen cannot disagree.
    expect(reply).toContain('30%');
    expect(reply).toContain('₦27,290');
    expect(reply).toContain('₦90,968');
    expect(reply).toContain('30 days');
    expect(reply).not.toContain('20%');
  });

  it('follows the terms if they change, with no edit here', () => {
    const reply = agentReply('Extend my loan', {
      ...WITH_LOAN,
      extension: { pct: 0.25, days: 14, payToday: 22_742 },
    });

    expect(reply).toContain('25%');
    expect(reply).toContain('14 days');
  });

  it('never tells a borrower with a live loan that they have none', () => {
    // The quote is fetched asynchronously, so a borrower can tap Extend while
    // it is still in flight. Collapsing "no terms yet" into "no loan" told them
    // something false and alarming about their own account.
    const reply = agentReply('Extend my loan', { ...WITH_LOAN, extension: null });

    expect(reply).not.toMatch(/no loan running/i);
    expect(reply).toMatch(/I can see your loan/i);
  });

  it('does say there is no loan when there genuinely is none', () => {
    const reply = agentReply('Extend my loan', {
      ...WITH_LOAN,
      loan: null,
      extension: null,
    });

    expect(reply).toMatch(/no loan running/i);
  });
});

describe('scripted replies', () => {
  it('answers every signed-out chip without quoting a code or a PIN', () => {
    for (const label of [
      'My code has not arrived',
      'I changed my phone',
      'Wrong number on my account',
    ]) {
      const reply = agentReply(label, {
        firstName: null,
        authed: false,
        loan: null,
        extension: null,
      });

      expect(reply.length).toBeGreaterThan(0);
      // The agent may say Migo will never ask for a code — she must never ask.
      expect(reply).not.toMatch(/what is your (code|pin)/i);
      expect(reply).not.toMatch(/read me (the|your) (code|pin)/i);
    }
  });

  it('falls back gracefully on a label it does not know', () => {
    expect(agentReply('something unscripted', WITH_LOAN)).toMatch(/come back here/i);
  });
});
