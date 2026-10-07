import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, minTouch, radius, spacing, typography } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input({ label, error, hint, style, ...rest }, ref) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs + 2 },
  label: { ...typography.label, color: colors.ink },
  input: {
    ...typography.body,
    minHeight: minTouch + 4,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.meta, color: colors.danger },
  hint: { ...typography.meta, color: colors.textMuted },
});
