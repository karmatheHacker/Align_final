import { useState } from 'react';

const useGoogleAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signInWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsLoading(false);
            return true;
        } catch (e) {
            setIsLoading(false);
            setError('Failed to sign in with Google');
            return false;
        }
    };

    return { signInWithGoogle, isLoading, error };
};

export default useGoogleAuth;
