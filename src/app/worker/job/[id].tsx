import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/jobs/StatusBadge';
import { Button, ErrorState, FormError, Input, LoadingState, Screen } from '@/components/ui';
import { toUserMessage } from '@/lib/errors';
import {
  APPLICATION_LABEL,
  applyToJob,
  fetchJobDetails,
  withdrawApplication,
  type JobDetails,
} from '@/lib/jobs/workerApi';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDay, formatDuration, formatIsk, formatTimeRange } from '@/utils/formatting';

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    fetchJobDetails(id).then(
      (row) => {
        if (cancelled) return;
        if (row) setJob(row);
        else setLoadError('Þetta verkefni er ekki lengur í boði fyrir þig.');
      },
      (e: unknown) => {
        if (!cancelled) setLoadError(toUserMessage(e, 'job details'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(load, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/worker'));

  const apply = async () => {
    setFormError(null);
    setBusy(true);
    try {
      await applyToJob(id, message.trim());
      setMessage('');
      load(); // show the server's confirmed state, never an optimistic one
    } catch (e) {
      setFormError(toUserMessage(e, 'apply'));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!job?.my_application_id) return;
    setFormError(null);
    setBusy(true);
    try {
      await withdrawApplication(job.my_application_id);
      load();
    } catch (e) {
      setFormError(toUserMessage(e, 'withdraw'));
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <Screen edges={['top']}>
        <Button label="← Til baka" variant="ghost" onPress={back} />
        <ErrorState message={loadError} />
      </Screen>
    );
  }
  if (!job) {
    return (
      <Screen edges={['top']}>
        <LoadingState />
      </Screen>
    );
  }

  const start = new Date(job.starts_at);
  const status = job.my_application_status;

  return (
    <Screen
      scroll
      edges={['top']}
      footer={
        job.can_apply ? (
          <Button label="Sækja um" loadingLabel="Sendi umsókn..." loading={busy} onPress={apply} />
        ) : status === 'PENDING' ? (
          <Button label="Draga umsókn til baka" variant="secondary" loading={busy} loadingLabel="Augnablik..." onPress={withdraw} />
        ) : null
      }
    >
      <Button label="← Til baka" variant="ghost" onPress={back} />

      <View style={styles.header}>
        <Text style={styles.category}>{job.category_name.toUpperCase()}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {job.title}
        </Text>
        <Text style={styles.price}>{formatIsk(job.price_isk)}</Text>
        <Text style={styles.meta}>
          {job.municipality_name} · {job.area_label}
        </Text>
        <Text style={styles.meta}>
          {formatDay(start)} · {formatTimeRange(start, job.duration_minutes)} ({formatDuration(job.duration_minutes)})
        </Text>
      </View>

      {status ? (
        <View style={styles.statusBox}>
          <Text style={styles.sectionLabel}>Umsóknin þín</Text>
          <Text style={styles.statusText}>{APPLICATION_LABEL[status]}</Text>
          {status === 'PENDING' ? (
            <Text style={styles.meta}>{job.customer_first_name} sér umsóknina og velur einhvern úr hópnum.</Text>
          ) : null}
          {job.job_status !== 'OPEN' ? <StatusBadge status={job.job_status} /> : null}
        </View>
      ) : null}

      {job.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VERKEFNIÐ</Text>
          <Text style={styles.body}>{job.description}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ÖRYGGI</Text>
        <Text style={styles.body}>{job.safety_rules}</Text>
        <Text style={styles.meta}>Ef eitthvað er öðruvísi á staðnum máttu alltaf hætta við og láta okkur vita.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>UM VIÐSKIPTAVIN</Text>
        <Text style={styles.body}>
          {job.customer_first_name}
          {job.customer_verified ? '  ✓ Staðfest' : ''}
        </Text>
        <Text style={styles.meta}>Nákvæmt heimilisfang færðu ef þú ert valin(n).</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>GREIÐSLA</Text>
        <Text style={styles.meta}>Viðskiptavinur greiðir þér beint. ungVERK sér ekki um greiðslur enn.</Text>
      </View>

      <FormError message={formError} />

      {job.can_apply ? (
        <Input
          label="Skilaboð (valfrjálst)"
          value={message}
          onChangeText={setMessage}
          placeholder="T.d. Ég get komið kl. 13 og hef reynslu af garðvinnu."
          multiline
          maxLength={300}
          style={styles.multiline}
          editable={!busy}
          hint="Ekki setja inn símanúmer eða heimilisfang."
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  category: { ...typography.meta, color: colors.primary, fontWeight: '700', letterSpacing: 0.5 },
  title: { ...typography.title, color: colors.ink },
  price: { ...typography.display, fontSize: 30, color: colors.ink, marginVertical: spacing.xs },
  meta: { ...typography.meta, color: colors.textMuted },
  section: { gap: spacing.xs },
  sectionLabel: { ...typography.meta, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  body: { ...typography.body, color: colors.ink },
  statusBox: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.lg, gap: spacing.xs },
  statusText: { ...typography.heading, color: colors.ink },
  multiline: { minHeight: 88, paddingTop: spacing.md, textAlignVertical: 'top' },
});
