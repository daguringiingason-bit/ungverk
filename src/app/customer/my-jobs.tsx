import { PageHeader } from '@/components/PageHeader';
import { CustomerJobList } from '@/components/jobs/CustomerJobList';
import { Screen } from '@/components/ui';
import { useMyJobs } from '@/lib/jobs/useMyJobs';

export default function CustomerJobs() {
  const { jobs, error, retry } = useMyJobs();
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title="Mín verkefni" />
      <CustomerJobList jobs={jobs} error={error} onRetry={retry} />
    </Screen>
  );
}
