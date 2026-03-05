import { useState, useCallback } from 'react';

// Stub hook — Google OAuth removed (no auth backend)
const useGoogleAuth = () => {
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const signInWithGoogle = useCallback(async (): Promise<boolean> => {
        // No-op: auth has been removed. Caller should handle navigation directly.
        return true;
    }, []);

    return { signInWithGoogle, isLoading, error };
};

export const useWarmUpBrowser = () => {
    // No-op stub — expo-web-browser removed
};

export default useGoogleAuth;
