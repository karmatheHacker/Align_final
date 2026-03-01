import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useOAuth } from '@clerk/clerk-expo';

export const useWarmUpBrowser = () => {
    import('react').then((React) => {
        React.useEffect(() => {
            void WebBrowser.warmUpAsync();
            return () => {
                void WebBrowser.coolDownAsync();
            };
        }, []);
    });
};

WebBrowser.maybeCompleteAuthSession();

const useGoogleAuth = () => {
    useWarmUpBrowser();

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signInWithGoogle = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { createdSessionId, setActive } = await startOAuthFlow({
                redirectUrl: Linking.createURL('/dashboard', { scheme: 'align' }),
            });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                setIsLoading(false);
                return true;
            } else {
                setIsLoading(false);
                // Can be the case when user needs to complete MFA, but we omit handling that complexity for now
                return false;
            }
        } catch (err: any) {
            console.error('OAuth error: ', err);
            setIsLoading(false);
            setError(err.message || 'Failed to sign in with Google');
            return false;
        }
    }, [startOAuthFlow]);

    return { signInWithGoogle, isLoading, error };
};

export default useGoogleAuth;
