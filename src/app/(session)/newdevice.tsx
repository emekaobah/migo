import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="newdevice"
      title={"We don't recognise this phone"}
      surface="surface"
      next={[
        { label: "I've authorised it", href: '/(session)/lock' },
        { label: 'Help', href: '/(support)/help' },
      ]}
    />
  );
}
