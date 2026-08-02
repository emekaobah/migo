import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="active"
      title={'Your loan'}
      surface="surface"
      next={[
        { label: 'Repay', href: '/(loan)/repay' },
        { label: 'Extend', href: '/(loan)/extend' },
        { label: 'Account', href: '/(account)/account' },
        { label: 'Help & FAQs', href: '/(support)/help' },
      ]}
    />
  );
}
