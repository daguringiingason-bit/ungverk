import { Tabs } from 'expo-router';

import { colors, typography } from '@/theme';

export type TabDef = { name: string; title: string };

/** Text-only bottom tabs (no icon dependency yet). */
/** `hidden` routes live inside the tab navigator (keep the tab bar) but get no tab button. */
export function TabsLayout({ tabs, hidden = [] }: { tabs: TabDef[]; hidden?: string[] }) {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64 },
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { ...typography.label, fontSize: 15 },
        tabBarItemStyle: { justifyContent: 'center' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
      {hidden.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
