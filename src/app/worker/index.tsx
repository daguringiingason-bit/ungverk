import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PageHeader } from '@/components/PageHeader';
import { FeedJobCard } from '@/components/jobs/FeedJobCard';
import { Button, EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toUserMessage } from '@/lib/errors';
import { FEED_PAGE_SIZE, fetchJobFeed, type FeedJob } from '@/lib/jobs/workerApi';
import { spacing } from '@/theme';

/**
 * The feed comes from get_job_feed(): the DATABASE decides which jobs this worker may
 * see (age on the job date, category, working hours, municipality). Nothing is filtered here.
 */
export default function WorkerHome() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<FeedJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadFirstPage = useCallback(() => {
    let cancelled = false;
    fetchJobFeed(0).then(
      (rows) => {
        if (cancelled) return;
        setJobs(rows);
        setHasMore(rows.length === FEED_PAGE_SIZE);
        setError(null);
        setRefreshing(false);
      },
      (e: unknown) => {
        if (cancelled) return;
        setError(toUserMessage(e, 'feed'));
        setRefreshing(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(loadFirstPage);

  const refresh = () => {
    setRefreshing(true);
    loadFirstPage();
  };

  const loadMore = async () => {
    if (!jobs) return;
    setLoadingMore(true);
    try {
      const rows = await fetchJobFeed(jobs.length);
      setJobs([...jobs, ...rows.filter((r) => !jobs.some((j) => j.id === r.id))]);
      setHasMore(rows.length === FEED_PAGE_SIZE);
    } catch (e) {
      setError(toUserMessage(e, 'feed more'));
    } finally {
      setLoadingMore(false);
    }
  };

  let body;
  if (error && !jobs) {
    body = (
      <ErrorState
        message={error}
        onRetry={() => {
          setError(null);
          loadFirstPage();
        }}
      />
    );
  } else if (!jobs) {
    body = <LoadingState />;
  } else if (jobs.length === 0) {
    body = (
      <EmptyState
        title="Engin verkefni nálægt þér eins og er."
        body={`Ný verkefni í ${profile?.municipality?.name ?? 'þínu sveitarfélagi'} birtast hér. Dragðu niður til að uppfæra.`}
      />
    );
  } else {
    body = (
      <View style={styles.list}>
        {jobs.map((j) => (
          <FeedJobCard key={j.id} job={j} />
        ))}
        {hasMore ? (
          <Button label="Sýna fleiri" variant="secondary" loading={loadingMore} loadingLabel="Hleð..." onPress={loadMore} />
        ) : null}
      </View>
    );
  }

  return (
    <Screen scroll edges={['top']} onRefresh={refresh} refreshing={refreshing}>
      <PageHeader title={`Hæ, ${profile?.first_name ?? ''}`} subtitle="Verk nálægt þér" />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.md } });
