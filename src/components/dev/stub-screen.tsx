import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, type Surface } from '@/components/ui';
import { color, space, type } from '@/theme';

type Props = Readonly<{
  /** The screen id from the prototype, e.g. `enrol`. */
  id: string;
  title: string;
  surface: Surface;
  /** Where this screen can go next, so the tree is walkable before it is built. */
  next?: { label: string; href: string }[];
}>;

/**
 * Placeholder for a screen Phases 3–7 will build.
 *
 * Exists so the whole route tree is navigable at the end of Phase 2 — the
 * exit criterion is "all 21 routes navigable", which needs something at each
 * path that can reach its neighbours.
 */
export function StubScreen({ id, title, surface, next = [] }: Props) {
  const onDark = surface === 'navy' || surface === 'ink' || surface === 'success';

  return (
    <Screen surface={surface} scroll>
      <View style={styles.body}>
        <Text style={[styles.id, onDark && styles.onDark]}>{id}</Text>
        <Text style={[type.h1, onDark && styles.onDark]}>{title}</Text>
        <Text style={[type.caption, onDark && styles.onDarkMuted]}>
          Stub — built in a later phase.
        </Text>

        <View style={styles.links}>
          {next.map((link) => (
            <Link key={link.href} href={link.href as never} style={styles.link}>
              <Text style={[type.body, styles.linkLabel, onDark && styles.onDarkLink]}>
                → {link.label}
              </Text>
            </Link>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: space.sm, paddingTop: space.xl },
  id: { ...type.micro, textTransform: 'uppercase', letterSpacing: 1 },
  links: { marginTop: space.xl, gap: space.xs },
  link: { paddingVertical: space.md },
  linkLabel: { color: color.navy, fontWeight: '600' },
  onDark: { color: color.card },
  onDarkMuted: { color: color.card, opacity: 0.6 },
  onDarkLink: { color: color.amber },
});
