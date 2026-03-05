import React, { createContext, useContext, useState, useCallback } from 'react';

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
    messages: Record<string, Message[]>;
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    isLoading: boolean;
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (conversationId: string, receiverId: string, text: string) => Promise<boolean>;
    markMessagesAsRead: (conversationId: string) => Promise<void>;

    icebreakers: Record<string, Icebreaker[]>;
    fetchIcebreakers: (receiverId: string) => Promise<void>;
    generateIcebreakers: (receiverId: string, matchId: string) => Promise<boolean>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [icebreakers] = useState<Record<string, Icebreaker[]>>({});
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading] = useState(false);

    const fetchConversations = useCallback(async () => { }, []);
    const fetchMessages = useCallback(async (_conversationId: string) => { }, []);

    const sendMessage = useCallback(async (conversationId: string, _receiverId: string, text: string): Promise<boolean> => {
        const newMsg: Message = {
            id: Date.now().toString(),
            conversation_id: conversationId,
            sender_clerk_id: 'local',
            receiver_clerk_id: _receiverId,
            message_text: text,
            message_type: 'text',
            created_at: new Date().toISOString(),
            read_at: null,
            delivered_at: null,
        };
        setMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), newMsg],
        }));
        return true;
    }, []);

    const markMessagesAsRead = useCallback(async (_conversationId: string) => { }, []);
    const fetchIcebreakers = useCallback(async (_receiverId: string) => { }, []);
    const generateIcebreakers = useCallback(async (_receiverId: string, _matchId: string) => false, []);

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
