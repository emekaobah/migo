import { useEffect, useState } from 'react';

/**
 * Seconds left until a code can be resent, ticking once a second to zero.
 *
 * Shared by the sign-in code and the payout-account code so the two waits
 * behave identically. `restart` starts it again from a new value, as a resend
 * does.
 */
export function useCountdown(initial: number): [remaining: number, restart: (seconds: number) => void] {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  return [remaining, setRemaining];
}
