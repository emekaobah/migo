import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="success"
      title={'Sent to your account'}
      surface="success"
      next={[
        { label: 'View my loan', href: '/(loan)/active' },
      ]}
    />
  );
}
