import { PageHeader } from '@/components/PageHeader';
import { EmptyState, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';

// Job feed arrives in stage 4 (server-side, age-filtered query). Until then the
// feed is genuinely empty — no fake jobs.
export default function WorkerHome() {
  const { profile } = useAuth();
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title={`Hæ, ${profile?.first_name ?? ''}`} subtitle="Verk nálægt þér" />
      <EmptyState
        title="Engin verkefni nálægt þér eins og er."
        body="Ný verkefni í þínu sveitarfélagi birtast hér um leið og þau eru sett inn."
      />
    </Screen>
  );
}
