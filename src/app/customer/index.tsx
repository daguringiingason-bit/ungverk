import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/PageHeader';
import { CustomerJobList } from '@/components/jobs/CustomerJobList';
import { Button, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useMyJobs } from '@/lib/jobs/useMyJobs';
import { colors, radius, spacing, typography } from '@/theme';

export default function CustomerHome() {
  const { profile } = useAuth();
  const { jobs, error, retry } = useMyJobs();
  return (
    <Screen scroll edges={['top']}>
      <PageHeader title={`Hæ, ${profile?.first_name ?? ''}`} />
      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Vantar þig aðstoð?</Text>
        <Text style={styles.ctaBody}>Settu inn verkefni og ungt fólk í nágrenninu getur sótt um.</Text>
        <Button label="+ Posta nýtt verk" variant="secondary" onPress={() => router.push('/customer/post')} />
      </View>
      <Text style={styles.section} accessibilityRole="header">
        Mín verkefni
      </Text>
      <CustomerJobList jobs={jobs} error={error} onRetry={retry} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  ctaTitle: { ...typography.title, color: colors.textOnPrimary },
  ctaBody: { ...typography.body, color: colors.textOnPrimaryMuted },
  section: { ...typography.heading, color: colors.ink },
});
