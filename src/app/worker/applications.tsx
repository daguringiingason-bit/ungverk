import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';

// Stage 4: the worker's own applications and their status.
export default function WorkerApplications() {
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title="Umsóknir" />
      <EmptyState title="Engar umsóknir enn" body="Umsóknirnar þínar og staða þeirra birtast hér." />
    </Screen>
  );
}
