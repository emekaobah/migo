import * as WebBrowser from 'expo-web-browser';

import { color } from '@/theme';

/**
 * Migo's live legal pages (HANDOFF §"External links").
 *
 * These are the **real** URLs, not mocks — they are the one part of this build
 * that talks to Migo's own infrastructure, because terms a borrower agrees to
 * cannot be illustrative.
 */
export const LINKS = {
  terms: 'https://my.migo.money/flow/termsandconditions',
  privacy: 'https://my.migo.money/flow/privacypolicy',
  faq: 'https://my.migo.money/flow/faq',
} as const;

export type LinkName = keyof typeof LINKS;

/**
 * Opens a legal page in an in-app browser.
 *
 * In-app rather than `Linking.openURL` deliberately: sending someone mid-loan
 * out to Chrome or Safari loses the flow behind an app switch, and the terms
 * are read *while* deciding, not instead of deciding.
 *
 * Never throws. A borrower who cannot open the terms should not have the
 * confirm screen fall over — the tap simply does nothing visible, and the CTA
 * stays where it was.
 */
export async function openLink(name: LinkName): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(LINKS[name], {
      toolbarColor: color.navy,
      controlsColor: color.amber,
    });
  } catch {
    // Intentionally silent — see above.
  }
}
