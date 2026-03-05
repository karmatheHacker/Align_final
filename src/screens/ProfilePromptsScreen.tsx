import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Animated,
    Easing,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    ScrollView,
    StyleSheet,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER, STEP_CONFIG } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import SkipButton from '../components/SkipButton';
import { validatePrompts, sanitizeInput } from '../utils/inputValidation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROMPTS_LIST = [
    "A non-negotiable for me is...",
    "I'm convinced that...",
    "The way to win me over is...",
    "My simple pleasure is...",
    "I geek out on...",
    "Together we could...",
    "I'm looking for...",
    "My most controversial opinion is...",
    "I bet you can't...",
    "Worst idea I've ever had..."
];

interface ProfilePromptsScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const ProfilePromptsScreen: React.FC<ProfilePromptsScreenProps> = ({ onNext, onBack }) => {
    const { state, dispatch } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [prompts, setPrompts] = useState(state.prompts);
    const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const currentIndex = STEP_ORDER.indexOf('prompts');
    const totalSteps = STEP_ORDER.length;

    const stepConfig = STEP_CONFIG.find(s => s.id === 'prompts');
    const isRequired = stepConfig?.required ?? false;

    // Animations
    const bgDriftY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgDriftY, { toValue: -15, duration: 10000, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(bgDriftY, { toValue: 0, duration: 10000, easing: Easing.linear, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleSelectPrompt = (index: number) => {
        setActivePromptIndex(index);
        setIsModalVisible(true);
    };

    const confirmPromptSelection = (question: string) => {
        if (activePromptIndex !== null) {
            const newPrompts = [...prompts];
            newPrompts[activePromptIndex].question = question;
            setPrompts(newPrompts);
            setIsModalVisible(false);
        }
    };

    const updateAnswer = (index: number, text: string) => {
        const newPrompts = [...prompts];
        newPrompts[index].answer = text;
        setPrompts(newPrompts);
    };

    const handleNext = async () => {
        if (!isReady) return;
        const sanitizedPrompts = prompts.map(p => ({
            ...p,
            answer: p.question !== "Select a prompt..." ? sanitizeInput(p.answer) : p.answer
        }));

        const dbPrompts = sanitizedPrompts.map(p => ({
            question: p.question,
            answer: p.answer
        }));

        // Fire and forget save to Convex
        saveField({ prompts: dbPrompts }).catch(() => undefined);

        dispatch({ type: 'SET_FIELD', field: 'prompts', value: sanitizedPrompts });
        onNext();
    };

    const handleSkip = async () => {
        // Fire and forget save to Convex
        saveField({ prompts: null }).catch(() => undefined);
        onNext();
    };

    const validationResults = prompts.map(p => {
        if (p.question === "Select a prompt...") return { isValid: true };
        return validatePrompts(p.answer, 500, false); // if they selected a prompt, they must fill it out.
    });

    const filledCount = prompts.filter((p, index) => p.question !== "Select a prompt..." && p.answer.length > 0 && validationResults[index].isValid).length;
    const isReady = isRequired ? filledCount >= 1 : true;

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    return (
        <View style={styles.container}>
            {/* Background Text Layer */}
            <View style={styles.bgOverlay} pointerEvents="none">
                <Animated.Text style={[styles.bgText, { top: 60, right: -20, transform: [{ rotate: '5deg' }, { translateY: bgDriftY }] }]}>
                    VIBE
                </Animated.Text>
                <Animated.Text style={[styles.bgText, { bottom: 200, left: -20, transform: [{ rotate: '-4deg' }, { translateY: bgDriftY }] }]}>
                    PROMPTS
                </Animated.Text>
            </View>

            {/* Accent Dot */}
            <View style={styles.accentDot} />

            <StepIndicator
                currentIndex={currentIndex}
                totalSteps={totalSteps}
                onBack={onBack}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
            >
                <ScrollView
                    style={styles.flex1}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.mainContent}>
                        <FadeUpView delay={200} style={styles.titleContainer}>
                            <Text
                                style={styles.title}
                                numberOfLines={2}
                                adjustsFontSizeToFit
                                allowFontScaling={false}
                            >
                                TELL US{'\n'}MORE.
                            </Text>
                            <View style={styles.accentBar} />
                        </FadeUpView>

                        <FadeUpView delay={350} style={styles.descContainer}>
                            <Text style={styles.descText}>
                                Pick 3 prompts to show who you are.
                            </Text>
                        </FadeUpView>

                        <FadeUpView delay={500} style={styles.promptsContainer}>
                            {prompts.map((item, index) => (
                                <View key={item.id} style={styles.promptCard}>
                                    <TouchableOpacity
                                        onPress={() => handleSelectPrompt(index)}
                                        style={styles.promptHeader}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.promptQuestion,
                                                item.question === "Select a prompt..." && styles.dimText
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {item.question === "Select a prompt..." ? "TAP TO SELECT A PROMPT" : item.question.toUpperCase()}
                                        </Text>
                                        <View style={styles.editIconCircle}>
                                            <MaterialIcons name="edit" size={13} color="rgba(0,0,0,0.35)" />
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.divider} />

                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Type your answer here..."
                                        placeholderTextColor="rgba(0,0,0,0.15)"
                                        multiline
                                        maxLength={150}
                                        value={item.answer}
                                        onChangeText={(text) => updateAnswer(index, text)}
                                        editable={item.question !== "Select a prompt..."}
                                        selectionColor={COLORS.primary}
                                    />
                                    <View style={styles.promptFooter}>
                                        {item.question !== "Select a prompt..." && item.answer.length > 0 && !validationResults[index].isValid ? (
                                            <Text style={styles.errorText}>{validationResults[index].error}</Text>
                                        ) : <View style={{ flex: 1 }} />}
                                        <Text style={styles.charCount}>{item.answer.length}/150</Text>
                                    </View>
                                </View>
                            ))}
                        </FadeUpView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <FooterFadeIn
                delay={700}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[
                        styles.btnContinue,
                        !isReady && styles.btnDisabled,
                        {
                            opacity: prompts.some(p => p.answer.trim().length > 0) ? 1 : 0,
                            pointerEvents: prompts.some(p => p.answer.trim().length > 0) ? 'auto' : 'none'
                        }
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!isReady}
                >
                    <Text style={styles.btnText}>
                        {isRequired && filledCount < 1 ? `CONTINUE (${filledCount}/1 REQUIRED)` : 'CONTINUE'}
                    </Text>
                    <Feather name="arrow-right" size={20} color={COLORS.white} />
                </TouchableOpacity>

                {!isRequired && (
                    <SkipButton onPress={handleSkip} />
                )}
            </FooterFadeIn>

            {/* Prompt Selection Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>SELECT A QUESTION</Text>
                        <TouchableOpacity
                            onPress={() => setIsModalVisible(false)}
                            style={styles.closeBtn}
                        >
                            <MaterialIcons name="close" size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={PROMPTS_LIST}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.promptPickerItem}
                                onPress={() => confirmPromptSelection(item)}
                            >
                                <Text style={styles.promptPickerText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        style={styles.flex1}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    flex1: {
        flex: 1,
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    bgText: {
        position: 'absolute',
        fontFamily: 'Inter_900Black',
        fontSize: 100,
        color: COLORS.black,
        opacity: 0.03,
    },
    accentDot: {
        position: 'absolute',
        top: 120,
        right: 32,
        width: 12,
        height: 12,
        backgroundColor: '#1A1AFF',
        borderRadius: 6,
        zIndex: 0,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 40,
    },
    titleContainer: {
        marginBottom: SPACING.md,
        width: '100%',
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 72,
        lineHeight: 70,
        letterSpacing: -2,
        textTransform: 'uppercase',
        color: COLORS.text,
        paddingTop: Platform.OS === 'ios' ? 8 : 2,
        paddingBottom: 2,
        width: '100%',
    },
    accentBar: {
        width: 48,
        height: 6,
        backgroundColor: COLORS.primary,
        marginTop: SPACING.md,
        borderRadius: 3,
    },
    descContainer: {
        marginBottom: SPACING.xxl,
    },
    descText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: COLORS.gray,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    promptsContainer: {
        gap: SPACING.lg,
    },
    promptCard: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        padding: SPACING.lg,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    promptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    promptQuestion: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: COLORS.text,
        letterSpacing: 2,
        flex: 1,
        paddingRight: 8,
    },
    dimText: {
        color: 'rgba(0,0,0,0.3)',
    },
    editIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
        marginBottom: SPACING.md,
    },
    textInput: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: COLORS.text,
        minHeight: 40,
        textAlignVertical: 'top',
    },
    promptFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 10,
        color: COLORS.primary,
        flex: 1,
        marginRight: SPACING.md,
    },
    charCount: {
        fontFamily: 'Inter_900Black',
        fontSize: 8,
        color: 'rgba(0,0,0,0.15)',
        textAlign: 'right',
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.surface,
        paddingTop: SPACING.lg,
    },
    btnContinue: {
        width: '100%',
        backgroundColor: COLORS.black,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 0,
    },
    btnDisabled: {
        opacity: 0.3,
    },
    btnText: {
        fontFamily: 'Inter_700Bold',
        color: COLORS.white,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginRight: SPACING.sm,
    },
    modalContent: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    modalTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 12,
        color: COLORS.text,
        letterSpacing: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptPickerItem: {
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    promptPickerText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: COLORS.text,
    },
});

export default ProfilePromptsScreen;
