import { StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import type { CustomerJob } from '@/lib/jobs/api';
import { spacing } from '@/theme';
import { CustomerJobCard } from './CustomerJobCard';

type Props = { jobs: CustomerJob[] | null; error: string | null; onRetry: () => void };

export function CustomerJobList({ jobs, error, onRetry }: Props) {
  if (error && !jobs) return <ErrorState message={error} onRetry={onRetry} />;
  if (!jobs) return <LoadingState />;
  if (jobs.length === 0) return <EmptyState title="Þú ert ekki með nein verkefni enn." />;
  return (
    <View style={styles.list}>
      {jobs.map((j) => (
        <CustomerJobCard key={j.id} job={j} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.md } });
