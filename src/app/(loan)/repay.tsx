import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="repay"
      title={'Pay your instalment'}
      surface="surface"
      next={[
        { label: 'Get my wallet details', href: '/(loan)/wallet' },
      ]}
    />
  );
}
