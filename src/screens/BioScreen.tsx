import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    Platform,
    Easing,
    TextInput,
    KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER, STEP_CONFIG } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import SkipButton from '../components/SkipButton';
import { validateBio, sanitizeInput } from '../utils/inputValidation';

const BioScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { state, dispatch } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [publicBio, setPublicBio] = useState(state.publicBio || '');
    const [aiBio, setAiBio] = useState(state.aiBio || '');
    const [publicFocused, setPublicFocused] = useState(false);
    const [aiFocused, setAiFocused] = useState(false);

    const currentIndex = STEP_ORDER.indexOf('bio');
    const totalSteps = STEP_ORDER.length;

    const stepConfig = STEP_CONFIG.find(s => s.id === 'bio');
    const isRequired = stepConfig?.required ?? false;

    const publicValidation = validateBio(publicBio, 300, !isRequired);
    const aiValidation = validateBio(aiBio, 500, !isRequired);

    const canContinue = publicValidation.isValid && aiValidation.isValid;

    const handleNext = async () => {
        if (!canContinue) return;
        const sanitizedPublicBio = sanitizeInput(publicBio);
        const sanitizedAiBio = sanitizeInput(aiBio);

        // Fire and forget save to Convex
        saveField({ publicBio: sanitizedPublicBio, aiBio: sanitizedAiBio }).catch(error => {
            console.error("Failed to save bios:", error);
        });

        dispatch({ type: 'SET_FIELD', field: 'publicBio', value: sanitizedPublicBio });
        dispatch({ type: 'SET_FIELD', field: 'aiBio', value: sanitizedAiBio });
        onNext();
    };

    const handleSkip = async () => {
        // Fire and forget save to Convex
        saveField({ publicBio: null, aiBio: null }).catch(error => {
            console.error("Failed to save bio skip:", error);
        });
        onNext();
    };

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    return (
        <View style={styles.container}>
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
                        {/* Title - Local implementation for perfect rendering */}
                        <FadeUpView delay={200} style={styles.titleContainer}>
                            <Text
                                style={styles.title}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                allowFontScaling={false}
                            >
                                Biography
                            </Text>
                            <View style={styles.accentBar} />
                        </FadeUpView>

                        {/* Public Bio */}
                        <FadeUpView delay={350} style={styles.section}>
                            <View style={styles.labelRow}>
                                <Text style={styles.inputLabel}>Public Bio</Text>
                                <Text style={styles.labelSub}>Shown to matches</Text>
                            </View>
                            <View style={[
                                styles.textAreaBox,
                                publicFocused && styles.textAreaBoxActive
                            ]}>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="I'm a coffee enthusiast who loves Sunday morning hikes..."
                                    placeholderTextColor={COLORS.gray}
                                    multiline
                                    maxLength={300}
                                    value={publicBio}
                                    onChangeText={setPublicBio}
                                    onFocus={() => setPublicFocused(true)}
                                    onBlur={() => setPublicFocused(false)}
                                    textAlignVertical="top"
                                    selectionColor={COLORS.primary}
                                />
                                <View style={styles.footerRow}>
                                    {publicBio.length > 0 && !publicValidation.isValid ? (
                                        <Text style={styles.errorText}>{publicValidation.error}</Text>
                                    ) : <View style={{ flex: 1 }} />}
                                    <View style={styles.countWrapper}>
                                        <Text style={styles.countText}>{publicBio.length}/300</Text>
                                    </View>
                                </View>
                            </View>
                        </FadeUpView>

                        {/* AI Bio */}
                        <FadeUpView delay={500} style={styles.section}>
                            <View style={styles.labelRow}>
                                <View style={styles.aiLabelRow}>
                                    <Text style={styles.inputLabel}>Matchmaker AI Bio</Text>
                                    <View style={styles.privateBadge}>
                                        <Text style={styles.privateBadgeText}>SECURE</Text>
                                    </View>
                                </View>
                                <Text style={styles.labelSub}>Private</Text>
                            </View>
                            <Text style={styles.aiHelper}>
                                Tell our agent exactly what you're looking for. Values, lifestyle, or dealbreakers.
                            </Text>
                            <View style={[
                                styles.textAreaBox,
                                aiFocused && styles.textAreaBoxActive
                            ]}>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Be specific about values, lifestyle, or your 'must-haves'..."
                                    placeholderTextColor={COLORS.gray}
                                    multiline
                                    maxLength={500}
                                    value={aiBio}
                                    onChangeText={setAiBio}
                                    onFocus={() => setAiFocused(true)}
                                    onBlur={() => setAiFocused(false)}
                                    textAlignVertical="top"
                                    selectionColor={COLORS.primary}
                                />
                                <View style={styles.footerRow}>
                                    {aiBio.length > 0 && !aiValidation.isValid ? (
                                        <Text style={styles.errorText}>{aiValidation.error}</Text>
                                    ) : <View style={{ flex: 1 }} />}
                                    <View style={styles.countWrapper}>
                                        <Text style={styles.countText}>{aiBio.length}/500</Text>
                                    </View>
                                </View>
                            </View>
                        </FadeUpView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <FooterFadeIn
                delay={650}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[
                        styles.btnContinue,
                        !canContinue && styles.btnDisabled,
                        {
                            opacity: (publicBio.trim().length > 0 || aiBio.trim().length > 0) ? 1 : 0,
                            pointerEvents: (publicBio.trim().length > 0 || aiBio.trim().length > 0) ? 'auto' : 'none'
                        }
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!canContinue}
                >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={20} color={COLORS.white} />
                </TouchableOpacity>

                {!isRequired && (
                    <SkipButton onPress={handleSkip} />
                )}
            </FooterFadeIn>
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
    scrollContent: {
        paddingBottom: 40,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 40,
    },
    titleContainer: {
        marginBottom: SPACING.xxl,
        width: '100%',
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 72,
        lineHeight: 84,
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
    section: {
        marginBottom: SPACING.xl,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: SPACING.sm,
    },
    inputLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 10,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    labelSub: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 10,
        color: COLORS.gray,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    aiLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    privateBadge: {
        backgroundColor: COLORS.text,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    privateBadgeText: {
        fontFamily: 'Inter_900Black',
        fontSize: 8,
        color: COLORS.white,
    },
    aiHelper: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: COLORS.gray,
        marginBottom: SPACING.md,
        lineHeight: 20,
    },
    textAreaBox: {
        borderWidth: 2,
        borderColor: COLORS.text,
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: SPACING.md,
        minHeight: 140,
    },
    textAreaBoxActive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.text,
    },
    textArea: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: COLORS.text,
        lineHeight: 24,
        flex: 1,
    },
    footerRow: {
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
    countWrapper: {
        alignItems: 'flex-end',
    },
    countText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.gray,
        letterSpacing: 1,
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
});

export default BioScreen;
