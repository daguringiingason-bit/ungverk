import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';

// Stage 3–5: the customer's jobs grouped by status, with applicants.
export default function CustomerJobs() {
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title="Mín verkefni" />
      <EmptyState title="Þú ert ekki með nein verkefni enn." />
    </Screen>
  );
}
