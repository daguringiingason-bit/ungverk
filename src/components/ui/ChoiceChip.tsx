import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, minTouch, radius, spacing, typography } from '@/theme';

type Props = { label: string; selected: boolean; onPress: () => void };

/** Single-select chip (used e.g. for municipalities). */
export function ChoiceChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && { backgroundColor: colors.surfaceMuted },
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: minTouch - 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...typography.label, color: colors.ink },
  labelSelected: { color: colors.textOnPrimary },
});
