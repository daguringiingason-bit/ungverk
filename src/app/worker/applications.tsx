import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import { APPLICATION_LABEL, fetchMyApplications, type MyApplication } from '@/lib/jobs/workerApi';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDay, formatIsk, formatTimeRange } from '@/utils/formatting';

export default function WorkerApplications() {
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    fetchMyApplications().then(
      (rows) => {
        if (cancelled) return;
        setApps(rows);
        setError(null);
      },
      (e: unknown) => {
        if (!cancelled) setError(toUserMessage(e, 'my applications'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  let body;
  if (error && !apps) body = <ErrorState message={error} onRetry={load} />;
  else if (!apps) body = <LoadingState />;
  else if (apps.length === 0)
    body = <EmptyState title="Engar umsóknir enn" body="Finndu verkefni á forsíðunni og sæktu um." />;
  else
    body = (
      <View style={styles.list}>
        {apps.map((a) => {
          const start = new Date(a.starts_at);
          return (
            <Pressable
              key={a.application_id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/worker/job/[id]', params: { id: a.job_id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.row}>
                <Text style={styles.title}>{a.title}</Text>
                <Text style={styles.price}>{formatIsk(a.price_isk)}</Text>
              </View>
              <Text style={styles.meta}>
                {a.municipality_name} · {a.area_label}
              </Text>
              <Text style={styles.meta}>
                {formatDay(start)} · {formatTimeRange(start, a.duration_minutes)}
              </Text>
              <Text
                style={[
                  styles.status,
                  a.application_status === 'SELECTED' && { color: colors.accent },
                  (a.application_status === 'NOT_SELECTED' || a.application_status === 'WITHDRAWN') && {
                    color: colors.textMuted,
                  },
                ]}
              >
                {APPLICATION_LABEL[a.application_status]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );

  return (
    <Screen scroll edges={['top']}>
      <PageHeader title="Umsóknir" />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.heading, color: colors.ink, flex: 1 },
  price: { ...typography.heading, color: colors.ink },
  meta: { ...typography.meta, color: colors.textMuted },
  status: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
});
