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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
interface SchoolScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const SchoolScreen: React.FC<SchoolScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const [school, setSchool] = useState(state.school || '');

    const currentIndex = STEP_ORDER.indexOf('school');
    const totalSteps = STEP_ORDER.length;

    const canContinue = school.trim().length > 0;

    const titleText = "INSTITUTION";
    const labelText = "Where did you study?"; 

    const handleNext = () => {
        if (!canContinue) return;
        dispatch({ type: 'SET_FIELD', field: 'school', value: school.trim() });
        onNext();
    };

    const handleSkip = () => {
        dispatch({ type: 'SET_FIELD', field: 'school', value: null });
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
                    {/* Title - Local implementation to fix clipping and prevent impact on other screens */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text 
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.6}
                            allowFontScaling={false}
                        >
                            {titleText}
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Input Area - Following user's new design snippet */}
                    <FadeUpView delay={350}>
                        <Text style={styles.inputLabel}>{labelText}</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="University or High School"
                                placeholderTextColor={COLORS.gray}
                                value={school}
                                onChangeText={setSchool}
                                autoFocus
                                autoCapitalize="words"
                                selectionColor={COLORS.primary}
                                accessibilityLabel="School input"
                            />
                        </View>
                        <Text style={styles.helperText}>
                            Education helps in finding common ground with other members.
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
                    style={[styles.btnContinue, !canContinue && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!canContinue}
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
        color: COLORS.gray,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: SPACING.sm,
    },
    inputWrapper: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderWidth: 2,
        borderColor: COLORS.black,
    },
    input: {
        width: '100%',
        fontFamily: 'Inter_600SemiBold',
        paddingVertical: 24,
        paddingHorizontal: 24,
        fontSize: 24,
        color: COLORS.text,
    },
    helperText: {
        fontFamily: 'Inter_400Regular',
        marginTop: SPACING.md,
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 22,
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

export default SchoolScreen;
