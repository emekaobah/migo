import { mockFaqSource } from './mock/faq-source';

import type { FaqSource } from './interfaces/faq-source';

/**
 * The single place the FAQ implementation is named (PLAN §2).
 *
 * Screens import `faqSource` from here and never from `api/mock/`, so swapping
 * the bundled data for the SalesIQ knowledge base is a one-line edit rather
 * than a change to every screen that reads it.
 */
export const faqSource: FaqSource = mockFaqSource;
