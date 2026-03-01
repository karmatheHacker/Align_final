import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import COLORS from '../constants/colors';
import { useChat, Message } from '../context/ChatContext';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

// ─── Time formatter ───────────────────────────────────────────────────────────
function formatMsgTime(isoStr: string): string {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
}

export default function ActiveChatScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { user } = useUser();
    const { messages, fetchMessages, sendMessage, markMessagesAsRead, setActiveConversationId } = useChat();

    const {
        conversationId = '',
        receiverId = '',
        matchName = 'MATCH',
        photo = null,
    } = route.params || {};

    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const listRef = useRef<FlatList>(null);

    const { width: W } = Dimensions.get('window');
    const [rendered, setRendered] = useState(false);
    const translateX = useRef(new Animated.Value(W)).current;

    const conversationMessages: Message[] = messages[conversationId] || [];

    // Slide-in animation
    useEffect(() => {
        setRendered(true);
        Animated.spring(translateX, {
            toValue: 0,
            damping: 30,
            stiffness: 200,
            useNativeDriver: true,
        }).start();
    }, []);

    // Register as active conversation & fetch messages on mount
    useEffect(() => {
        if (!conversationId) return;
        setActiveConversationId(conversationId);
        fetchMessages(conversationId);
        markMessagesAsRead(conversationId);

        return () => {
            setActiveConversationId(null);
        };
    }, [conversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (conversationMessages.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [conversationMessages.length]);

    const handleClose = () => {
        Animated.spring(translateX, {
            toValue: W,
            damping: 30,
            stiffness: 200,
            useNativeDriver: true,
        }).start(() => navigation.goBack());
    };

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || !conversationId || !receiverId || isSending) return;
        setIsSending(true);
        setInputText('');
        await sendMessage(conversationId, receiverId, text);
        setIsSending(false);
    }, [inputText, conversationId, receiverId, isSending, sendMessage]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isSent = item.sender_clerk_id === user?.id;
        return (
            <View style={[styles.bubbleWrapper, isSent ? styles.bubbleRight : styles.bubbleLeft]}>
                <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}>
                    <Text style={[styles.bubbleText, { color: isSent ? CREAM : BLACK }]}>
                        {item.message_text}
                    </Text>
                </View>
                <Text style={[styles.timestamp, { textAlign: isSent ? 'right' : 'left' }]}>
                    {formatMsgTime(item.created_at)}
                    {isSent && item.read_at ? '  ✓✓' : ''}
                </Text>
            </View>
        );
    };

    if (!rendered) return null;

    return (
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: CREAM, transform: [{ translateX }] }]}>
            <SafeAreaView style={styles.root}>
                <KeyboardAvoidingView
                    style={styles.flex1}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <StatusBar style="dark" />

                    {/* ── Header ───────────────────────────────────────────── */}
                    <View style={[styles.header, { height: 64 }]}>
                        <TouchableOpacity style={styles.iconButton} onPress={handleClose} activeOpacity={0.8}>
                            <Ionicons name="chevron-back" size={20} color={BLACK} />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerName}>{matchName}</Text>
                            <Text style={styles.headerStatus}>MATCHED</Text>
                        </View>

                        <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                            <Ionicons name="ellipsis-horizontal" size={20} color={BLACK} />
                        </TouchableOpacity>
                    </View>

                    {/* ── Messages List ─────────────────────────────────────── */}
                    <View style={styles.flex1}>
                        <FlatList
                            ref={listRef}
                            data={conversationMessages}
                            keyExtractor={(item) => item.id}
                            renderItem={renderMessage}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                            ListHeaderComponent={
                                <View style={styles.contextContainer}>
                                    <View style={styles.avatarWrapper}>
                                        {photo ? (
                                            <Image source={{ uri: photo }} style={styles.avatar} resizeMode="cover" />
                                        ) : (
                                            <View style={[styles.avatar, { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }]}>
                                                <Text style={{ color: '#fff', fontFamily: 'Inter_900Black', fontSize: 32 }}>
                                                    {matchName[0]}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.contextTitle}>YOU & {matchName}</Text>
                                    <Text style={styles.contextSubtext}>THIS IS THE BEGINNING OF YOUR CONVERSATION</Text>
                                </View>
                            }
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(0,0,0,0.35)' }}>
                                        Send the first message!
                                    </Text>
                                </View>
                            }
                        />

                        {/* ── Input Area ────────────────────────────────────── */}
                        <View style={[styles.inputContainer, { paddingBottom: 24 }]}>
                            <View style={styles.inputInner}>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="TYPE A MESSAGE..."
                                        placeholderTextColor="rgba(0,0,0,0.4)"
                                        value={inputText}
                                        onChangeText={setInputText}
                                        selectionColor={ORANGE}
                                        multiline
                                        onSubmitEditing={handleSend}
                                        blurOnSubmit={false}
                                    />
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={handleSend}
                                        disabled={!inputText.trim() || isSending}
                                        style={[
                                            styles.sendButton,
                                            { backgroundColor: inputText.trim().length > 0 ? ORANGE : 'rgba(0,0,0,0.05)' }
                                        ]}
                                    >
                                        {isSending ? (
                                            <ActivityIndicator size="small" color={CREAM} />
                                        ) : (
                                            <Ionicons
                                                name="arrow-up"
                                                size={18}
                                                color={inputText.trim().length > 0 ? CREAM : 'rgba(0,0,0,0.4)'}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Animated.View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },
    flex1: { flex: 1 },

    header: {
        backgroundColor: 'rgba(245, 240, 235, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    iconButton: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitleContainer: { alignItems: 'center' },
    headerName: {
        fontFamily: 'Inter_900Black', fontSize: 20,
        color: BLACK, textTransform: 'uppercase', letterSpacing: -1,
    },
    headerStatus: {
        fontFamily: 'Inter_800ExtraBold', fontSize: 10,
        color: ORANGE, letterSpacing: 2, marginTop: 2,
    },

    scrollContent: { paddingTop: 32, paddingHorizontal: 24, paddingBottom: 24 },
    contextContainer: { alignItems: 'center', marginBottom: 48 },
    avatarWrapper: {
        padding: 4, borderRadius: 56,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', marginBottom: 16,
    },
    avatar: { width: 96, height: 96, borderRadius: 48 },
    contextTitle: {
        fontFamily: 'Inter_900Black', fontSize: 32,
        color: BLACK, textTransform: 'uppercase', letterSpacing: -1, marginBottom: 8,
    },
    contextSubtext: {
        fontFamily: 'Inter_800ExtraBold', fontSize: 10,
        color: 'rgba(0,0,0,0.4)', letterSpacing: 2, textAlign: 'center',
    },

    bubbleWrapper: { marginBottom: 24, maxWidth: '85%' },
    bubbleLeft: { alignSelf: 'flex-start' },
    bubbleRight: { alignSelf: 'flex-end' },
    bubble: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24 },
    bubbleReceived: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
        borderTopLeftRadius: 4,
    },
    bubbleSent: { backgroundColor: BLACK, borderTopRightRadius: 4 },
    bubbleText: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, letterSpacing: 0.2 },
    timestamp: {
        fontFamily: 'Inter_800ExtraBold', fontSize: 10,
        color: 'rgba(0,0,0,0.4)', letterSpacing: 1.5,
        textTransform: 'uppercase', marginTop: 6,
    },

    inputContainer: {
        backgroundColor: CREAM,
        borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 16, paddingHorizontal: 24,
    },
    inputInner: { flexDirection: 'row', alignItems: 'center' },
    inputBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 32, padding: 8,
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    },
    inputField: {
        flex: 1, minHeight: 40, maxHeight: 120,
        paddingHorizontal: 16, fontFamily: 'Inter_800ExtraBold',
        fontSize: 11, letterSpacing: 2, color: BLACK,
        textTransform: 'uppercase',
    },
    sendButton: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', marginLeft: 8,
    },
});
