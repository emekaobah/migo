import { clear, EMPTY, load, save } from '@/state/persistence';

import { secureStoreMock } from '../setup';

const KEY = 'migo.durable.v1';

/**
 * The durable slice, including what happens to a record written by a different
 * build. Storage outlives the code that wrote it, so `load` has to cope with a
 * record whose shape no longer matches `DurableState`.
 */

describe('load', () => {
  it('returns EMPTY when nothing has been stored', async () => {
    await expect(load()).resolves.toEqual(EMPTY);
  });

  it('round-trips what save wrote', async () => {
    const state = { ...EMPTY, enrolled: true, deviceBound: true, phone: '8031234567' };
    await save(state);

    await expect(load()).resolves.toEqual(state);
  });

  it('widens a record from an older build, filling absent fields from EMPTY', async () => {
    secureStoreMock.seed(KEY, JSON.stringify({ enrolled: true }));

    await expect(load()).resolves.toEqual({ ...EMPTY, enrolled: true });
  });

  it('drops fields the current shape no longer declares', async () => {
    // Exactly the record a build before this one wrote: loan state used to live
    // in the durable slice. Left in place it would flow into React state and be
    // written back on the next save, for the life of the install.
    secureStoreMock.seed(
      KEY,
      JSON.stringify({
        enrolled: true,
        loanTaken: true,
        paidCount: 2,
        extended: true,
        payoutAccountId: 'gt-4412',
      }),
    );

    const loaded = await load();

    expect(loaded).toEqual({ ...EMPTY, enrolled: true });
    expect(Object.keys(loaded).sort()).toEqual(Object.keys(EMPTY).sort());
  });

  it('does not write dropped fields back out', async () => {
    secureStoreMock.seed(KEY, JSON.stringify({ enrolled: true, paidCount: 2 }));

    await save(await load());

    expect(JSON.parse(secureStoreMock.peek(KEY)!)).not.toHaveProperty('paidCount');
  });

  it('starts fresh rather than throwing on a corrupt record', async () => {
    // A crash loop on boot is unrecoverable for a borrower; a fresh start is not.
    secureStoreMock.seed(KEY, '{ not json');

    await expect(load()).resolves.toEqual(EMPTY);
  });
});

describe('clear', () => {
  it('removes the record, so a sign-out does not survive a restart', async () => {
    await save({ ...EMPTY, enrolled: true });
    await clear();

    expect(secureStoreMock.peek(KEY)).toBeNull();
    await expect(load()).resolves.toEqual(EMPTY);
  });
});
