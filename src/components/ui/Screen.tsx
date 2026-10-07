import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  /** Scrollable + keyboard-aware (forms). */
  scroll?: boolean;
  /** Content pinned to the bottom (e.g. primary CTA). */
  footer?: ReactNode;
  /** Tab screens already sit above the tab bar, so they skip the bottom inset. */
  edges?: ('top' | 'bottom')[];
};

export function Screen({ children, scroll = false, footer, edges = ['top', 'bottom'] }: Props) {
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
});
