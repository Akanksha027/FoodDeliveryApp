// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uelxwqpvjdrkxsgotoia.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbHh3cXB2amRya3hzZ290b2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDY4MjMsImV4cCI6MjA5NTEyMjgyM30.uG293Gp8dO8RYap47Pv_EGMyyYjK5iowRC42NY18F6w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Required for web: automatically detects access_token from URL hash after Google OAuth redirect
    detectSessionInUrl: true,
    // Implicit flow for Expo Web — no PKCE code exchange needed
    flowType: 'implicit',
  },
});
