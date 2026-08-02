/**
 * The FAQ, behind an interface.
 *
 * Bundled as typed data for now. In production this should come from the
 * SalesIQ knowledge base rather than a static file — the same source as the
 * website FAQ, so the two cannot drift.
 */
export type FaqSection = {
  key: string;
  title: string;
  questions: { q: string; a: string[] }[];
};

export interface FaqSource {
  sections(): Promise<FaqSection[]>;
  /** Grouped matches across every question. */
  search(query: string): Promise<FaqSection[]>;
}
