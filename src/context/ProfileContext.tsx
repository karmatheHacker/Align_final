import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ProfileData } from '../services/profileService';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { getAuthenticatedSupabase } from '../config/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

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

    // Phase 2: AP & Matching Additions
    apBalance: APBalance | null;
    priorityQueue: QueueItem[];
    sendAlignPoints: (receiverId: string, amount: number) => Promise<{ success: boolean, new_balance?: number, error?: string }>;
    swipeRight: (receiverId: string) => Promise<{ success: boolean, is_match?: boolean, error?: string }>;

    // Phase 3: AIM & Discovery Additions
    discoveryFeed: any[];
    aiMatches: any[];
    fetchDiscoveryFeed: () => Promise<void>;
    fetchAIMMatches: () => Promise<void>;
    markAIMShown: (aimId: string) => Promise<boolean>;

    // Phase 5: Monetization & Subscriptions
    subscription: SubscriptionData | null;
    fetchSubscription: () => Promise<void>;
    purchaseAP: (amount: number, ap_amount: number, razorpay_id: string) => Promise<boolean>;
    upgradeSubscription: (tier: 'mini' | 'max', razorpay_id: string) => Promise<boolean>;

    // Phase 7: Voice Profiles
    voiceProfile: VoiceProfile | null;
    fetchVoiceProfile: (userId: string) => Promise<VoiceProfile | null>;
    uploadVoiceProfile: (audioUri: string, durationSeconds: number) => Promise<boolean>;

    // Phase 8: Advanced AI Personality Engine
    fetchPersonalityVector: (userId: string) => Promise<any>;
    fetchCompatibilityPredictions: (userId: string) => Promise<any[]>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const { getToken, isSignedIn } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
    const [prompts, setPrompts] = useState<ProfilePrompt[]>([]);
    const [visibility, setVisibility] = useState<FieldVisibility[]>([]);
    const [apBalance, setApBalance] = useState<APBalance | null>(null);
    const [priorityQueue, setPriorityQueue] = useState<QueueItem[]>([]);
    const [discoveryFeed, setDiscoveryFeed] = useState<any[]>([]);
    const [aiMatches, setAiMatches] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Creates an authenticated client specifically for the currently signed in Clerk user
    const getSupaConfig = async () => {
        const token = await getToken({ template: 'supabase' });
        if (!token) throw new Error('No Supabase Auth Token Formed');
        return getAuthenticatedSupabase(token);
    };

    // Auto Hydrate from Supabase using Clerk User mapping
    const autoHydrateProfile = useCallback(async () => {
        if (!isSignedIn || !user?.id) return;
        setIsLoading(true);
        try {
            const client = await getSupaConfig();

            // Look up profile map in Supabase
            const { data: pData, error: pError } = await client
                .from('profiles')
                .select('*')
                .eq('clerk_id', user.id)
                .single();

            // Create Profile seamlessly if user logged in for the first time
            if (pError && pError.code === 'PGRST116') {
                const newProfile = {
                    id: user.id, // Primary key
                    clerk_id: user.id,
                    name: user.firstName || '',
                    updated_at: new Date().toISOString()
                };

                const { error: insertErr } = await client.from('profiles').insert([newProfile]);
                if (!insertErr) {
                    setProfile(newProfile as any);
                }
            } else if (pData) {
                setProfile(pData as any);

                // Fetch associated data arrays concurrently
                const [photoRes, promptRes, visRes, balanceRes, queueRes, voiceRes] = await Promise.all([
                    client.from('photos').select('*').eq('clerk_id', user.id).order('position', { ascending: true }),
                    client.from('profile_prompts').select('*').eq('clerk_id', user.id),
                    client.from('profile_visibility').select('*').eq('clerk_id', user.id),
                    client.from('alignpoint_balances').select('*').eq('clerk_id', user.id).single(),
                    client.rpc('get_priority_queue'),
                    client.from('voice_profiles').select('*').eq('clerk_id', user.id).single()
                ]);

                if (photoRes.data) setPhotos(photoRes.data as any);
                if (promptRes.data) setPrompts(promptRes.data as any);
                if (visRes.data) setVisibility(visRes.data as any);
                if (voiceRes.data) setVoiceProfile(voiceRes.data as any);

                // Initialize AP Balance if empty
                if (balanceRes.error && balanceRes.error.code === 'PGRST116') {
                    // Give new users 3 initial AP automatically on profile creation for testing
                    // Real earned logic is handled by a weekly cron job.
                    const initialBalance = { clerk_id: user.id, balance: 3, weekly_earned: 3 };
                    await client.from('alignpoint_balances').insert([initialBalance]);
                    setApBalance({ ...initialBalance, lifetime_earned: 0, lifetime_spent: 0, last_week_reset: new Date().toISOString() });
                } else if (balanceRes.data) {
                    setApBalance(balanceRes.data as any);
                }

                if (queueRes.data) {
                    setPriorityQueue(queueRes.data as any);
                }
            }
        } catch (err) {
            console.error('Auto Hydration Phase 1 Failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, user?.id]);

    useEffect(() => {
        autoHydrateProfile();
    }, [autoHydrateProfile]);

    const loadProfile = useCallback(async (userId: string) => {
        // If profile is already hydrated, return it immediately
        if (profile && profile.clerk_id === userId) return profile;

        // Otherwise fetch directly from Supabase
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return null;
            const client = getAuthenticatedSupabase(token);
            const { data } = await client.from('profiles').select('*').eq('clerk_id', userId).single();
            if (data) {
                setProfile(data as any);
                return data;
            }
            return null;
        } catch (err) {
            console.warn('loadProfile fetch error:', err);
            return null;
        }
    }, [profile, getToken]);
    const loadFullProfile = async (userId: string) => { await autoHydrateProfile(); };

    const updateProfileField = useCallback(async (userId: string, field: string, value: any): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();

            // Legacy mapping for compatibility
            let actualField = field;
            let finalValue = value;

            if (field === 'height' && typeof value === 'object') {
                actualField = 'height_value';
                finalValue = value.value;
                await client.from('profiles').update({ height_unit: value.unit }).eq('clerk_id', user.id);
            }

            const { error, data } = await client
                .from('profiles')
                .update({ [actualField]: finalValue, updated_at: new Date().toISOString() })
                .eq('clerk_id', user.id)
                .select()
                .single();

            if (!error && data) {
                setProfile(data as any);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update profile field:', err);
            return false;
        }
    }, [user, getToken]);

    // ── Photos ───────────────────────────────────────────────────────────────
    const addPhoto = useCallback(async (userId: string, photoUrl: string, orderIndex: number): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();

            let finalUrl = photoUrl;

            // 1. Storage Upload (Skip if already an HTTP URL mapped from Onboarding flow)
            if (!photoUrl.startsWith('http')) {
                const base64 = await FileSystem.readAsStringAsync(photoUrl, { encoding: 'base64' });
                const filePath = `${user.id}/${Date.now()}.jpg`;
                const { error: uploadErr } = await client.storage
                    .from('profile_photos')
                    .upload(filePath, decode(base64), { contentType: 'image/jpeg' });

                if (uploadErr) {
                    console.error('Storage Upload Error', uploadErr);
                    return false;
                }

                // Public Link
                const { data: publicUrlData } = client.storage.from('profile_photos').getPublicUrl(filePath);
                finalUrl = publicUrlData.publicUrl;
            }

            // 2. Database Insert
            const { data, error } = await client
                .from('photos')
                .insert({ clerk_id: user.id, photo_url: finalUrl, position: orderIndex })
                .select()
                .single();

            if (!error && data) {
                setPhotos(prev => [...prev, data as any].sort((a, b) => a.position - b.position));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to add photo:', err);
            return false;
        }
    }, [user, getToken]);

    const removePhoto = useCallback(async (userId: string, photoId: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const photoToDelete = photos.find(p => p.id === photoId);

            if (photoToDelete) {
                // Delete from Storage via path splitting if cleanly matched
                const urlParts = photoToDelete.photo_url.split('/');
                const storagePath = `${user.id}/${urlParts[urlParts.length - 1]}`;
                await client.storage.from('profile_photos').remove([storagePath]);
            }

            const { error } = await client.from('photos').delete().eq('id', photoId).eq('clerk_id', user.id);
            if (!error) {
                setPhotos(prev => prev.filter(p => p.id !== photoId));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to remove photo:', err);
            return false;
        }
    }, [user, photos, getToken]);

    const reorderPhotos = useCallback(async (userId: string, photoIds: string[]): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            // Sequential updates
            for (let i = 0; i < photoIds.length; i++) {
                await client.from('photos')
                    .update({ position: i })
                    .eq('id', photoIds[i])
                    .eq('clerk_id', user.id);
            }

            const { data } = await client.from('photos').select('*').eq('clerk_id', user.id).order('position', { ascending: true });
            if (data) setPhotos(data as any);
            return true;
        } catch (err) {
            console.error('Failed to reorder photos:', err);
            return false;
        }
    }, [user, getToken]);

    // ── Prompts ──────────────────────────────────────────────────────────────
    const addPrompt = useCallback(async (userId: string, question: string, answer: string): Promise<ProfilePrompt | null> => {
        if (!user) return null;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('profile_prompts')
                .insert({ clerk_id: user.id, prompt_question: question, prompt_answer: answer })
                .select()
                .single();

            if (!error && data) {
                setPrompts(prev => [...prev, data as any]);
                return data as any;
            }
            return null;
        } catch (err) {
            console.error('Failed to add prompt:', err);
            return null;
        }
    }, [user, getToken]);

    const updatePrompt = useCallback(async (userId: string, promptId: string, question: string, answer: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('profile_prompts')
                .update({ prompt_question: question, prompt_answer: answer, updated_at: new Date().toISOString() })
                .eq('id', promptId).eq('clerk_id', user.id)
                .select()
                .single();

            if (!error && data) {
                setPrompts(prev => prev.map(p => p.id === promptId ? data as any : p));
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }, [user, getToken]);

    const removePrompt = useCallback(async (userId: string, promptId: string): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { error } = await client.from('profile_prompts').delete().eq('id', promptId).eq('clerk_id', user.id);
            if (!error) {
                setPrompts(prev => prev.filter(p => p.id !== promptId));
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }, [user, getToken]);

    // ── Visibility ───────────────────────────────────────────────────────────
    const setFieldVisibility = useCallback(async (userId: string, fieldName: string, vis: 'visible' | 'hidden' | 'always_visible'): Promise<boolean> => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();

            // Upsert mechanism for Visibility
            const { data: existing } = await client.from('profile_visibility').select('id').eq('clerk_id', user.id).eq('field_name', fieldName).single();

            let res;
            if (existing) {
                res = await client.from('profile_visibility').update({ visibility: vis, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
            } else {
                res = await client.from('profile_visibility').insert({ clerk_id: user.id, field_name: fieldName, visibility: vis }).select().single();
            }

            if (!res.error && res.data) {
                setVisibility(prev => {
                    const filtered = prev.filter(v => v.field_name !== fieldName);
                    return [...filtered, res.data as any];
                });
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }, [user, getToken]);

    const getFieldVisibility = useCallback((fieldName: string): 'visible' | 'hidden' | 'always_visible' => {
        const entry = visibility.find(v => v.field_name === fieldName);
        return entry?.visibility || 'visible';
    }, [visibility]);

    // ── AlignPoints & Discovery Phase 2 ─────────────────────────────────────
    const sendAlignPoints = useCallback(async (receiverId: string, amount: number) => {
        if (!user) return { success: false, error: 'Not authenticated' };
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.rpc('send_alignpoints', {
                p_receiver_id: receiverId,
                p_amount: amount
            });

            if (error) throw error;

            // Optimistically update local balance state
            setApBalance(prev => prev ? {
                ...prev,
                balance: data.new_balance,
                lifetime_spent: prev.lifetime_spent + amount
            } : null);

            return { success: true, new_balance: data.new_balance };
        } catch (err: any) {
            console.error('Failed to send AP:', err);
            return { success: false, error: err.message || 'Error executing AP transaction' };
        }
    }, [user, getToken]);

    const swipeRight = useCallback(async (receiverId: string) => {
        if (!user) return { success: false, error: 'Not authenticated' };
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.rpc('swipe_right', {
                p_receiver_id: receiverId
            });

            if (error) throw error;
            return { success: true, is_match: data.is_match };
        } catch (err: any) {
            console.error('Failed to swipe right:', err);
            return { success: false, error: err.message || 'Error executing swipe transaction' };
        }
    }, [user, getToken]);

    // ── Phase 3: AIM & Discovery ─────────────────────────────────────────────
    const fetchDiscoveryFeed = useCallback(async () => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.rpc('get_discovery_feed', { p_limit: 20 });
            if (!error && data) {
                setDiscoveryFeed(data);
            }
        } catch (err) {
            console.error('Failed to fetch discovery feed:', err);
        }
    }, [user, getToken]);

    const fetchAIMMatches = useCallback(async () => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('ai_matches')
                .select('*')
                .eq('clerk_id', user.id)
                .eq('shown', false)
                .gt('expires_at', new Date().toISOString());

            if (!error && data) {
                setAiMatches(data);
            }
        } catch (err) {
            console.error('Failed to fetch AIMs:', err);
        }
    }, [user, getToken]);

    const markAIMShown = useCallback(async (aimId: string) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.rpc('mark_aim_shown', { p_aim_id: aimId });
            if (!error) {
                setAiMatches(prev => prev.filter(a => a.id !== aimId));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to mark AIM shown:', err);
            return false;
        }
    }, [user, getToken]);

    // Bootstrappers for Phase 3 logic on fresh context
    useEffect(() => {
        if (profile) {
            fetchDiscoveryFeed();
            fetchAIMMatches();
            fetchSubscription();
        }
    }, [profile, fetchDiscoveryFeed, fetchAIMMatches, fetchSubscription]);

    // ── Phase 5: Monetization & Subscription ─────────────────────────────────
    const fetchSubscription = useCallback(async () => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('subscriptions')
                .select('*')
                .eq('clerk_id', user.id)
                .single();

            if (!error && data) {
                setSubscription(data as SubscriptionData);
            } else if (error && error.code === 'PGRST116') {
                // Initialize default free tier locally if no record
                setSubscription({ id: 'free-tier', clerk_id: user.id, tier: 'free', status: 'active' });
            }
        } catch (err) {
            console.error('Failed to fetch subscription:', err);
        }
    }, [user, getToken]);

    const purchaseAP = useCallback(async (amount: number, ap_amount: number, razorpay_id: string) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            // Call into Phase 5 Secure Edge-Function/RPC
            const { error } = await client.rpc('credit_ap_purchase', {
                p_clerk_id: user.id,
                p_amount_paid: amount,
                p_ap_amount: ap_amount,
                p_razorpay_id: razorpay_id
            });
            if (error) throw error;

            // Re-sync wallet
            const { data: newBalance } = await client.from('alignpoint_balances').select('*').eq('clerk_id', user.id).single();
            if (newBalance) setApBalance(newBalance as APBalance);
            return true;
        } catch (err) {
            console.error('AP Purchase webhook trigger failed:', err);
            return false;
        }
    }, [user, getToken]);

    const upgradeSubscription = useCallback(async (tier: 'mini' | 'max', razorpay_id: string) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { error } = await client.rpc('activate_subscription', {
                p_clerk_id: user.id,
                p_tier: tier,
                p_razorpay_id: razorpay_id
            });
            if (error) throw error;

            // Sync new tier context locally
            await fetchSubscription();
            return true;
        } catch (err) {
            console.error('Subscription upgrade hook failed:', err);
            return false;
        }
    }, [user, getToken, fetchSubscription]);

    // ── Phase 7: Voice Profiles ─────────────────────────────────────────────
    const fetchVoiceProfile = useCallback(async (userId: string) => {
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.from('voice_profiles').select('*').eq('clerk_id', userId).single();
            if (error) throw error;
            return data as VoiceProfile;
        } catch (err) {
            console.error('Failed to fetch voice profile for user:', userId, err);
            return null;
        }
    }, [user, getToken]);

    const uploadVoiceProfile = useCallback(async (audioUri: string, durationSeconds: number) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();

            // 1. Convert local `.m4a` generated from expo-av directly into a raw Base64 Byte stream
            const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: 'base64' });

            // 2. Upload cleanly wrapped Base64 onto 'voice-profiles' storage bucket
            const fileName = `${user.id}_profile_audio_${Date.now()}.m4a`;
            const { error: uploadError } = await client.storage
                .from('voice-profiles')
                .upload(fileName, decode(base64Audio), {
                    contentType: 'audio/x-m4a',
                    upsert: true
                });
            if (uploadError) throw uploadError;

            // 3. Return the absolute public reference streaming URL
            const { data: stringUrl } = client.storage.from('voice-profiles').getPublicUrl(fileName);

            // 4. Update the actual voice_profiles relational database mapping
            const payload = {
                clerk_id: user.id,
                audio_url: stringUrl.publicUrl,
                duration_seconds: durationSeconds,
                updated_at: new Date().toISOString()
            };

            const { data, error: updateError } = await client.from('voice_profiles').upsert(payload, { onConflict: 'clerk_id' }).select().single();
            if (updateError) throw updateError;

            setVoiceProfile(data as VoiceProfile);
            return true;

        } catch (err) {
            console.error('Failed to upload voice profile over Context:', err);
            return false;
        }
    }, [user, getToken]);

    // ── Phase 8: Advanced AI Personality Engine ──────────────────────────────
    const fetchPersonalityVector = useCallback(async (userId: string) => {
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.from('personality_vectors').select('*').eq('clerk_id', userId).single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Failed to fetch personality vector for user:', userId, err);
            return null;
        }
    }, [user, getToken]);

    const fetchCompatibilityPredictions = useCallback(async (userId: string) => {
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('compatibility_predictions')
                .select('*')
                .or(`user1_clerk_id.eq.${userId},user2_clerk_id.eq.${userId}`)
                .order('predicted_success_score', { ascending: false });
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Failed to fetch compatibility predictions for user:', userId, err);
            return [];
        }
    }, [user, getToken]);

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
