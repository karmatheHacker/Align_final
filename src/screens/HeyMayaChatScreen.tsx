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
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';

const BG_COLOR = '#f9f7f2';
const TEXT_DARK = '#1d1d1f';
const ACCENT_BLUE = '#6e8efb';
const ACCENT_PURPLE = '#a777e3';

type Message = {
    id: string;
    text: string;
    isAi: boolean;
};

const INITIAL_PROMPTS = [
    "I am looking for a developer for React Native",
    "I want to hire someone for my startup",
    "Review my profile for freelancing",
    "How do I find high quality clients?",
];

const PromptPill = ({
    text,
    onPress,
    delay,
}: {
    text: string;
    onPress: () => void;
    delay: number;
}) => {
    const animY = useRef(new Animated.Value(20)).current;
    const animOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(animY, { toValue: 0, duration: 400, useNativeDriver: true }),
                Animated.timing(animOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: animOpacity, transform: [{ translateY: animY }], marginBottom: 12 }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={styles.promptPill}
            >
                <Text style={styles.promptText}>{text}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

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

const ChatBubble = ({ message, isLast }: { message: Message; isLast: boolean }) => {
    return (
        <View style={[
            styles.bubbleWrapper,
            message.isAi ? styles.bubbleLeft : styles.bubbleRight,
            isLast && { marginBottom: 20 }
        ]}>
            {message.isAi && (
                <View style={styles.aiAvatarSmall}>
                    <LinearGradient
                        colors={[ACCENT_BLUE, ACCENT_PURPLE]}
                        style={styles.aiAvatarGradient}
                    >
                        <MaterialCommunityIcons name="robot" size={12} color="white" />
                    </LinearGradient>
                </View>
            )}
            <View style={[
                styles.bubble,
                message.isAi ? styles.bubbleAi : styles.bubbleUser
            ]}>
                <Text style={[
                    styles.bubbleText,
                    { color: message.isAi ? TEXT_DARK : 'white' }
                ]}>
                    {message.text}
                </Text>
            </View>
        </View>
    );
};

export default function HeyMayaChatScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<any>();

    const chatHistory = useQuery(api.ai.chat.getMyAIChatHistory);
    const sendMessageAction = useAction(api.ai.chat.sendMessage);

    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const scrollRef = useRef<ScrollView>(null);

    const messages: Message[] = (chatHistory || []).map((m: any) => ({
        id: m._id,
        text: m.text,
        isAi: m.isAi
    }));

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleSend = async (text: string) => {
        if (!text.trim() || isTyping) return;

        setInputText('');
        setIsTyping(true);
        scrollToBottom();

        try {
            setErrorMessage(null);
            await sendMessageAction({ text: text.trim() });
        } catch (err: any) {
            console.error("Failed to send message:", err);
            setErrorMessage(err.message || "Failed to send message. Please try again.");
        } finally {
            setIsTyping(false);
            scrollToBottom();
        }
    };

    useEffect(() => {
        if (route.params?.initialMessage) {
            handleSend(route.params.initialMessage);
            (navigation as any).setParams({ initialMessage: undefined });
        }
    }, [route.params?.initialMessage]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={TEXT_DARK} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <LinearGradient
                        colors={[ACCENT_BLUE, ACCENT_PURPLE]}
                        style={styles.aiHeaderIcon}
                    >
                        <MaterialCommunityIcons name="robot" size={18} color="white" />
                    </LinearGradient>
                    <Text style={styles.headerTitle}>HeyMaya</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.chatArea}
                    contentContainerStyle={styles.chatContent}
                    onContentSizeChange={scrollToBottom}
                >
                    {messages.length === 0 && !isTyping && (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyHeader}>
                                <MaterialCommunityIcons name="robot" size={48} color={ACCENT_BLUE} />
                                <Text style={styles.emptyText}>Hey! I'm Maya. How can I help you today?</Text>
                            </View>
                            <View style={styles.pillsContainer}>
                                {INITIAL_PROMPTS.map((prompt, i) => (
                                    <PromptPill
                                        key={prompt}
                                        text={prompt}
                                        delay={i * 100}
                                        onPress={() => handleSend(prompt)}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {messages.map((msg, i) => (
                        <ChatBubble
                            key={msg.id}
                            message={msg}
                            isLast={i === messages.length - 1 && !isTyping && !errorMessage}
                        />
                    ))}

                    {errorMessage && (
                        <View style={styles.errorContainer}>
                            <Feather name="alert-circle" size={16} color="#B91C1C" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    )}

                    {isTyping && (
                        <View style={[styles.bubbleWrapper, styles.bubbleLeft]}>
                            <View style={styles.aiAvatarSmall}>
                                <LinearGradient
                                    colors={[ACCENT_BLUE, ACCENT_PURPLE]}
                                    style={styles.aiAvatarGradient}
                                >
                                    <MaterialCommunityIcons name="robot" size={12} color="white" />
                                </LinearGradient>
                            </View>
                            <View style={[styles.bubble, styles.bubbleAi, styles.typingBubble]}>
                                <BouncingDots />
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <View style={styles.inputInner}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Message HeyMaya..."
                            placeholderTextColor="#6e6e73"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxHeight={100}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                            onPress={() => handleSend(inputText)}
                            disabled={!inputText.trim() || isTyping}
                        >
                            <Feather name="arrow-up" size={20} color="#c4a484" />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_COLOR,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiHeaderIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_DARK,
    },
    chatArea: {
        flex: 1,
    },
    chatContent: {
        padding: 16,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 40,
    },
    emptyHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 16,
        color: TEXT_DARK,
        fontSize: 20,
        fontWeight: '700',
        paddingHorizontal: 40,
    },
    pillsContainer: {
        width: '100%',
    },
    promptPill: {
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    promptText: {
        fontSize: 15,
        color: TEXT_DARK,
        fontWeight: '500',
    },
    bubbleWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
        maxWidth: '85%',
    },
    bubbleLeft: {
        alignSelf: 'flex-start',
    },
    bubbleRight: {
        alignSelf: 'flex-end',
    },
    aiAvatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 8,
    },
    aiAvatarGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleAi: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleUser: {
        backgroundColor: TEXT_DARK,
        borderBottomRightRadius: 4,
    },
    bubbleText: {
        fontSize: 15,
        lineHeight: 20,
    },
    typingBubble: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#d1d1d6',
    },
    inputContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    inputInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: TEXT_DARK,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0e2d3',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        borderRadius: 12,
        padding: 12,
        marginVertical: 10,
        gap: 8,
    },
    errorText: {
        fontSize: 13,
        color: '#B91C1C',
        flex: 1,
    },
});
