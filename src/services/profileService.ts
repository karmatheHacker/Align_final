import { getAuthenticatedSupabase } from '../config/supabase';

export interface ProfileData {
    id: string; // Authenticated User ID from Clerk
    name?: string;
    birthday?: string;
    gender?: string;
    sexuality?: string;
    pronouns?: string[];
    relationship_type?: string;
    dating_intention?: string;
    distance_preference?: number;
    hometown?: string;
    education?: string;
    school?: string;
    workplace?: string;
    religion?: string;
    politics?: string;
    children?: string;
    tobacco?: string;
    drinking?: string;
    drugs?: string;
    bio?: string;
    photo_urls?: string[];
    verification_status?: string;

    // Add any additional fields your profiles table might have
    [key: string]: any;
}

/**
 * Saves or updates a user's full profile in the Supabase `profiles` table.
 * 
 * @param profileData - The complete compiled onboarding data. Must include `id`.
 * @param token - The Clerk JWT token to authenticate the request with RLS.
 * @throws Error if the database operation fails.
 */
export const saveUserProfile = async (profileData: ProfileData, token: string): Promise<void> => {
    if (!profileData.id) {
        throw new Error('User ID is required to save profile');
    }

    if (!token) {
        throw new Error('Clerk token is required to authenticate Supabase request');
    }

    const authSupabase = getAuthenticatedSupabase(token);

    const { error } = await authSupabase
        .from('profiles')
        .upsert({
            ...profileData,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'id'
        });

    if (error) {
        console.error('Supabase profile save error:', error);
        throw new Error(`Failed to save profile: ${error.message}`);
    }
};

/**
 * Fetches a user's full profile from the Supabase `profiles` table.
 * 
 * @param id - The Authenticated User ID from Clerk
 * @param token - The Clerk JWT token to authenticate the request with RLS.
 * @returns ProfileData if found, null otherwise.
 */
export const getUserProfile = async (id: string, token: string): Promise<ProfileData | null> => {
    if (!id || !token) {
        return null; // Safe fallback
    }

    const authSupabase = getAuthenticatedSupabase(token);

    const { data, error } = await authSupabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // Row not found
            return null;
        }
        console.error('Supabase profile fetch error:', error);
        return null;
    }

    return data as ProfileData;
};
