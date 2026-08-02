import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="extend"
      title={'Extend your loan'}
      surface="surface"
      next={[
        { label: 'Back to my loan', href: '/(loan)/active' },
      ]}
    />
  );
}
