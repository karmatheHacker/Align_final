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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
    "How do I rizz them up?",
    "What's a good first date idea?",
    "How should I reply to their last message?",
];

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const fetchAIResponse = async (userMessage: string, previousMessages: Message[]) => {
    try {
        const apiMessages = [
            { role: "system", content: "You are Align AI, a personalized dating strategist. Be helpful, concise, witty, and encourage positive connection. Keep your answers short, ideally 1-3 sentences." },
            ...previousMessages.map((m: Message) => ({ role: m.isAi ? "assistant" : "user", content: m.text })),
            { role: "user", content: userMessage }
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: apiMessages
            })
        });
        const data = await response.json();

        if (data.error) {
            console.error("Groq API Error in response payload:", data.error.message);
            return "Oops, something went wrong on my end. I'm taking a quick break!";
        }

        return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't think of a response.";
    } catch (error) {
        console.error("Groq API Error:", error);
        return "Oops, something went wrong connecting to my brain. Let's try again later!";
    }
};

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

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const scrollRef = useRef<ScrollView>(null);
    const screenOpacity = useRef(new Animated.Value(0)).current;
    const screenSlide = useRef(new Animated.Value(10)).current;

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

        const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isAi: false };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        scrollToBottom();

        // Fetch AI response
        const responseText = await fetchAIResponse(text.trim(), messages);

        setIsTyping(false);
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: responseText,
            isAi: true,
        };
        setMessages(prev => [...prev, aiMsg]);
        scrollToBottom();
    };

    const canSend = inputText.trim().length > 0;

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={styles.flex1}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    style={[
                        styles.flex1,
                        { opacity: screenOpacity, transform: [{ translateY: screenSlide }] },
                    ]}
                >
                    <StatusBar style="dark" />

                    {/* ── Header ──────────────────────────────────────────────────────── */}
                    <View style={[styles.header, { paddingTop: 16 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color={BLACK} />
                        </TouchableOpacity>

                        <View style={styles.titleRow}>
                            {/* Star mark — uses a simple Unicode or Ionicons star */}
                            <Ionicons name="sparkles" size={22} color={ORANGE} />
                            <Text style={styles.headline}>ALIGN AI</Text>
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
                                { paddingBottom: 24 },
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
        paddingHorizontal: 28,
        paddingBottom: 20,
        backgroundColor: CREAM,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.06)',
    },
    backBtn: {
        marginBottom: 12,
        marginLeft: -6,
        width: 36,
        height: 36,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 2,
    },
    headline: {
        fontFamily: 'Inter_900Black',
        fontSize: 44,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: -2,
        lineHeight: 50,
    },
    subtitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: 'rgba(13,13,13,0.45)',
        letterSpacing: 2.5,
        textTransform: 'uppercase',
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
});
