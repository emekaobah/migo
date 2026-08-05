import { View } from 'react-native';

import type { FaqSection } from '@/api/interfaces/faq-source';
import { Card, Row } from '@/components/ui';

type Props = Readonly<{
  sections: FaqSection[];
  onOpen: (section: FaqSection) => void;
}>;

/** The ten section rows: title, question count, chevron (HANDOFF §18). */
export function SectionList({ sections, onOpen }: Props) {
  return (
    <Card>
      {sections.map((section, i) => (
        <View key={section.key}>
          <Row
            label={section.title}
            sub={`${section.questions.length} ${section.questions.length === 1 ? 'question' : 'questions'}`}
            onPress={() => onOpen(section)}
            chevron
            divider={i > 0}
          />
        </View>
      ))}
    </Card>
  );
}
