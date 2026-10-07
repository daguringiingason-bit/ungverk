import { PageHeader } from '@/components/PageHeader';
import { Button, EmptyState, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';

// Admin tools (jobs, reports, users, suspend, cancel) come in stage 7.
// Admin access is granted only by the team in SQL and enforced by is_admin() in RLS.
export default function AdminHome() {
  const { profile, signOut } = useAuth();
  return (
    <Screen scroll>
      <PageHeader title="Stjórnborð" subtitle={`Innskráð(ur): ${profile?.first_name ?? ''}`} />
      <EmptyState title="Stjórnunartól koma í áfanga 7" body="Skýrslur, notendur og verkefni." />
      <Button label="Skrá út" variant="secondary" onPress={signOut} />
    </Screen>
  );
}
