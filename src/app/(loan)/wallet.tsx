import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="wallet"
      title={'Transfer to this account'}
      surface="surface"
      next={[
        { label: 'Back to my loan', href: '/(loan)/active' },
      ]}
    />
  );
}
