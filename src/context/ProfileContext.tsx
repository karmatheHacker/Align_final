import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-expo';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface ProfileData {
    id?: string;
    clerk_id?: string;
    name?: string;
    birthday?: string;
    gender?: string;
    sexuality?: string;
    pronouns?: string[];
    relationship_type?: string;
    dating_intention?: string;
    distance_preference?: number | string;
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
    onboarding_completed?: boolean;
    firstName?: string;
    height?: { value: number; unit: string } | null;
    [key: string]: any;
}

export interface ProfilePhoto {
    id: string;
    clerk_id: string;
    photo_url: string;
    position: number;
}

export interface ProfilePrompt {
    id: string;
    clerk_id: string;
    prompt_question: string;
    prompt_answer: string;
}

export interface FieldVisibility {
    id: string;
    clerk_id: string;
    field_name: string;
    visibility: 'visible' | 'hidden' | 'always_visible';
}

export interface APBalance {
    balance: number;
    lifetime_earned: number;
    lifetime_spent: number;
    weekly_earned: number;
    last_week_reset: string;
}

export interface QueueItem {
    sender_clerk_id: string;
    total_ap: number;
    last_interaction: string;
    is_like: boolean;
}

export interface SubscriptionData {
    id: string;
    clerk_id: string;
    tier: 'free' | 'mini' | 'max';
    status: 'active' | 'expired' | 'cancelled' | 'past_due';
    expiry_date?: string;
}

export interface VoiceProfile {
    id: string;
    clerk_id: string;
    audio_url: string;
    duration_seconds: number;
    transcription?: string;
}

interface ProfileContextType {
    profile: ProfileData | null;
    photos: ProfilePhoto[];
    prompts: ProfilePrompt[];
    visibility: FieldVisibility[];
    isLoading: boolean;
    loadProfile: (userId: string) => Promise<ProfileData | null>;
    loadFullProfile: (userId: string) => Promise<void>;
    setProfile: (profile: ProfileData | null) => void;
    updateProfileField: (userId: string, field: string, value: any) => Promise<boolean>;
    addPhoto: (userId: string, photoUrl: string, orderIndex: number) => Promise<boolean>;
    removePhoto: (userId: string, photoId: string) => Promise<boolean>;
    reorderPhotos: (userId: string, photoIds: string[]) => Promise<boolean>;
    addPrompt: (userId: string, question: string, answer: string) => Promise<ProfilePrompt | null>;
    updatePrompt: (userId: string, promptId: string, question: string, answer: string) => Promise<boolean>;
    removePrompt: (userId: string, promptId: string) => Promise<boolean>;
    setFieldVisibility: (userId: string, fieldName: string, vis: 'visible' | 'hidden' | 'always_visible') => Promise<boolean>;
    getFieldVisibility: (fieldName: string) => 'visible' | 'hidden' | 'always_visible';

    apBalance: APBalance | null;
    priorityQueue: QueueItem[];
    sendAlignPoints: (receiverId: string, amount: number) => Promise<{ success: boolean, new_balance?: number, error?: string }>;
    swipeRight: (receiverId: string) => Promise<{ success: boolean, is_match?: boolean, error?: string }>;

    discoveryFeed: any[];
    aiMatches: any[];
    fetchDiscoveryFeed: () => Promise<void>;
    fetchAIMMatches: () => Promise<void>;
    markAIMShown: (aimId: string) => Promise<boolean>;

    subscription: SubscriptionData | null;
    fetchSubscription: () => Promise<void>;
    purchaseAP: (amount: number, ap_amount: number, razorpay_id: string) => Promise<boolean>;
    upgradeSubscription: (tier: 'mini' | 'max', razorpay_id: string) => Promise<boolean>;

    voiceProfile: VoiceProfile | null;
    fetchVoiceProfile: (userId: string) => Promise<VoiceProfile | null>;
    uploadVoiceProfile: (audioUri: string, durationSeconds: number) => Promise<boolean>;

    fetchPersonalityVector: (userId: string) => Promise<any>;
    fetchCompatibilityPredictions: (userId: string) => Promise<any[]>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [prompts, setPrompts] = useState<ProfilePrompt[]>([]);
    const [visibility, setVisibility] = useState<FieldVisibility[]>([]);
    const [apBalance, setApBalance] = useState<APBalance | null>({ balance: 3, lifetime_earned: 3, lifetime_spent: 0, weekly_earned: 3, last_week_reset: new Date().toISOString() });
    const [priorityQueue] = useState<QueueItem[]>([]);
    const [discoveryFeed] = useState<any[]>([]);
    const [aiMatches] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<SubscriptionData | null>({ id: 'free-tier', clerk_id: 'local', tier: 'free', status: 'active' });
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
    const [isLoading] = useState(false);

    const { user } = useUser();
    const updateUser = useMutation(api.users.updateUser);

    // Convex calls for photos
    const convexPhotos = useQuery(api.files.getUserPhotos) || [];
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveProfilePhotoMutation = useMutation(api.files.saveProfilePhoto);
    const deletePhotoMutation = useMutation(api.files.deletePhoto);

    // photo_urls is handled below by fetching actual Photo table records
    const photos: ProfilePhoto[] = convexPhotos.map(p => ({
        id: p._id,
        clerk_id: p.clerkId,
        photo_url: p.url,
        position: p.position
    }));

    const convexUser = useQuery(api.users.getCurrentUser);

    // Reactive sync between Convex and local context
    useEffect(() => {
        if (convexUser) {
            setProfile({
                ...convexUser,
                id: convexUser._id,
                clerk_id: convexUser.clerkId,
                name: convexUser.firstName || convexUser.name,
                // map legacy fields if necessary
                bio: convexUser.publicBio,
                dating_intention: convexUser.datingIntention,
                relationship_type: convexUser.relationshipType,
                distance_preference: convexUser.distancePreference,
            });
        }
    }, [convexUser]);

    const loadProfile = useCallback(async (_userId: string): Promise<ProfileData | null> => {
        return profile;
    }, [profile]);

    const loadFullProfile = useCallback(async (_userId: string): Promise<void> => {
        // No-op: data is held in local state
    }, []);

    const updateProfileField = useCallback(async (_userId: string, field: string, value: any): Promise<boolean> => {
        try {
            if (user) {
                // Determine mapped key before sending to Convex
                let mappedField = field;
                if (field === 'hometown') mappedField = 'hometown';
                else if (field === 'dating_intention') mappedField = 'datingIntention';
                else if (field === 'relationship_type') mappedField = 'relationshipType';
                else if (field === 'distance_preference') mappedField = 'distancePreference';
                else if (field === 'bio') mappedField = 'publicBio';

                // Pass to convex mutation
                await updateUser({ clerkId: user.id, [mappedField]: value });
            }
            // Retain local context update for sync
            setProfile(prev => prev ? { ...prev, [field]: value } : { [field]: value });
            return true;
        } catch (e) {
            console.error("Failed to update user in Convex:", e);
            return false;
        }
    }, [user, updateUser]);

    const addPhoto = useCallback(async (_userId: string, photoUrl: string, orderIndex: number): Promise<boolean> => {
        try {
            console.log(`[files] Step 1: Getting upload URL`);
            const uploadUrl = await generateUploadUrl();
            if (!uploadUrl) throw new Error("Could not generate upload URL");

            console.log(`[files] Step 2: Fetching local photo blob from ${photoUrl}`);
            const response = await fetch(photoUrl);
            const blob = await response.blob();

            console.log(`[files] Step 3: Posting blob to Convex storage ${uploadUrl}`);
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type },
                body: blob,
            });

            if (!result.ok) throw new Error("Upload to storage failed");
            const { storageId } = await result.json();
            console.log(`[files] Step 4: Storage successful. Received storageId: ${storageId}`);

            console.log(`[files] Step 5: Saving photo to database`);
            await saveProfilePhotoMutation({ storageId, position: orderIndex });
            console.log(`[files] Success: Photo uploaded completely in position ${orderIndex}`);

            return true;
        } catch (err) {
            console.error("Failed to upload photo to Convex:", err);
            return false;
        }
    }, [generateUploadUrl, saveProfilePhotoMutation]);

    const removePhoto = useCallback(async (_userId: string, photoId: string): Promise<boolean> => {
        try {
            await deletePhotoMutation({ photoId: photoId as Id<"photos"> });
            return true;
        } catch (err) {
            console.error("Failed to delete photo from Convex:", err);
            return false;
        }
    }, [deletePhotoMutation]);

    const reorderPhotos = useCallback(async (_userId: string, photoIds: string[]): Promise<boolean> => {
        // Mock reorder functionality for now
        console.warn("reorderPhotos not yet bound to Convex");
        return true;
    }, []);

    const addPrompt = useCallback(async (_userId: string, question: string, answer: string): Promise<ProfilePrompt | null> => {
        const newPrompt: ProfilePrompt = {
            id: Date.now().toString(),
            clerk_id: 'local',
            prompt_question: question,
            prompt_answer: answer,
        };
        setPrompts(prev => [...prev, newPrompt]);
        return newPrompt;
    }, []);

    const updatePrompt = useCallback(async (_userId: string, promptId: string, question: string, answer: string): Promise<boolean> => {
        setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, prompt_question: question, prompt_answer: answer } : p));
        return true;
    }, []);

    const removePrompt = useCallback(async (_userId: string, promptId: string): Promise<boolean> => {
        setPrompts(prev => prev.filter(p => p.id !== promptId));
        return true;
    }, []);

    const setFieldVisibility = useCallback(async (_userId: string, fieldName: string, vis: 'visible' | 'hidden' | 'always_visible'): Promise<boolean> => {
        setVisibility(prev => {
            const filtered = prev.filter(v => v.field_name !== fieldName);
            return [...filtered, { id: Date.now().toString(), clerk_id: 'local', field_name: fieldName, visibility: vis }];
        });
        return true;
    }, []);

    const getFieldVisibility = useCallback((fieldName: string): 'visible' | 'hidden' | 'always_visible' => {
        const entry = visibility.find(v => v.field_name === fieldName);
        return entry?.visibility || 'visible';
    }, [visibility]);

    const sendAlignPoints = useCallback(async (_receiverId: string, amount: number) => {
        setApBalance(prev => prev ? { ...prev, balance: Math.max(0, prev.balance - amount), lifetime_spent: prev.lifetime_spent + amount } : null);
        return { success: true, new_balance: (apBalance?.balance ?? 0) - amount };
    }, [apBalance]);

    const swipeRight = useCallback(async (_receiverId: string) => {
        return { success: true, is_match: false };
    }, []);

    const fetchDiscoveryFeed = useCallback(async () => { }, []);
    const fetchAIMMatches = useCallback(async () => { }, []);
    const markAIMShown = useCallback(async (_aimId: string) => true, []);

    const fetchSubscription = useCallback(async () => {
        setSubscription({ id: 'free-tier', clerk_id: 'local', tier: 'free', status: 'active' });
    }, []);

    const purchaseAP = useCallback(async (_amount: number, ap_amount: number, _razorpay_id: string) => {
        setApBalance(prev => prev ? { ...prev, balance: prev.balance + ap_amount, lifetime_earned: prev.lifetime_earned + ap_amount } : null);
        return true;
    }, []);

    const upgradeSubscription = useCallback(async (tier: 'mini' | 'max', _razorpay_id: string) => {
        setSubscription(prev => prev ? { ...prev, tier, status: 'active' } : null);
        return true;
    }, []);

    const fetchVoiceProfile = useCallback(async (_userId: string): Promise<VoiceProfile | null> => {
        return voiceProfile;
    }, [voiceProfile]);

    const uploadVoiceProfile = useCallback(async (_audioUri: string, _durationSeconds: number) => {
        return false;
    }, []);

    const fetchPersonalityVector = useCallback(async (_userId: string) => null, []);
    const fetchCompatibilityPredictions = useCallback(async (_userId: string) => [], []);

    return (
        <ProfileContext.Provider value={{
            profile, photos, prompts, visibility, isLoading, apBalance, priorityQueue,
            discoveryFeed, aiMatches, subscription, voiceProfile,
            loadProfile, loadFullProfile, setProfile,
            updateProfileField,
            addPhoto, removePhoto, reorderPhotos,
            addPrompt, updatePrompt, removePrompt,
            setFieldVisibility, getFieldVisibility,
            sendAlignPoints, swipeRight,
            fetchDiscoveryFeed, fetchAIMMatches, markAIMShown,
            fetchSubscription, purchaseAP, upgradeSubscription,
            fetchVoiceProfile, uploadVoiceProfile,
            fetchPersonalityVector, fetchCompatibilityPredictions
        }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
};
