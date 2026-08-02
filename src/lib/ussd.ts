import { Linking } from 'react-native';

/**
 * USSD, pre-filled but never dialled.
 *
 * The handoff is explicit on both platforms: the app fills the dialler and the
 * borrower presses call. **No silent dialling** — placing a call on someone's
 * behalf, on a prepaid line, without a press, is not something a lender should
 * do. `tel:` opens the dialler; `telprompt:`/auto-dial is deliberately unused.
 */

/** Migo's enrolment shortcode. */
export const ENROL_CODE = '*561#';
/** Authorising a new handset. */
export const NEW_DEVICE_CODE = '*561*9#';

export function dialerUrl(code: string): string {
  // The # must survive into the dialler, so it is percent-encoded.
  return `tel:${encodeURIComponent(code)}`;
}

/**
 * Opens the dialler with the code filled in. Returns false when the platform
 * cannot handle `tel:` — a tablet, or a simulator — so the caller can show the
 * code for manual entry rather than failing silently.
 */
export async function openDialer(code: string): Promise<boolean> {
  const url = dialerUrl(code);
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
