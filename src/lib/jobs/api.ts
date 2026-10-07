import { supabase } from '@/lib/supabase/client';
import type { Enums, Tables } from '@/types/database';

export type JobCategory = Pick<
  Tables<'job_categories'>,
  'id' | 'slug' | 'name' | 'description' | 'safety_rules' | 'minimum_age' | 'maximum_age' | 'requires_manual_approval'
>;
export type JobStatus = Enums<'job_status'>;
export type CustomerJob = Pick<
  Tables<'jobs'>,
  'id' | 'title' | 'price_isk' | 'area_label' | 'starts_at' | 'duration_minutes' | 'status' | 'min_age' | 'requires_approval' | 'approved_at'
> & {
  category: { name: string } | null;
  municipality: { name: string } | null;
  applications: { status: Enums<'application_status'> }[];
};

export async function fetchCategories(): Promise<JobCategory[]> {
  const { data, error } = await supabase
    .from('job_categories')
    .select('id, slug, name, description, safety_rules, minimum_age, maximum_age, requires_manual_approval')
    .eq('active', true)
    .order('sort_order');
  if (error) throw error;
  return data;
}

/** The signed-in customer's own jobs (RLS returns nothing else). */
export async function fetchMyJobs(customerId: string): Promise<CustomerJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      'id, title, price_isk, area_label, starts_at, duration_minutes, status, min_age, requires_approval, approved_at, category:job_categories(name), municipality:municipalities(name), applications:job_applications(status)',
    )
    .eq('customer_id', customerId)
    .order('starts_at', { ascending: true })
    .limit(50);
  if (error) throw error;
  return data;
}

export type CreateJobInput = {
  categoryId: number;
  title: string;
  description: string;
  priceIsk: number;
  municipalityId: number;
  areaLabel: string;
  address: string;
  startsAt: Date;
  durationMinutes: number;
  /** null = no extra requirement beyond the category minimum */
  minAge: number | null;
  safetyConfirmed: boolean;
};

/** All validation (role, ages, hours, safety confirmation) happens in create_job() on the server. */
export async function createJob(input: CreateJobInput) {
  const { data, error } = await supabase.rpc('create_job', {
    p_category_id: input.categoryId,
    p_title: input.title,
    p_description: input.description,
    p_price_isk: input.priceIsk,
    p_municipality_id: input.municipalityId,
    p_area_label: input.areaLabel,
    p_address: input.address,
    p_starts_at: input.startsAt.toISOString(),
    p_duration_minutes: input.durationMinutes,
    p_min_age: input.minAge,
    p_safety_confirmed: input.safetyConfirmed,
  });
  if (error) throw error;
  return data;
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: 'Drög',
  OPEN: 'Opið',
  ASSIGNED: 'Úthlutað',
  IN_PROGRESS: 'Í vinnslu',
  WORKER_COMPLETED: 'Bíður staðfestingar',
  COMPLETED: 'Lokið',
  REVIEWED: 'Lokið',
  CANCELLED: 'Afturkallað',
  DISPUTED: 'Í skoðun',
};
