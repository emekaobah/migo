import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="lock"
      title={'Welcome back'}
      surface="navy"
      next={[
        { label: 'Use PIN instead', href: '/(session)/pinlock' },
        { label: 'Signed in', href: '/(session)/loading' },
      ]}
    />
  );
}
