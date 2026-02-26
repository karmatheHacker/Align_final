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
import { STEP_ORDER } from '../constants/steps';

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
    const [workplace, setWorkplace] = useState(state.workplace || '');

    const currentIndex = STEP_ORDER.indexOf('workplace');
    const totalSteps = STEP_ORDER.length;

    const handleNext = () => {
        dispatch({ type: 'SET_FIELD', field: 'workplace', value: workplace.trim() });
        onNext();
    };

    const handleSkip = () => {
        dispatch({ type: 'SET_FIELD', field: 'workplace', value: null });
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
                        <Text style={styles.helperText}>
                            Optional. Share your professional side.
                        </Text>
                    </FadeUpView>

                </View>
            </KeyboardAvoidingView>

            {/* Footer */}
            <FooterFadeIn
                delay={650}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={styles.btnContinue}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={20} color={COLORS.white} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSkip}
                    style={styles.skipBtn}
                >
                    <Text style={styles.skipText}>SKIP FOR NOW</Text>
                </TouchableOpacity>
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
    btnText: {
        fontFamily: 'Inter_700Bold',
        color: COLORS.white,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginRight: SPACING.sm,
    },
    skipBtn: {
        alignItems: 'center',
        marginTop: SPACING.lg,
        paddingVertical: SPACING.sm,
    },
    skipText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.gray,
        letterSpacing: 1.5,
    },
});

export default WorkplaceScreen;
