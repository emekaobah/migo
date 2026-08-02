import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/dev/stub-screen';

export default function FaqSectionScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();

  return (
    <StubScreen
      id="faqsection"
      title={section ?? 'FAQ section'}
      surface="surface"
      next={[
        { label: 'Back to help', href: '/(support)/help' },
        { label: 'Still stuck? Chat', href: '/(support)/chat' },
      ]}
    />
  );
}
