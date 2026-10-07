import { supabase } from '@/lib/supabase/client';
import type { Enums, Tables } from '@/types/database';

export type Profile = Tables<'profiles'> & { municipality: { name: string } | null };
export type Municipality = Pick<Tables<'municipalities'>, 'id' | 'name' | 'slug'>;
export type PlatformSettings = Tables<'platform_settings'>;
export type UserRole = Enums<'user_role'>;
/** Roles a person may choose themselves. ADMIN is assigned by the team only. */
export type SelfServiceRole = Exclude<UserRole, 'ADMIN'>;

/** The signed-in user's own profile, or null if onboarding isn't finished. RLS limits this to their own row. */
export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, municipality:municipalities(name)')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMunicipalities(): Promise<Municipality[]> {
  const { data, error } = await supabase
    .from('municipalities')
    .select('id, name, slug')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.from('platform_settings').select('*').single();
  if (error) throw error;
  return data;
}

export type OnboardingInput = {
  role: SelfServiceRole;
  firstName: string;
  dateOfBirth: string; // YYYY-MM-DD
  municipalityId: number;
  avatarId?: string;
};

/** Creates the profile. Role and age are validated by the database, not here. */
export async function completeOnboarding(input: OnboardingInput): Promise<Profile> {
  const { data, error } = await supabase.rpc('complete_onboarding', {
    p_role: input.role,
    p_first_name: input.firstName,
    p_date_of_birth: input.dateOfBirth,
    p_municipality_id: input.municipalityId,
    p_avatar_id: input.avatarId ?? 'avatar-01',
  });
  if (error) throw error;
  const profile = await fetchMyProfile(data.id);
  if (!profile) throw new Error('profile_missing_after_onboarding');
  return profile;
}
