import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

// Defaults point at the ungVERK pilot project so the app runs without a .env file.
// Both values are PUBLIC by design (the publishable key only grants what RLS allows).
// Override them in .env to use another project. Never put a secret/service-role key here.
const DEFAULT_URL = 'https://llmwqlxtgilpvgiqskth.supabase.co';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_9d-DbX5NFq0pDX2KL5f2UA_zlZCWsu5';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;

// Only the publishable key ever lives in the app. All authorization is enforced by
// Postgres RLS, column grants and security-definer functions on the server.
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh tokens only while the app is in the foreground (recommended for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
