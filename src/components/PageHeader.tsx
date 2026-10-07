import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, paddingTop: spacing.sm },
  title: { ...typography.title, color: colors.ink },
  subtitle: { ...typography.heading, color: colors.textMuted, fontWeight: '500' },
});
