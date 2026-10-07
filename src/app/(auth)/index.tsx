import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, Wordmark } from '@/components/ui';
import { setPendingRole } from '@/lib/auth/pendingRole';
import type { SelfServiceRole } from '@/lib/profiles/api';
import { colors, radius, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  const choose = (role: SelfServiceRole) => {
    setPendingRole(role);
    router.push('/sign-in');
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Wordmark size={40} />
        <Text style={styles.title}>Velkomin í ungVERK</Text>
        <Text style={styles.tagline}>Ungt fólk. Alvöru verkefni.</Text>
      </View>

      <View style={styles.choices}>
        <RoleCard
          title="Ég þarf aðstoð"
          body="Fáðu ungt fólk í nágrenninu til að slá garðinn, moka snjó eða viðra hundinn."
          onPress={() => choose('CUSTOMER')}
        />
        <RoleCard
          title="Ég vil vinna"
          body="Finndu verkefni nálægt þér, aflaðu þér pening og byggðu upp reynslu."
          onPress={() => choose('WORKER')}
          emphasis
        />
      </View>

      <Pressable accessibilityRole="link" onPress={() => router.push('/sign-in')} style={styles.loginLink}>
        <Text style={styles.loginText}>Ertu nú þegar með aðgang? Skrá inn</Text>
      </Pressable>
    </Screen>
  );
}

function RoleCard({
  title,
  body,
  onPress,
  emphasis = false,
}: {
  title: string;
  body: string;
  onPress: () => void;
  emphasis?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={body}
      style={({ pressed }) => [
        styles.card,
        emphasis && styles.cardEmphasis,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text style={[styles.cardTitle, emphasis && styles.onPrimary]}>{title}</Text>
      <Text style={[styles.cardBody, emphasis && styles.onPrimaryMuted]}>{body}</Text>
      <Text style={[styles.arrow, emphasis && styles.onPrimary]}>→</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  title: { ...typography.display, color: colors.ink, marginTop: spacing.lg },
  tagline: { ...typography.heading, color: colors.textMuted, fontWeight: '500' },
  choices: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  cardEmphasis: { backgroundColor: colors.primary, borderColor: colors.primary },
  cardTitle: { ...typography.title, fontSize: 22, color: colors.ink },
  cardBody: { ...typography.body, color: colors.textMuted, paddingRight: spacing.xxl },
  arrow: { ...typography.title, position: 'absolute', right: spacing.xl, top: spacing.xl, color: colors.primary },
  onPrimary: { color: colors.textOnPrimary },
  onPrimaryMuted: { color: colors.textOnPrimaryMuted },
  loginLink: { alignSelf: 'center', paddingVertical: spacing.md, minHeight: 44, justifyContent: 'center' },
  loginText: { ...typography.label, color: colors.primary },
});
