import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="confirm"
      title={'Confirm the loan'}
      surface="surface"
      next={[
        { label: 'Disbursed', href: '/(loan)/success' },
        { label: 'Change account', href: '/(loan)/banks' },
      ]}
    />
  );
}
