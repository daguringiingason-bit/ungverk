import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

type Props = { size?: number; inverted?: boolean };

/** "ungVERK" — light lowercase "ung", heavy uppercase "VERK". Exact capitalization matters. */
export function Wordmark({ size = 32, inverted = false }: Props) {
  const color = inverted ? colors.textOnPrimary : colors.ink;
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="ungVERK" style={styles.row}>
      <Text style={[styles.ung, { fontSize: size, color }]}>ung</Text>
      <Text style={[styles.verk, { fontSize: size, color: inverted ? colors.textOnPrimary : colors.primary }]}>
        VERK
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  ung: { fontWeight: '400', letterSpacing: -0.5 },
  verk: { fontWeight: '900', letterSpacing: 0.5 },
});
