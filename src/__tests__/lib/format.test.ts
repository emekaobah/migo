import {
  accountNumber,
  countdown,
  fullDate,
  grouped,
  instalmentLine,
  naira,
  phone,
  shortDate,
} from '@/lib/format';

describe('naira', () => {
  it('groups thousands', () => {
    expect(naira(199_700)).toBe('₦199,700');
    expect(naira(49_900)).toBe('₦49,900');
  });

  it('handles values below a thousand', () => {
    expect(naira(700)).toBe('₦700');
    expect(naira(0)).toBe('₦0');
  });

  it('groups millions', () => {
    expect(naira(1_234_567)).toBe('₦1,234,567');
  });

  it('rounds to whole Naira rather than showing kobo', () => {
    expect(naira(49_900.4)).toBe('₦49,900');
    expect(naira(49_900.6)).toBe('₦49,901');
  });
});

describe('grouped', () => {
  it('omits the currency mark', () => {
    expect(grouped(199_700)).toBe('199,700');
  });

  it('keeps the sign outside the digits', () => {
    expect(grouped(-1_500)).toBe('-1,500');
  });
});

describe('instalmentLine', () => {
  it('uses the multiplication sign, not the letter x', () => {
    expect(instalmentLine(3, 36_567)).toBe('3 × ₦36,567');
    expect(instalmentLine(3, 36_567)).not.toContain('x');
  });
});

describe('countdown', () => {
  it('pads seconds to two digits so the strip does not reflow', () => {
    expect(countdown(47)).toBe('0:47');
    expect(countdown(9)).toBe('0:09');
    expect(countdown(0)).toBe('0:00');
  });

  it('rolls into minutes', () => {
    expect(countdown(60)).toBe('1:00');
    expect(countdown(125)).toBe('2:05');
  });

  it('clamps below zero', () => {
    expect(countdown(-5)).toBe('0:00');
  });
});

describe('dates', () => {
  it('formats a short date without the year', () => {
    expect(shortDate(new Date(2026, 8, 12))).toBe('12 Sep');
  });

  it('formats a full date with the year', () => {
    expect(fullDate(new Date(2026, 8, 12))).toBe('12 Sep 2026');
  });

  it('does not zero-pad the day', () => {
    expect(shortDate(new Date(2026, 0, 5))).toBe('5 Jan');
  });
});

describe('phone', () => {
  it('groups ten digits after the country code', () => {
    expect(phone('8031234567')).toBe('+234 803 123 4567');
  });

  it('formats partial entry without trailing space', () => {
    expect(phone('803')).toBe('+234 803');
    expect(phone('')).toBe('+234');
  });

  it('ignores non-digits and extra length', () => {
    expect(phone('803-123-4567')).toBe('+234 803 123 4567');
    expect(phone('80312345678999')).toBe('+234 803 123 4567');
  });
});

describe('accountNumber', () => {
  it('groups in fours', () => {
    expect(accountNumber('0123456789')).toBe('0123 4567 89');
  });
});
