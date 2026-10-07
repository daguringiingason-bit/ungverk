import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';
import { colors, radius, spacing, typography } from '@/theme';
import { ageInYears } from '@/utils/age';
import { Avatar } from './Avatar';

/** The signed-in user's own profile (shared by worker and customer tabs). */
export function MyProfile() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  const isWorker = profile.role === 'WORKER';
  const verified = profile.verification_status === 'VERIFIED';

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.card}>
        <Avatar avatarId={profile.avatar_id} name={profile.first_name} size={80} />
        <View style={styles.info}>
          <Text style={styles.name}>{profile.first_name}</Text>
          <Text style={styles.meta}>
            {[isWorker ? `${ageInYears(profile.date_of_birth)} ára` : null, profile.municipality?.name]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {/* Only shown when the real verification process says VERIFIED — never derived from reviews. */}
          {verified ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Staðfest</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Completed jobs + rating are added with reviews (stage 6), computed from real data. */}

      <Text style={styles.note}>
        {isWorker
          ? 'Aðrir sjá fornafn, aldur, sveitarfélag og umsagnir — aldrei fæðingardag, netfang eða heimilisfang.'
          : 'Aðrir sjá fornafn og sveitarfélag — aldrei netfang eða nákvæmt heimilisfang.'}
      </Text>

      <Button label="Skrá út" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  info: { flex: 1, gap: spacing.xs },
  name: { ...typography.title, color: colors.ink },
  meta: { ...typography.meta, color: colors.textMuted },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...typography.meta, color: colors.accent, fontWeight: '700' },
  note: { ...typography.meta, color: colors.textMuted },
});
