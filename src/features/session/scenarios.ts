import type { Href } from 'expo-router';

import { api } from '@/api/client';
import { buildSchedule, totalRepayable } from '@/lib/loan-math';
import { ACCOUNTS, BORROWER, TENORS } from '@/api/mock/fixtures';
import { resetMockApi, seedLoan } from '@/api/mock';
import type { Journey } from '@/state/demo-context';

/**
 * Seeds the state a journey starts from, so the walkthrough can begin anywhere.
 *
 * Returns the route to land on. Kept out of the overlay component so the
 * mapping from journey → state → route is readable in one place and testable
 * without rendering anything.
 */

type Seeder = {
  auth: {
    markEnrolled: (phone: string, name: string) => void;
    markDeviceBound: () => void;
    markBioEnrolled: () => void;
    markPinSet: () => void;
    setAuthed: (value: boolean) => void;
    signOut: () => Promise<void>;
  };
  loan: {
    loanLoaded: (loan: Awaited<ReturnType<typeof api.getLoan>>) => void;
    chooseAccount: (accountId: string) => void;
    reset: () => void;
  };
};

export async function seedScenario(journey: Journey, { auth, loan }: Seeder): Promise<Href> {
  // Every journey starts from a known-clean slate; the differences below are
  // additive, so a jump never inherits the previous journey's state.
  await auth.signOut();
  resetMockApi();
  loan.reset();

  switch (journey) {
    case 'first-run':
      return '/(onboarding)/enrol';

    case 'returning':
      enrolAndBind(auth);
      return '/(session)/lock';

    case 'active-loan': {
      enrolAndBind(auth);
      auth.setAuthed(true);
      loan.chooseAccount(ACCOUNTS[0].id);

      const tenor = TENORS[3]; // 90 days, 3 payments
      const principal = 99_600;
      seedLoan({
        id: 'demo-active',
        principal,
        total: totalRepayable(principal, tenor.multiplier),
        tenor,
        schedule: buildSchedule(principal, tenor, new Date()),
        paidCount: 1,
        disbursedTo: ACCOUNTS[0],
        extendedTo: null,
      });
      loan.loanLoaded(await api.getLoan());
      return '/(loan)/active';
    }

    case 'new-phone':
      // Enrolled with Migo, but this handset holds no key the server knows.
      auth.markEnrolled(BORROWER.phone, BORROWER.name);
      return '/(session)/newdevice';
  }
}

function enrolAndBind(auth: Seeder['auth']) {
  auth.markEnrolled(BORROWER.phone, BORROWER.name);
  auth.markDeviceBound();
  auth.markBioEnrolled();
  auth.markPinSet();
}
