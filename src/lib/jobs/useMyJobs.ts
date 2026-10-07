import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthProvider';
import { toUserMessage } from '@/lib/errors';
import { fetchMyJobs, type CustomerJob } from './api';

/** The customer's own jobs, refreshed whenever the screen comes into focus. */
export function useMyJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<CustomerJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const customerId = profile?.id;

  // Starts a fetch; returns a cancel function (used as the focus-effect cleanup).
  const load = useCallback(() => {
    if (!customerId) return undefined;
    let cancelled = false;
    fetchMyJobs(customerId).then(
      (rows) => {
        if (cancelled) return;
        setJobs(rows);
        setError(null);
      },
      (e: unknown) => {
        if (!cancelled) setError(toUserMessage(e, 'fetchMyJobs'));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  useFocusEffect(load);

  const retry = useCallback(() => {
    setError(null);
    load();
  }, [load]);

  return { jobs, error, retry };
}
