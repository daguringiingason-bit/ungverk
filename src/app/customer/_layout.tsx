import { TabsLayout } from '@/components/TabsLayout';

export default function CustomerLayout() {
  return (
    <TabsLayout
      tabs={[
        { name: 'index', title: 'Heim' },
        { name: 'my-jobs', title: 'Mín verk' },
        { name: 'post', title: 'Posta' },
        { name: 'profile', title: 'Prófíll' },
      ]}
    />
  );
}
