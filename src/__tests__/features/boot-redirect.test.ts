import { bootRedirect, type BootState } from '@/features/session/boot-redirect';
import { EMPTY, SIGNED_OUT } from '@/state/persistence';

/**
 * All branches (PLAN §8a).
 *
 * Small function, high cost of error: sending a returning borrower back to
 * enrolment means asking for an SMS code, which is the failure this product
 * exists to remove.
 */
describe('bootRedirect', () => {
  const cases: { state: BootState; expected: string; why: string }[] = [
    {
      state: { enrolled: false, deviceBound: false },
      expected: '/(onboarding)/enrol',
      why: 'a fresh install has to enrol',
    },
    {
      state: { enrolled: true, deviceBound: false },
      expected: '/(session)/newdevice',
      why: 'enrolled with Migo, but this handset holds no key',
    },
    {
      state: { enrolled: true, deviceBound: true },
      expected: '/(session)/lock',
      why: 'the returning path — no SMS anywhere on it',
    },
  ];

  it.each(cases)('routes to $expected when $why', ({ state, expected }) => {
    expect(bootRedirect(state)).toBe(expected);
  });

  it('never sends an enrolled borrower back to enrolment', () => {
    // The regression that would matter most, asserted directly rather than
    // implied by the table above.
    for (const deviceBound of [true, false]) {
      expect(bootRedirect({ enrolled: true, deviceBound })).not.toBe('/(onboarding)/enrol');
    }
  });

  it('ignores deviceBound when not enrolled', () => {
    // deviceBound: true without enrolled is not a reachable state, but the
    // function must not fall through to a signed-in route if it ever occurs.
    expect(bootRedirect({ enrolled: false, deviceBound: true })).toBe('/(onboarding)/enrol');
  });

  it('sends a signed-out phone to re-authorise, not to enrol', () => {
    // Sign-out promises "dial *561*9# to authorise it". Enrolment would ask for
    // an SMS code instead — and the in-session route after signing out is
    // `newdevice`, so a cold start has to agree with it.
    expect(bootRedirect(SIGNED_OUT)).toBe('/(session)/newdevice');
  });

  it('sends a fresh install to enrol', () => {
    expect(bootRedirect(EMPTY)).toBe('/(onboarding)/enrol');
  });

  it('is pure — the same state always gives the same route', () => {
    const state: BootState = { enrolled: true, deviceBound: true };
    expect(bootRedirect(state)).toBe(bootRedirect(state));
  });
});
