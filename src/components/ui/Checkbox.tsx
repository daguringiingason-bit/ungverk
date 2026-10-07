import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouch, radius, spacing, typography } from '@/theme';

type Props = { label: string; checked: boolean; onChange: (next: boolean) => void; error?: string };

export function Checkbox({ label, checked, onChange, error }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        style={styles.row}
      >
        <View style={[styles.box, checked && styles.boxChecked, error && !checked ? styles.boxError : null]}>
          {checked ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: minTouch },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  tick: { color: colors.textOnPrimary, fontWeight: '900', fontSize: 16 },
  label: { ...typography.body, color: colors.ink, flex: 1 },
  error: { ...typography.meta, color: colors.danger },
});
