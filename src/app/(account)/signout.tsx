import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="signout"
      title={'Sign out of this phone?'}
      surface="surface"
      next={[
        { label: 'Signed out', href: '/(session)/newdevice' },
        { label: 'Stay signed in', href: '/(account)/account' },
      ]}
    />
  );
}
