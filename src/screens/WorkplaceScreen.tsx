import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Easing,
    ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import { STEP_ORDER, STEP_CONFIG } from '../constants/steps';
import SkipButton from '../components/SkipButton';
import { validateTextField, sanitizeInput } from '../utils/inputValidation';

// ---------------------------------------------------------------------------
// WorkplaceScreen
// ---------------------------------------------------------------------------
interface WorkplaceScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const WorkplaceScreen: React.FC<WorkplaceScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [workplace, setWorkplace] = useState(state.workplace || '');

    const currentIndex = STEP_ORDER.indexOf('workplace');
    const totalSteps = STEP_ORDER.length;

    const stepConfig = STEP_CONFIG.find(s => s.id === 'workplace');
    const isRequired = stepConfig?.required ?? false;

    const validation = validateTextField(workplace, 100, !isRequired);
    const canContinue = validation.isValid;

    const handleNext = async () => {
        if (!canContinue) return;
        const value = sanitizeInput(workplace);
        try {
            await saveField({ workplace: value }); } catch {
            // Save is best-effort; user proceeds regardless
        }
        dispatch({ type: 'SET_FIELD', field: 'workplace', value });
        onNext();
    };

    const handleSkip = async () => {
        try {
            await saveField({ workplace: null }); } catch {
            // Save is best-effort; user proceeds regardless
        }
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
                <View style={styles.mainContent}>
                    {/* Title - Local implementation to prevent breaking and clipping */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            allowFontScaling={false}
                        >
                            WORKPLACE
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Input */}
                    <FadeUpView delay={350}>
                        <Text style={styles.inputLabel}>Where do you work?</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Company or Role"
                            placeholderTextColor={COLORS.gray}
                            value={workplace}
                            onChangeText={setWorkplace}
                            autoFocus
                            autoCapitalize="words"
                            selectionColor={COLORS.primary}
                            accessibilityLabel="Workplace input"
                        />
                        {workplace.length > 0 && !validation.isValid ? (
                            <Text style={styles.errorText}>{validation.error}</Text>
                        ) : (
                            <Text style={styles.helperText}>
                                Optional. Share your professional side.
                            </Text>
                        )}
                    </FadeUpView>

                </View>
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
                            opacity: workplace.trim().length > 0 ? 1 : 0,
                            pointerEvents: workplace.trim().length > 0 ? 'auto' : 'none'
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    flex1: {
        flex: 1,
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
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
    inputLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: SPACING.sm,
    },
    input: {
        width: '100%',
        fontFamily: 'Inter_500Medium',
        borderWidth: 2,
        borderColor: COLORS.black,
        paddingVertical: 20,
        paddingHorizontal: 24,
        fontSize: 24,
        color: COLORS.black,
    },
    helperText: {
        fontFamily: 'Inter_400Regular',
        marginTop: SPACING.sm,
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        marginTop: SPACING.sm,
        fontSize: 14,
        color: COLORS.primary,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        zIndex: 10,
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

export default WorkplaceScreen;
