import { faqSource } from '@/api/faq';
import { FAQ } from '@/data/faq';

/**
 * The FAQ and its search (PLAN §8a, phase 7).
 *
 * The content is client copy reproduced verbatim, so these tests guard two
 * different things: that search actually reaches all of it, and that the copy
 * has not been quietly edited.
 */

describe('the bundled FAQ', () => {
  it('carries all 45 questions across 10 sections, as the handoff specifies', () => {
    expect(FAQ).toHaveLength(10);
    expect(FAQ.reduce((n, section) => n + section.questions.length, 0)).toBe(45);
  });

  it('matches the handoff section breakdown exactly', () => {
    // HANDOFF §19 lists these counts. A section gaining or losing a question
    // means the source changed, which is worth noticing rather than absorbing.
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

  /**
   * **The published FAQ contradicts itself on the extension rule**, and this
   * test pins that rather than hiding it.
   *
   * PLAN §5 closed the handoff's ⚠ conflict on the basis that the FAQ says 30%.
   * One answer does. Another says 20%. Both ship, because verbatim means
   * verbatim — so the `extend` screen, which follows the client-confirmed 30%,
   * disagrees with one FAQ answer on the same device.
   *
   * If this test ever fails, the source copy changed: check whether the client
   * fixed the contradiction before deleting the test.
   */
  it('still contains the unresolved 20% / 30% extension contradiction', () => {
    const everything = FAQ.flatMap((s) => s.questions.flatMap((q) => [q.q, ...q.a])).join(' ');

    expect(everything).toContain('repay at least 30% of your total outstanding balance');
    expect(everything).toContain('partial payment of 20% of the total outstanding amount');
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
