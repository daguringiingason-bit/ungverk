import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMyProfile, type Profile } from '@/lib/profiles/api';
import { supabase } from '@/lib/supabase/client';

/**
 * loading       – restoring the session from storage
 * signedOut     – no session
 * needsProfile  – signed in, onboarding not finished
 * ready         – signed in with a profile (role comes from the DATABASE, never the client)
 * suspended     – account suspended by the ungVERK team
 * error         – could not load the profile (e.g. offline); user can retry
 */
export type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready' | 'suspended' | 'error';

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  // Profile load result, tagged with the user id it belongs to. If the tag doesn't
  // match the current user, the profile is (re)loading.
  const [loaded, setLoaded] = useState<{ uid: string; profile: Profile | null; failed: boolean } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchMyProfile(userId).then(
      (profile) => {
        if (!cancelled) setLoaded({ uid: userId, profile, failed: false });
      },
      (error: unknown) => {
        if (__DEV__) console.warn('[ungVERK] fetchMyProfile', error);
        if (!cancelled) setLoaded({ uid: userId, profile: null, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  const refreshProfile = useCallback(async () => {
    setLoaded(null);
    setReloadKey((k) => k + 1);
  }, []);

  const setProfile = useCallback(
    (p: Profile) => {
      if (userId) setLoaded({ uid: userId, profile: p, failed: false });
    },
    [userId],
  );

  const current = loaded && loaded.uid === userId ? loaded : null;
  const profile = current?.profile ?? null;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const status: AuthStatus = useMemo(() => {
    if (!sessionLoaded) return 'loading';
    if (!session) return 'signedOut';
    if (!current) return 'loading';
    if (current.failed) return 'error';
    if (!current.profile) return 'needsProfile';
    return current.profile.suspended_at ? 'suspended' : 'ready';
  }, [sessionLoaded, session, current]);

  const value = useMemo(
    () => ({ status, session, profile, refreshProfile, setProfile, signOut }),
    [status, session, profile, refreshProfile, setProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
