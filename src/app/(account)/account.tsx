import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="account"
      title={'Account'}
      surface="surface"
      next={[
        { label: 'Payout account', href: '/(loan)/banks' },
        { label: 'Chat with support', href: '/(support)/chat' },
        { label: 'Help & FAQs', href: '/(support)/help' },
        { label: 'Sign out', href: '/(account)/signout' },
      ]}
    />
  );
}
