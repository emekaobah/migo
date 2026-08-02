import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="help"
      title={'Help'}
      surface="surface"
      next={[
        { label: 'Chat with support', href: '/(support)/chat' },
        { label: 'A FAQ section', href: '/(support)/faq/accessing-migo-loans' },
      ]}
    />
  );
}
