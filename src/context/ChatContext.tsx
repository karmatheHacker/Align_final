import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { getAuthenticatedSupabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Conversation {
    id: string;
    user1_clerk_id: string;
    user2_clerk_id: string;
    created_at: string;
    last_message_at: string;
    last_message_preview: string;
    last_message_sender: string;
    is_active: boolean;
    other_user: {
        id: string;
        name: string;
        photo_url: string;
    };
    unread_count: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_clerk_id: string;
    receiver_clerk_id: string;
    message_text: string;
    message_type: string;
    created_at: string;
    read_at: string | null;
    delivered_at: string | null;
}

export interface Icebreaker {
    id: string;
    match_id: string;
    sender_clerk_id: string;
    receiver_clerk_id: string;
    icebreaker_text: string;
    generated_by: string;
    used: boolean;
}

interface ChatContextType {
    conversations: Conversation[];
    messages: Record<string, Message[]>; // conversation_id -> messages
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    isLoading: boolean;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, receiverId: string, text: string) => Promise<boolean>;
    markMessagesAsRead: (conversationId: string) => Promise<void>;

    // Phase 7: AI Icebreakers
    icebreakers: Record<string, Icebreaker[]>; // mapped by receiver_clerk_id
    fetchIcebreakers: (receiverId: string) => Promise<void>;
    generateIcebreakers: (receiverId: string, matchId: string) => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const { getToken } = useAuth();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [icebreakers, setIcebreakers] = useState<Record<string, Icebreaker[]>>({});
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    const getSupaConfig = async () => {
        const token = await getToken({ template: 'supabase' });
        if (!token) throw new Error('No Supabase Auth Token Formed');
        return getAuthenticatedSupabase(token);
    };

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const client = await getSupaConfig();

            // We use an RPC since we need to aggregate unread counts and pull counterpart profile data
            const { data, error } = await client.rpc('get_user_conversations');

            if (!error && data) {
                setConversations(data as any);
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, getToken]);

    const fetchMessages = useCallback(async (conversationId: string) => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(prev => ({ ...prev, [conversationId]: data as any }));
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    }, [user, getToken]);

    const sendMessage = useCallback(async (conversationId: string, receiverId: string, text: string) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();
            const { error } = await client.from('messages').insert([{
                conversation_id: conversationId,
                sender_clerk_id: user.id,
                receiver_clerk_id: receiverId,
                message_text: text
            }]);

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Failed to send message:', err);
            return false;
        }
    }, [user, getToken]);

    const markMessagesAsRead = useCallback(async (conversationId: string) => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            await client.from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', conversationId)
                .eq('receiver_clerk_id', user.id)
                .is('read_at', null);

            // Update local state locally
            setMessages(prev => {
                const updatedConvoMessages = prev[conversationId]?.map(m =>
                    m.receiver_clerk_id === user.id && !m.read_at
                        ? { ...m, read_at: new Date().toISOString() }
                        : m
                ) || [];
                return { ...prev, [conversationId]: updatedConvoMessages };
            });

            // Refresh unread counts in conversations list
            fetchConversations();
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    }, [user, getToken, fetchConversations]);

    // ── Phase 7: AI Icebreaker Integration ──────────────────────────────────
    const fetchIcebreakers = useCallback(async (receiverId: string) => {
        if (!user) return;
        try {
            const client = await getSupaConfig();
            const { data, error } = await client
                .from('ai_icebreakers')
                .select('*')
                .eq('sender_clerk_id', user.id)
                .eq('receiver_clerk_id', receiverId)
                .eq('used', false)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setIcebreakers(prev => ({ ...prev, [receiverId]: data as Icebreaker[] }));
            }
        } catch (err) {
            console.error('Failed to fetch icebreakers:', err);
        }
    }, [user, getToken]);

    const generateIcebreakers = useCallback(async (receiverId: string, matchId: string) => {
        if (!user) return false;
        try {
            const client = await getSupaConfig();

            // Calls the Phase 7 Supabase Edge function directly to trigger OpenAI
            const { error } = await client.functions.invoke('icebreaker_generator', {
                body: { match_id: matchId, sender_clerk_id: user.id, receiver_clerk_id: receiverId }
            });
            if (error) throw error;

            await fetchIcebreakers(receiverId);
            return true;
        } catch (err) {
            console.error('Failed to trigger AI icebreakers via Edge Function:', err);
            return false;
        }
    }, [user, getToken, fetchIcebreakers]);

    // Handle Realtime Subscriptions
    useEffect(() => {
        if (!user) return;

        let activeChannel: RealtimeChannel;

        const setupRealtime = async () => {
            try {
                const client = await getSupaConfig();

                activeChannel = client.channel(`chat_${user.id}`)
                    // Listen for new messages sent to this user
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `receiver_clerk_id=eq.${user.id}`
                    }, payload => {
                        const newMsg = payload.new as Message;

                        setMessages(prev => {
                            const existing = prev[newMsg.conversation_id] || [];
                            // Deduplicate: skip if we already have this message
                            if (existing.some(m => m.id === newMsg.id)) return prev;
                            return {
                                ...prev,
                                [newMsg.conversation_id]: [...existing, newMsg]
                            };
                        });

                        // If the message is in the currently active UI thread, mark read
                        if (activeConversationId === newMsg.conversation_id) {
                            markMessagesAsRead(newMsg.conversation_id);
                        } else {
                            // Otherwise just refresh list to show badge bump
                            fetchConversations();
                        }
                    })
                    // Also listen for your own sent messages returning from server
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `sender_clerk_id=eq.${user.id}`
                    }, payload => {
                        const newMsg = payload.new as Message;
                        setMessages(prev => {
                            const existing = prev[newMsg.conversation_id] || [];
                            // Deduplicate: skip if we already have this message
                            if (existing.some(m => m.id === newMsg.id)) return prev;
                            return {
                                ...prev,
                                [newMsg.conversation_id]: [...existing, newMsg]
                            };
                        });
                        fetchConversations(); // Updates last message preview
                    })
                    // Listen for "READ" events to show double blue checks
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                        filter: `sender_clerk_id=eq.${user.id}`
                    }, payload => {
                        const updatedMsg = payload.new as Message;
                        if (updatedMsg.read_at) {
                            setMessages(prev => ({
                                ...prev,
                                [updatedMsg.conversation_id]: prev[updatedMsg.conversation_id]?.map(m => m.id === updatedMsg.id ? updatedMsg : m) || []
                            }));
                        }
                    })
                    .subscribe();

                setChannel(activeChannel);
            } catch (err) {
                console.error("Realtime mount failed", err);
            }
        };

        setupRealtime();
        fetchConversations();

        return () => {
            if (activeChannel) activeChannel.unsubscribe();
        };
    }, [user, activeConversationId]); // Rebound when active connection shifts so read_receipts auto-fire

    return (
        <ChatContext.Provider value={{
            conversations, messages, icebreakers, activeConversationId, setActiveConversationId,
            isLoading, fetchConversations, fetchMessages, sendMessage, markMessagesAsRead,
            fetchIcebreakers, generateIcebreakers
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within ChatProvider');
    return context;
};
