import { StyleSheet, Text, View } from 'react-native';

import type { CustomerJob } from '@/lib/jobs/api';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDay, formatIsk, formatTimeRange } from '@/utils/formatting';
import { StatusBadge } from './StatusBadge';

export function CustomerJobCard({ job }: { job: CustomerJob }) {
  const start = new Date(job.starts_at);
  const awaitingReview = job.status === 'OPEN' && job.requires_approval && !job.approved_at;
  const applicants = job.applications.filter((a) => a.status === 'PENDING').length;
  return (
    <View style={styles.card} accessible accessibilityLabel={`${job.title}, ${formatDay(start)}`}>
      <View style={styles.top}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.price}>{formatIsk(job.price_isk)}</Text>
      </View>
      <Text style={styles.meta}>
        {[job.category?.name, `${job.municipality?.name ?? ''} · ${job.area_label}`].filter(Boolean).join(' · ')}
      </Text>
      <Text style={styles.meta}>
        {formatDay(start)} · {formatTimeRange(start, job.duration_minutes)}
      </Text>
      <View style={styles.bottom}>
        <StatusBadge status={job.status} label={awaitingReview ? 'Í yfirferð hjá ungVERK' : undefined} />
        {job.status === 'OPEN' && !awaitingReview ? (
          <Text style={styles.applicants}>
            {applicants === 0 ? 'Enginn hefur sótt um enn' : applicants === 1 ? '1 umsókn' : `${applicants} umsóknir`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs + 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.heading, color: colors.ink, flex: 1 },
  price: { ...typography.heading, color: colors.ink },
  meta: { ...typography.meta, color: colors.textMuted },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  applicants: { ...typography.label, color: colors.ink },
});
