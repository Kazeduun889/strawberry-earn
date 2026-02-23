import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://jusnjwrpfgwdxluabvia.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1c25qd3JwZmd3ZHhsdWFidmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjY3NzIsImV4cCI6MjA4NzQ0Mjc3Mn0.jdLH61goGzjxV0zLyjNZuFVHnNuRD-zWf_GP88HAudw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
