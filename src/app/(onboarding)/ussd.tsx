import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="ussd"
      title={'Verify with *561#'}
      surface="ink"
      next={[
        { label: 'Back to the code', href: '/(onboarding)/otp' },
      ]}
    />
  );
}
