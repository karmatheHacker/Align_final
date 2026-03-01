import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // Important: Supabase session is handled by Clerk
    }
});

/**
 * Returns a Supabase client authenticated with the given Clerk JWT.
 * Use this for any request that needs to pass RLS checks.
 */
export const getAuthenticatedSupabase = (token: string) =>
    createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: { Authorization: `Bearer ${token}` },
        },
        auth: { persistSession: false },
    });
