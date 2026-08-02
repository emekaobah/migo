import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="chat"
      title={'Migo support'}
      surface="navy"
      next={[
        { label: 'Back to help', href: '/(support)/help' },
      ]}
    />
  );
}
