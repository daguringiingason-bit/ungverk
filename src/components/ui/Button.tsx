import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, minTouch, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  /** While true the button is disabled and shows `loadingLabel` — prevents double submits. */
  loading?: boolean;
  loadingLabel?: string;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  loadingLabel,
  accessibilityHint,
}: Props) {
  const inactive = disabled || loading;
  const v = VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={loading && loadingLabel ? loadingLabel : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? v.pressed : v.bg, borderColor: v.border },
        inactive && variant === 'primary' && { backgroundColor: colors.disabled },
        inactive && variant !== 'primary' && { opacity: 0.5 },
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={v.fg} style={styles.spinner} /> : null}
        <Text style={[styles.label, { color: v.fg }]}>{loading && loadingLabel ? loadingLabel : label}</Text>
      </View>
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; pressed: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.textOnPrimary, border: colors.primary },
  secondary: { bg: colors.surface, pressed: colors.surfaceMuted, fg: colors.primary, border: colors.border },
  ghost: { bg: 'transparent', pressed: colors.surfaceMuted, fg: colors.primary, border: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: minTouch + 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginRight: spacing.sm },
  label: { ...typography.button },
});
