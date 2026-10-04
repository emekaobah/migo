import { faqSource } from '@/api/faq';
import { EXTENSION } from '@/api/mock/fixtures';
import { FAQ } from '@/data/faq';

/**
 * The FAQ and its search (PLAN §8a, phase 7).
 *
 * The content is illustrative paraphrase that keeps the published FAQ's
 * structure, so these tests guard two different things: that the structure
 * survives rewording, and that search actually reaches all of it.
 */

describe('the bundled FAQ', () => {
  it('carries all 45 questions across 10 sections, as the handoff specifies', () => {
    expect(FAQ).toHaveLength(10);
    expect(FAQ.reduce((n, section) => n + section.questions.length, 0)).toBe(45);
  });

  it('matches the handoff section breakdown exactly', () => {
    // HANDOFF §19 lists these counts. Paraphrasing rewords answers; it never
    // adds or drops a question, so a changed count is worth noticing.
    expect(FAQ.map((s) => [s.title, s.questions.length])).toEqual([
      ['About Migo', 1],
      ['Accessing Migo loans', 12],
      ['Loan Offers', 9],
      ['Loan Repayment', 8],
      ['Interest & Tenure', 4],
      ['Late Repayment', 1],
      ['Terms and Conditions', 1],
      ['Errors', 5],
      ['Security and Privacy', 2],
      ['Partnership', 2],
    ]);
  });

  it('has a unique, URL-safe key per section — the FAQ route depends on it', () => {
    const keys = FAQ.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    keys.forEach((key) => expect(key).toMatch(/^[a-z0-9-]+$/));
  });

  it('never ships an empty answer', () => {
    FAQ.forEach((section) =>
      section.questions.forEach((item) => {
        expect(item.q.trim()).not.toBe('');
        expect(item.a.length).toBeGreaterThan(0);
        item.a.forEach((paragraph) => expect(paragraph.trim()).not.toBe(''));
      }),
    );
  });
});

describe('the FAQ points borrowers inside the app', () => {
  // Help content outlives the URLs, inboxes and phone lines it names, so
  // answers point to Migo support or the app's own screens instead.
  const text = FAQ.flatMap((s) => s.questions).flatMap((q) => [q.q, ...q.a]);

  it.each([
    ['a web address', /\bwww\.|https?:\/\/|\.(?:money|ng|com)\b/i],
    ['an email address', /\S+@\S+\.\S+/],
    ['a phone number', /\+?\d[\d\s-]{9,}\d/],
  ])('contains no answer with %s', (_, pattern) => {
    expect(text.filter((line) => pattern.test(line))).toEqual([]);
  });
});

/**
 * The FAQ and the extend screen describe one rule, so a borrower reading Help
 * is told the terms they will actually be quoted. The figures come from the
 * same fixture the mock API quotes from, never from this file.
 */
describe('the FAQ on extensions', () => {
  const pct = `${Math.round(EXTENSION.pct * 100)}%`;
  const days = `${EXTENSION.days} days`;

  async function questions() {
    return (await faqSource.sections()).flatMap((s) => s.questions);
  }

  async function answer(question: string): Promise<string> {
    const item = (await questions()).find((q) => q.q === question);
    expect(item).toBeDefined();
    return item!.a.join(' ');
  }

  it.each([
    'How do I extend my loan?',
    'I cannot pay but do not want my offers affected, what do I do?',
  ])('"%s" states the terms the API quotes', async (question) => {
    const text = await answer(question);

    expect(text).toContain(pct);
    expect(text).toContain(days);
  });

  it('never states a different percentage for an extension', async () => {
    const sentences = (await questions())
      .flatMap((q) => q.a)
      .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
      .filter((sentence) => /exten/i.test(sentence));

    // Other answers quote interest and fee percentages; only a percentage in a
    // sentence about extending is an extension term.
    const stated = sentences.flatMap((sentence) => sentence.match(/\d+%/g) ?? []);
    expect(stated.length).toBeGreaterThan(0);
    stated.forEach((figure) => expect(figure).toBe(pct));
  });
});

describe('faq search', () => {
  it('groups matches under their section', async () => {
    // "interest" spans four sections, so this exercises grouping rather than
    // a single-section hit.
    const results = await faqSource.search('interest');

    expect(results.length).toBeGreaterThan(1);
    results.forEach((section) => {
      expect(section.questions.length).toBeGreaterThan(0);
      // Only matching questions survive, not the whole section.
      const source = FAQ.find((s) => s.key === section.key);
      expect(section.questions.length).toBeLessThanOrEqual(source!.questions.length);
    });
  });

  it('searches answers, not just question titles', async () => {
    // A borrower types what they are worried about, which is usually a word
    // from the answer rather than the heading.
    const results = await faqSource.search('default fee');
    expect(results.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', async () => {
    const lower = await faqSource.search('migo');
    const upper = await faqSource.search('MIGO');
    expect(upper.map((s) => s.key)).toEqual(lower.map((s) => s.key));
  });

  it('finds a repayment answer for "wallet", the word the repay screen uses', async () => {
    const results = await faqSource.search('wallet');
    expect(results.map((s) => s.key)).toContain('loan-repayment');
  });

  it('returns nothing for a query that matches nothing', async () => {
    // The screen turns this into "Nothing matches that. Try another word, or
    // start a chat above."
    expect(await faqSource.search('zzzznotathing')).toEqual([]);
  });

  it('returns nothing for an empty or whitespace query', async () => {
    expect(await faqSource.search('')).toEqual([]);
    expect(await faqSource.search('   ')).toEqual([]);
  });

  it('reaches every one of the 45 questions by searching its own title', async () => {
    // The strongest claim available: nothing is stranded behind search.
    for (const section of FAQ) {
      for (const item of section.questions) {
        const results = await faqSource.search(item.q);
        const found = results.some((s) => s.questions.some((q) => q.q === item.q));
        expect(found).toBe(true);
      }
    }
  });
});
