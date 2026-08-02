import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="enrol"
      title={'Sign in'}
      surface="navy"
      next={[
        { label: 'Enrolment code', href: '/(onboarding)/otp' },
        { label: 'Help', href: '/(support)/help' },
      ]}
    />
  );
}
