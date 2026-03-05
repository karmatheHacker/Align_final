import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import COLORS from '../constants/colors';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
    id: string;
    text: string;
    isAi: boolean;
};

const INITIAL_PROMPTS = [
    "Review my profile",
    "How do I rizz them up?",
    "What's a good first date idea?",
    "How should I reply to their last message?",
];

// ─── Groq API logic moved to Convex ──────────────────────────────────────────

// ─── PromptPill ───────────────────────────────────────────────────────────────
const PromptPill = ({
    text,
    onPress,
    delay,
}: {
    text: string;
    onPress: () => void;
    delay: number;
}) => {
    const animY = useRef(new Animated.Value(10)).current;
    const animOpacity = useRef(new Animated.Value(0)).current;
    const colorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(animY, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(animOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const handlePressIn = () => Animated.timing(colorAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    const handlePressOut = () => Animated.timing(colorAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

    const bgColor = colorAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#0D0D0D'] });
    const textColor = colorAnim.interpolate({ inputRange: [0, 1], outputRange: ['#0D0D0D', CREAM] });

    return (
        <Animated.View style={{ opacity: animOpacity, transform: [{ translateY: animY }], marginBottom: 12 }}>
            <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
                <Animated.View style={[styles.promptPill, { backgroundColor: bgColor }]}>
                    <Animated.Text style={[styles.promptText, { color: textColor }]}>
                        {text}
                    </Animated.Text>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── BouncingDots ─────────────────────────────────────────────────────────────
const BouncingDots = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const bounce = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(200),
                ])
            );

        bounce(dot1, 0).start();
        bounce(dot2, 100).start();
        bounce(dot3, 200).start();
    }, []);

    return (
        <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
            <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
            <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
        </View>
    );
};

// ─── ChatBubble ───────────────────────────────────────────────────────────────
const ChatBubble = ({ message, isLast }: { message: Message; isLast: boolean }) => {
    const scale = useRef(new Animated.Value(0.95)).current;
    const translateY = useRef(new Animated.Value(10)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, damping: 25, stiffness: 200, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, damping: 25, stiffness: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.bubbleWrapper,
                message.isAi ? styles.bubbleLeft : styles.bubbleRight,
                { opacity, transform: [{ scale }, { translateY }] },
                isLast && { marginBottom: 24 },
            ]}
        >
            <View style={[styles.bubble, message.isAi ? styles.bubbleAi : styles.bubbleUser]}>
                <Text style={[styles.bubbleText, { color: message.isAi ? BLACK : CREAM }]}>
                    {message.text}
                </Text>
            </View>
        </Animated.View>
    );
};

// ─── AlignAIScreen ────────────────────────────────────────────────────────────
export default function AlignAIScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const chatHistory = useQuery(api.ai.chat.getMyAIChatHistory);
    const sendMessageAction = useAction(api.ai.chat.sendMessage);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const scrollRef = useRef<ScrollView>(null);
    const screenOpacity = useRef(new Animated.Value(0)).current;
    const screenSlide = useRef(new Animated.Value(10)).current;

    // Local messages override for optimistic UI or when loading
    const messages: Message[] = (chatHistory || []).map((m: any) => ({
        id: m._id,
        text: m.text,
        isAi: m.isAi
    }));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(screenOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(screenSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        setInputText('');
        setIsTyping(true);
        scrollToBottom();

        try {
            setErrorMessage(null);
            await sendMessageAction({ text: text.trim() });
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to send message. Please try again.");
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    };

    const canSend = inputText.trim().length > 0 && !isTyping;

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <Animated.View
                    style={[
                        styles.flex1,
                        { opacity: screenOpacity, transform: [{ translateY: screenSlide }] },
                    ]}
                >
                    <StatusBar style="dark" />

                    {/* ── Header ──────────────────────────────────────────────────────── */}
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                                <Ionicons name="chevron-back" size={24} color={BLACK} />
                            </TouchableOpacity>
                            <View style={styles.titleRow}>
                                <Ionicons name="sparkles" size={20} color={ORANGE} />
                                <Text style={styles.headline}>ALIGN AI</Text>
                            </View>
                        </View>
                        <Text style={styles.subtitle}>YOUR PERSONAL DATING STRATEGIST</Text>
                    </View>

                    {/* ── Chat area + input ────────────────────────────────────────────── */}
                    <View style={styles.flex1}>
                        <ScrollView
                            ref={scrollRef}
                            style={styles.flex1}
                            contentContainerStyle={[
                                styles.chatContent,
                                messages.length === 0 && styles.chatContentEmpty,
                            ]}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={scrollToBottom}
                        >
                            {messages.length === 0 ? (
                                /* Prompt pills — centred at bottom of empty state */
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyHint}>Try asking...</Text>
                                    {INITIAL_PROMPTS.map((prompt, i) => (
                                        <PromptPill
                                            key={prompt}
                                            text={prompt}
                                            delay={i * 100}
                                            onPress={() => handleSend(prompt)}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View>
                                    {messages.map((msg, i) => (
                                        <ChatBubble
                                            key={msg.id}
                                            message={msg}
                                            isLast={i === messages.length - 1 && !isTyping}
                                        />
                                    ))}

                                    {errorMessage && (
                                        <View style={styles.errorContainer}>
                                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                            <Text style={styles.errorText}>{errorMessage}</Text>
                                        </View>
                                    )}

                                    {/* AI typing indicator */}
                                    {isTyping && (
                                        <View
                                            style={[
                                                styles.bubbleWrapper,
                                                styles.bubbleLeft,
                                                { marginBottom: 24 },
                                            ]}
                                        >
                                            <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                                                <BouncingDots />
                                            </View>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>

                        {/* ── Input bar ──────────────────────────────────────────────── */}
                        <View
                            style={[
                                styles.inputContainer,
                                { paddingBottom: Math.max(insets.bottom, 20) },
                            ]}
                        >
                            <View style={styles.inputPill}>
                                <Ionicons
                                    name="mic"
                                    size={18}
                                    color="rgba(13,13,13,0.35)"
                                    style={styles.micIcon}
                                />
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="ASK ALIGN ANYTHING..."
                                    placeholderTextColor="rgba(13,13,13,0.35)"
                                    value={inputText}
                                    onChangeText={setInputText}
                                    selectionColor={ORANGE}
                                    multiline
                                    returnKeyType="send"
                                    onSubmitEditing={() => handleSend(inputText)}
                                />
                                <TouchableOpacity
                                    onPress={() => handleSend(inputText)}
                                    disabled={!canSend}
                                    style={[
                                        styles.sendBtn,
                                        canSend ? styles.sendBtnActive : styles.sendBtnInactive,
                                    ]}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name="arrow-up"
                                        size={18}
                                        color={canSend ? CREAM : 'rgba(13,13,13,0.35)'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
    },
    flex1: {
        flex: 1,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundColor: CREAM,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.05)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
        marginRight: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 2,
    },
    headline: {
        fontFamily: 'Inter_900Black',
        fontSize: 32,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: -1.5,
        lineHeight: 38,
    },
    subtitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 9,
        color: 'rgba(13,13,13,0.4)',
        letterSpacing: 2.2,
        textTransform: 'uppercase',
        marginLeft: 34, // Align with title text
    },

    // ── Chat area ─────────────────────────────────────────────────────────────
    chatContent: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 16,
    },
    chatContentEmpty: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyState: {
        width: '100%',
    },
    emptyHint: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: 'rgba(13,13,13,0.3)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 16,
    },

    // ── Prompt pill ───────────────────────────────────────────────────────────
    promptPill: {
        width: '100%',
        paddingVertical: 18,
        paddingHorizontal: 22,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.07)',
    },
    promptText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        lineHeight: 22,
    },

    // ── Chat bubbles ──────────────────────────────────────────────────────────
    bubbleWrapper: {
        marginBottom: 12,
        maxWidth: '84%',
    },
    bubbleLeft: {
        alignSelf: 'flex-start',
    },
    bubbleRight: {
        alignSelf: 'flex-end',
    },
    bubble: {
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 22,
    },
    bubbleAi: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.07)',
        borderTopLeftRadius: 4,
        // subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    bubbleUser: {
        backgroundColor: BLACK,
        borderTopRightRadius: 4,
    },
    bubbleText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        lineHeight: 22,
    },
    typingBubble: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },

    // ── Bouncing dots ─────────────────────────────────────────────────────────
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        height: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(13,13,13,0.3)',
    },

    // ── Input bar ─────────────────────────────────────────────────────────────
    inputContainer: {
        paddingHorizontal: 20,
        paddingTop: 14,
        backgroundColor: CREAM,
        borderTopWidth: 1,
        borderTopColor: 'rgba(13,13,13,0.05)',
    },
    inputPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        paddingVertical: 8,
        paddingRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    micIcon: {
        marginHorizontal: 16,
    },
    inputField: {
        flex: 1,
        minHeight: 20,
        maxHeight: 120,
        fontFamily: 'Inter_700Bold',
        fontSize: 11,
        letterSpacing: 1.5,
        color: BLACK,
        paddingTop: Platform.OS === 'ios' ? 4 : 0,
        paddingBottom: Platform.OS === 'ios' ? 4 : 0,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnActive: {
        backgroundColor: ORANGE,
    },
    sendBtnInactive: {
        backgroundColor: 'rgba(13,13,13,0.06)',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#B91C1C',
        flex: 1,
    },
});
