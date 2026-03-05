import React, { createContext, useContext, useState, useCallback } from 'react';

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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeBoost] = useState<Boost | null>(null);

    const fetchNotifications = useCallback(async () => { }, []);

    const markNotificationRead = useCallback(async (id: string): Promise<boolean> => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
    }, []);

    const markAllRead = useCallback(async (): Promise<boolean> => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        return true;
    }, []);

    const registerPushToken = useCallback(async (_token: string, _platform: string) => { }, []);

    const activateBoost = useCallback(async (_type: 'mini' | 'max' | 'purchase'): Promise<boolean> => {
        return false;
    }, []);

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
