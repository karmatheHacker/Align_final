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
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import COLORS from '../constants/colors';
import { useChat, Message } from '../context/ChatContext';
import { w, h, f, H_PAD } from '../utils/responsive';

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
    const [icebreakersDismissed, setIcebreakersDismissed] = useState(false);

    // Icebreakers: look up the Convex match for this chat partner, then fetch their icebreakers
    const convexMatch = useQuery(api.swipes.getMatchWithUser, receiverId ? { otherClerkId: receiverId } : 'skip');
    const icebreakers = useQuery(
        api.ai.icebreakers.getMyIcebreakerForMatch,
        convexMatch?._id ? { matchId: convexMatch._id } : 'skip'
    );
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
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.iconButton} onPress={handleClose} activeOpacity={0.8}>
                            <Ionicons name="chevron-back" size={w(20)} color={BLACK} />
                        </TouchableOpacity>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerName}>{matchName}</Text>
                            <Text style={styles.headerStatus}>MATCHED</Text>
                        </View>

                        <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                            <Ionicons name="ellipsis-horizontal" size={w(20)} color={BLACK} />
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
                            ListHeaderComponent={
                                <View style={styles.contextContainer}>
                                    <View style={styles.avatarWrapper}>
                                        {photo ? (
                                            <Image source={{ uri: photo }} style={styles.avatar} resizeMode="cover" />
                                        ) : (
                                            <View style={[styles.avatar, { backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }]}>
                                                <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_900Black', fontSize: f(28) }}>
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
                                <View style={{ alignItems: 'center', paddingVertical: h(20) }}>
                                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(0,0,0,0.35)' }}>
                                        Send the first message!
                                    </Text>
                                </View>
                            }
                        />

                        {/* ── Icebreaker Chips ──────────────────────────────── */}
                        {icebreakers && !icebreakersDismissed && conversationMessages.length === 0 && (
                            <View style={{ paddingHorizontal: w(16), paddingBottom: h(8) }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: h(8), gap: w(6) }}>
                                    <Ionicons name="sparkles" size={w(12)} color={ORANGE} />
                                    <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: f(9), color: 'rgba(0,0,0,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                        ALIGN ICEBREAKERS
                                    </Text>
                                    <TouchableOpacity onPress={() => setIcebreakersDismissed(true)} style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="close" size={w(14)} color="rgba(0,0,0,0.3)" />
                                    </TouchableOpacity>
                                </View>
                                {[icebreakers.option1, icebreakers.option2, icebreakers.option3, icebreakers.bonus].map((text, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        activeOpacity={0.75}
                                        onPress={() => { setInputText(text); setIcebreakersDismissed(true); }}
                                        style={{
                                            backgroundColor: i === 3 ? BLACK : 'rgba(0,0,0,0.06)',
                                            borderRadius: w(14), paddingHorizontal: w(14), paddingVertical: h(10),
                                            marginBottom: h(6),
                                        }}
                                    >
                                        {i === 3 && (
                                            <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: f(8), color: ORANGE, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: h(2) }}>
                                                DEEP DIVE
                                            </Text>
                                        )}
                                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: f(13), color: i === 3 ? CREAM : BLACK, lineHeight: f(19) }}>
                                            {text}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* ── Input Area ────────────────────────────────────── */}
                        <View style={styles.inputContainer}>
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
                                        submitBehavior="newline"
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
                                                size={w(18)}
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
        minHeight: h(64),
        backgroundColor: 'rgba(245, 240, 235, 0.97)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: H_PAD,
        zIndex: 10,
    },
    iconButton: {
        width: w(44), height: w(44), borderRadius: w(22),
        backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.07)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitleContainer: { alignItems: 'center' },
    headerName: {
        fontFamily: 'Inter_900Black', fontSize: f(18),
        color: BLACK, textTransform: 'uppercase', letterSpacing: -0.5,
    },
    headerStatus: {
        fontFamily: 'Inter_800ExtraBold', fontSize: f(9),
        color: ORANGE, letterSpacing: 2, marginTop: h(2),
    },

    scrollContent: { paddingTop: h(28), paddingHorizontal: H_PAD, paddingBottom: h(24) },
    contextContainer: { alignItems: 'center', marginBottom: h(40) },
    avatarWrapper: {
        padding: w(4), borderRadius: w(56),
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', marginBottom: h(14),
    },
    avatar: { width: w(88), height: w(88), borderRadius: w(44) },
    contextTitle: {
        fontFamily: 'Inter_900Black', fontSize: f(24),
        color: BLACK, textTransform: 'uppercase', letterSpacing: -1, marginBottom: h(6),
    },
    contextSubtext: {
        fontFamily: 'Inter_800ExtraBold', fontSize: f(9),
        color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textAlign: 'center',
    },

    bubbleWrapper: { marginBottom: h(18), maxWidth: '82%' },
    bubbleLeft: { alignSelf: 'flex-start' },
    bubbleRight: { alignSelf: 'flex-end' },
    bubble: { paddingHorizontal: w(18), paddingVertical: h(11), borderRadius: w(22) },
    bubbleReceived: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)',
        borderTopLeftRadius: w(4),
    },
    bubbleSent: { backgroundColor: BLACK, borderTopRightRadius: w(4) },
    bubbleText: { fontFamily: 'Inter_500Medium', fontSize: f(14), lineHeight: f(21), letterSpacing: 0.1 },
    timestamp: {
        fontFamily: 'Inter_800ExtraBold', fontSize: f(9),
        color: 'rgba(0,0,0,0.35)', letterSpacing: 1.5,
        textTransform: 'uppercase', marginTop: h(5),
    },

    inputContainer: {
        backgroundColor: CREAM,
        borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: h(14), paddingHorizontal: H_PAD, paddingBottom: h(20),
    },
    inputInner: { flexDirection: 'row', alignItems: 'center' },
    inputBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: w(32), padding: w(7),
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
        shadowColor: '#000', shadowOffset: { width: 0, height: h(3) },
        shadowOpacity: 0.04, shadowRadius: h(10), elevation: 2,
    },
    inputField: {
        flex: 1, minHeight: h(40), maxHeight: h(120),
        paddingHorizontal: w(14), fontFamily: 'Inter_500Medium',
        fontSize: f(15), letterSpacing: 0.1, color: BLACK,
    },
    sendButton: {
        width: w(40), height: w(40), borderRadius: w(20),
        justifyContent: 'center', alignItems: 'center', marginLeft: w(6),
    },
});
