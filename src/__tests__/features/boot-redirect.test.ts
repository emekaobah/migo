import { bootRedirect, type BootState } from '@/features/session/boot-redirect';

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

  it('is pure — the same state always gives the same route', () => {
    const state: BootState = { enrolled: true, deviceBound: true };
    expect(bootRedirect(state)).toBe(bootRedirect(state));
  });
});
