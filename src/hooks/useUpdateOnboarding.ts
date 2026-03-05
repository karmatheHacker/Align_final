import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';

export const useUpdateOnboarding = () => {
    const { user } = useUser();
    const updateUser = useMutation(api.users.updateUser);

    const saveField = async (data: Record<string, any>) => {
        if (!user) return;
        try {
            await updateUser({ clerkId: user.id, ...data });
        } catch (error) {
            console.error('Failed to save onboarding data to Convex:', error);
            throw error;
        }
    };

    return saveField;
};
