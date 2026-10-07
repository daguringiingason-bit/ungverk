import { StyleSheet, Text, View } from 'react-native';

import { STATUS_LABEL, type JobStatus } from '@/lib/jobs/api';
import { colors, radius, spacing, typography } from '@/theme';

const TONE: Record<JobStatus, { bg: string; fg: string }> = {
  DRAFT: { bg: colors.surfaceMuted, fg: colors.textMuted },
  OPEN: { bg: colors.primarySoft, fg: colors.primary },
  ASSIGNED: { bg: colors.primarySoft, fg: colors.primary },
  IN_PROGRESS: { bg: colors.primarySoft, fg: colors.primary },
  WORKER_COMPLETED: { bg: colors.accentSoft, fg: colors.accent },
  COMPLETED: { bg: colors.accentSoft, fg: colors.accent },
  REVIEWED: { bg: colors.accentSoft, fg: colors.accent },
  CANCELLED: { bg: colors.surfaceMuted, fg: colors.textMuted },
  DISPUTED: { bg: colors.dangerSoft, fg: colors.danger },
};

export function StatusBadge({ status, label }: { status: JobStatus; label?: string }) {
  const tone = TONE[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.text, { color: tone.fg }]}>{label ?? STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  text: { ...typography.meta, fontWeight: '700' },
});
