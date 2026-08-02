import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="offers"
      title={'How long do you need it?'}
      surface="surface"
      next={[
        { label: 'Payout account', href: '/(loan)/banks' },
        { label: 'Confirm', href: '/(loan)/confirm' },
      ]}
    />
  );
}
