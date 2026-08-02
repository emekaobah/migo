/**
 * Currency and date formatting.
 *
 * Every amount in this product is Naira, and every amount is rendered with
 * tabular numerals (see `theme/typography.ts`) so figures do not jitter as
 * digits change. Amounts are held as whole Naira integers — never floats —
 * because money arithmetic in binary floating point loses kobo.
 */

const NGN = '₦'; // ₦

/** `199700` → `"₦199,700"`. */
export function naira(amount: number): string {
  return `${NGN}${grouped(Math.round(amount))}`;
}

/** `199700` → `"199,700"` — when the sign is rendered separately. */
export function grouped(amount: number): string {
  const negative = amount < 0;
  const digits = Math.abs(Math.round(amount)).toString();
  const withSeparators = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? `-${withSeparators}` : withSeparators;
}

/**
 * `"3 × ₦36,567"` — the per-instalment line on an amount row.
 * Uses the multiplication sign, not the letter x.
 */
export function instalmentLine(count: number, each: number): string {
  return `${count} × ${naira(each)}`;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** `"12 Sep"` — schedule rows, where the year is implied. */
export function shortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** `"12 Sep 2026"` — due dates, where the year matters. */
export function fullDate(date: Date): string {
  return `${shortDate(date)} ${date.getFullYear()}`;
}

/**
 * `0:47` — the OTP resend countdown. Seconds always pad to two digits so the
 * strip does not reflow as the timer ticks down past ten.
 */
export function countdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** `"+234 803 123 4567"` from ten digits after the country code. */
export function phone(tenDigits: string): string {
  const d = tenDigits.replace(/\D/g, '').slice(0, 10);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean);
  return `+234 ${parts.join(' ')}`.trimEnd();
}

/** `"0123456789"` → `"0123 4567 89"` for the wallet account number. */
export function accountNumber(digits: string): string {
  return (digits.match(/.{1,4}/g) ?? []).join(' ');
}
