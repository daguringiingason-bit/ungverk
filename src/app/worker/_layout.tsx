import { TabsLayout } from '@/components/TabsLayout';

export default function WorkerLayout() {
  return (
    <TabsLayout
      tabs={[
        { name: 'index', title: 'Heim' },
        { name: 'jobs', title: 'Verk' },
        { name: 'applications', title: 'Umsóknir' },
        { name: 'profile', title: 'Prófíll' },
      ]}
      hidden={['job/[id]']}
    />
  );
}
