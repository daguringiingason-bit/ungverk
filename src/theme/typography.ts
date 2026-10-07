import type { TextStyle } from 'react-native';

// Readability first: important things (titles, prices, CTAs) are large; metadata is
// small but never tiny.
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  meta: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
} satisfies Record<string, TextStyle>;
