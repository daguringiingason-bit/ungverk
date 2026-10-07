// Worker-side data access. Workers never query the jobs table: every call goes through
// a database function that applies age, municipality and privacy rules.
import { supabase } from '@/lib/supabase/client';
import type { Database, Enums } from '@/types/database';

type Fns = Database['public']['Functions'];
export type FeedJob = Fns['get_job_feed']['Returns'][number];
export type JobDetails = Fns['get_job_details']['Returns'][number];
export type MyApplication = Fns['get_my_applications']['Returns'][number];
export type ApplicationStatus = Enums<'application_status'>;

export const FEED_PAGE_SIZE = 20;

export async function fetchJobFeed(offset = 0): Promise<FeedJob[]> {
  const { data, error } = await supabase.rpc('get_job_feed', { p_limit: FEED_PAGE_SIZE, p_offset: offset });
  if (error) throw error;
  return data;
}

export async function fetchJobDetails(jobId: string): Promise<JobDetails | null> {
  const { data, error } = await supabase.rpc('get_job_details', { p_job_id: jobId });
  if (error) throw error;
  return data[0] ?? null;
}

export async function applyToJob(jobId: string, message: string) {
  const { data, error } = await supabase.rpc('apply_to_job', { p_job_id: jobId, p_message: message });
  if (error) throw error;
  return data;
}

export async function withdrawApplication(applicationId: string) {
  const { data, error } = await supabase.rpc('withdraw_application', { p_application_id: applicationId });
  if (error) throw error;
  return data;
}

export async function fetchMyApplications(): Promise<MyApplication[]> {
  const { data, error } = await supabase.rpc('get_my_applications');
  if (error) throw error;
  return data;
}

export const APPLICATION_LABEL: Record<ApplicationStatus, string> = {
  PENDING: 'Í bið',
  SELECTED: 'Þú varst valin(n)!',
  NOT_SELECTED: 'Annar var valinn',
  WITHDRAWN: 'Dregin til baka',
};
