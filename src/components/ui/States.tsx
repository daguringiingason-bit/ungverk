import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import { Button } from './Button';

export function LoadingState({ label = 'Hleð...' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.muted}>{body}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.error} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry ? <Button label="Reyna aftur" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

/** Inline form error banner. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl },
  box: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  title: { ...typography.heading, color: colors.ink, textAlign: 'center' },
  muted: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  error: { ...typography.body, color: colors.ink, textAlign: 'center' },
  banner: { backgroundColor: colors.dangerSoft, borderRadius: 12, padding: spacing.lg },
  bannerText: { ...typography.body, color: colors.danger },
});
