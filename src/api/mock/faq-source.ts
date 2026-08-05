import type { FaqSection, FaqSource } from '../interfaces/faq-source';
import { FAQ } from '@/data/faq';

/**
 * Search across every question, returned grouped by section.
 *
 * Matches the question text **and** its answer paragraphs: a borrower searching
 * "wallet" is looking for the answer that mentions wallets, not for a question
 * with the word in its title. Case-insensitive, and matched on plain substrings
 * rather than a regex built from input — user text compiled into a pattern is
 * both a correctness and a performance trap.
 */
function matches(query: string, section: FaqSection): FaqSection | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const questions = section.questions.filter(
    (item) =>
      item.q.toLowerCase().includes(needle) ||
      item.a.some((paragraph) => paragraph.toLowerCase().includes(needle)),
  );

  return questions.length > 0 ? { ...section, questions } : null;
}

export const mockFaqSource: FaqSource = {
  async sections(): Promise<FaqSection[]> {
    return FAQ;
  },

  async search(query: string): Promise<FaqSection[]> {
    return FAQ.map((section) => matches(query, section)).filter(
      (section): section is FaqSection => section !== null,
    );
  },
};
