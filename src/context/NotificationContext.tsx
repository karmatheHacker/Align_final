import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { getAuthenticatedSupabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
    id: string;
    clerk_id: string;
    type: string;
    title: string;
    body: string;
    data: any;
    is_read: boolean;
    created_at: string;
}

export interface Boost {
    id: string;
    clerk_id: string;
    boost_type: 'mini' | 'max' | 'purchase';
    start_time: string;
    end_time: string;
    is_active: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    activeBoost: Boost | null;
    fetchNotifications: () => Promise<void>;
    markNotificationRead: (id: string) => Promise<boolean>;
    markAllRead: () => Promise<boolean>;
    registerPushToken: (token: string, platform: string) => Promise<void>;
    activateBoost: (type: 'mini' | 'max' | 'purchase') => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const { getToken } = useAuth();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeBoost, setActiveBoost] = useState<Boost | null>(null);

    const getSupaConfig = async () => {
        const token = await getToken({ template: 'supabase' });
        if (!token) throw new Error('No Supabase Auth Token Formed');
        return getAuthenticatedSupabase(token);
    };

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('notifications')
                .select('*')
                .eq('clerk_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                setNotifications(data as Notification[]);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, [user, getToken]);

    const fetchActiveBoost = useCallback(async () => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('boosts')
                .select('*')
                .eq('clerk_id', user.id)
                .eq('is_active', true)
                .gt('end_time', new Date().toISOString())
                .single();

            if (!error && data) setActiveBoost(data as Boost);
            else setActiveBoost(null);
        } catch (err) {
            console.log('No active boost found');
            setActiveBoost(null);
        }
    }, [user, getToken]);

    const markNotificationRead = useCallback(async (id: string) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { error } = await client.from('notifications')
                .update({ is_read: true })
                .eq('id', id)
                .eq('clerk_id', user.id);

            if (!error) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to mark read', err);
            return false;
        }
    }, [user, getToken]);

    const markAllRead = useCallback(async () => {
        if (!user || unreadCount === 0) return true;
        try {
            const client = await getSupaConfig();
            const { error } = await client.from('notifications')
                .update({ is_read: true })
                .eq('clerk_id', user.id)
                .eq('is_read', false);

            if (!error) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to mark all read', err);
            return false;
        }
    }, [user, getToken, unreadCount]);

    const registerPushToken = useCallback(async (token: string, platform: string) => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            await client.from('push_tokens').upsert({
                clerk_id: user.id,
                push_token: token,
                platform,
                updated_at: new Date().toISOString()
            }, { onConflict: 'clerk_id' });
        } catch (err) {
            console.error('Push token registration fail:', err);
        }
    }, [user, getToken]);

    const activateBoost = useCallback(async (type: 'mini' | 'max' | 'purchase') => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client.rpc('activate_profile_boost', {
                p_clerk_id: user.id,
                p_boost_type: type
            });
            if (error) throw error;

            await fetchActiveBoost();
            return true;
        } catch (err) {
            console.error('Failed to activate boost:', err);
            return false;
        }
    }, [user, getToken, fetchActiveBoost]);

    // Realtime Notifications Hook
    useEffect(() => {
        if (!user) return;

        // Initial Fetch
        fetchNotifications();
        fetchActiveBoost();

        let channel: RealtimeChannel;

        const setupRealtime = async () => {
            const client = await getSupaConfig();
            channel = client.channel(`notifications_${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `clerk_id=eq.${user.id}`
                }, payload => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                    setUnreadCount(prev => prev + 1);
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'boosts',
                    filter: `clerk_id=eq.${user.id}`
                }, payload => {
                    fetchActiveBoost(); // Checks for active updates or expirations realtime
                })
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, [user]);

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, activeBoost,
            fetchNotifications, markNotificationRead, markAllRead,
            registerPushToken, activateBoost
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within Provider');
    return context;
};
