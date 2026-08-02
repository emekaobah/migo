import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="bind"
      title={"Choose how you'll sign in"}
      surface="surface"
      next={[
        { label: 'Fetching offers', href: '/(session)/loading' },
      ]}
    />
  );
}
