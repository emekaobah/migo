import { StubScreen } from '@/components/dev/stub-screen';

export default function Screen() {
  return (
    <StubScreen
      id="loading"
      title={'Getting your available offers'}
      surface="navy"
      next={[
        { label: 'Offers', href: '/(loan)/offers' },
        { label: 'Active loan', href: '/(loan)/active' },
      ]}
    />
  );
}
