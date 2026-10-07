import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

// Illustrated avatars are a later design task. For now avatar_id selects a calm
// background tone and we show the person's initial — no real photos of minors.
const TONES = colors.avatarTones;

export function Avatar({ avatarId, name, size = 64 }: { avatarId: string; name: string; size?: number }) {
  const index = Number(avatarId.replace(/\D/g, '')) || 1;
  const bg = TONES[(index - 1) % TONES.length] ?? colors.primary;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.textOnPrimary, fontWeight: '800' },
});
