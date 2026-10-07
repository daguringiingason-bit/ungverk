// Central palette. Components must use these tokens — never raw hex values.
// Direction: calm Icelandic tones (fjord blue, moss green, warm paper) — trustworthy, not neon.
export const colors = {
  background: '#F6F4EF', // warm paper
  surface: '#FFFFFF',
  surfaceMuted: '#EFECE5',
  border: '#E2DDD3',

  ink: '#111827', // primary text
  textMuted: '#5B6270',
  textOnPrimary: '#FFFFFF',
  textOnPrimaryMuted: '#D6DDF0',

  primary: '#22408F', // fjord blue
  primaryPressed: '#1A3273',
  primarySoft: '#E4E9F6',

  accent: '#3E7C4F', // moss green — success / completed
  accentSoft: '#E2EFE5',

  star: '#D9952B', // ratings

  danger: '#B42318',
  dangerSoft: '#FCEBE9',

  disabled: '#B9BDC6',

  avatarTones: ['#22408F', '#3E7C4F', '#7A5C3E', '#5B4B8A', '#2E6F7E', '#9A4F3D'],
} as const;

export type ColorToken = Exclude<keyof typeof colors, 'avatarTones'>;
