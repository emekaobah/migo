import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="otp"
      title={'Enrolment code'}
      surface="surface"
      next={[
        { label: 'Device binding', href: '/(onboarding)/bind' },
        { label: 'Code not arriving', href: '/(onboarding)/ussd' },
      ]}
    />
  );
}
