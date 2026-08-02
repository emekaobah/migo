import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="banks"
      title={'Where should the money go?'}
      surface="surface"
      next={[
        { label: 'Confirm', href: '/(loan)/confirm' },
      ]}
    />
  );
}
