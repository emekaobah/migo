import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="pinlock"
      title={'Enter your 6-digit PIN'}
      surface="navy"
      next={[
        { label: 'Use biometric', href: '/(session)/lock' },
        { label: 'Signed in', href: '/(session)/loading' },
      ]}
    />
  );
}
