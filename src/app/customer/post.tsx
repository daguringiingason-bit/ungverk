import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';

// NOT IMPLEMENTED YET — the job form is built in stage 3 together with the jobs
// table, categories and age rules. This screen says so honestly instead of
// pretending to post anything.
export default function PostJob() {
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title="Posta verkefni" />
      <EmptyState
        title="Ekki tilbúið enn"
        body="Í lokaðri prófun opnum við fyrir að posta verkefni innan skamms."
      />
    </Screen>
  );
}
