import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FeedJob } from '@/lib/jobs/workerApi';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDay, formatIsk, formatTimeRange } from '@/utils/formatting';

export function FeedJobCard({ job }: { job: FeedJob }) {
  const start = new Date(job.starts_at);
  const open = () => router.push({ pathname: '/worker/job/[id]', params: { id: job.id } });
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${job.title}, ${job.municipality_name} ${job.area_label}, ${formatDay(start)}, ${formatIsk(job.price_isk)}`}
      accessibilityHint="Opnar verkefnið"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.category}>{job.category_name.toUpperCase()}</Text>
      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.meta}>
        {job.municipality_name} · {job.area_label}
      </Text>
      <Text style={styles.meta}>
        {formatDay(start)} · {formatTimeRange(start, job.duration_minutes)}
      </Text>
      <View style={styles.bottom}>
        <Text style={styles.price}>{formatIsk(job.price_isk)}</Text>
        {job.has_applied ? (
          <Text style={styles.applied}>✓ Þú sóttir um</Text>
        ) : (
          <Text style={styles.cta}>Skoða →</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  category: { ...typography.meta, color: colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  title: { ...typography.heading, color: colors.ink },
  meta: { ...typography.meta, color: colors.textMuted },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  price: { ...typography.title, fontSize: 22, color: colors.ink },
  cta: { ...typography.label, color: colors.primary },
  applied: { ...typography.label, color: colors.accent },
});
