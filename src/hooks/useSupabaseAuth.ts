import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../config/supabase';

/**
 * A hook that retrieves the Clerk token using the 'supabase' JWT template,
 * and sets the session on the Supabase client so Supabase requests are
 * authenticated as the current Clerk user.
 */
export const useSupabaseAuth = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const setSupabaseToken = async () => {
        if (!isLoaded) return;

        if (isSignedIn) {
            // Get the JWT from Clerk specifically formatted for Supabase
            const token = await getToken({ template: 'supabase' });

            if (token) {
                // Tell the Supabase client to use this token for future requests
                await supabase.auth.setSession({
                    access_token: token,
                    refresh_token: token, // This shouldn't be used since Clerk handles refresh
                });
            }
        } else {
            // If the user signed out in Clerk, sign them out of Supabase too
            await supabase.auth.signOut();
        }
    };

    return { setSupabaseToken };
};
