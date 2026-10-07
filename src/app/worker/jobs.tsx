import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';

// Stage 5: the worker's assigned / in-progress / completed jobs.
export default function WorkerJobs() {
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title="Mín verk" />
      <EmptyState title="Engin verk enn" body="Þegar þú ert valin(n) í verkefni birtist það hér." />
    </Screen>
  );
}
