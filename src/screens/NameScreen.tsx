import React, { useState } from 'react';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER } from '../constants/steps';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { validateName, sanitizeInput } from '../utils/inputValidation';

interface NameScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const NameScreen: React.FC<NameScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const [firstName, setFirstName] = useState(state.firstName || '');

    const currentIndex = STEP_ORDER.indexOf('name');
    const totalSteps = STEP_ORDER.length;

    const validation = validateName(firstName);
    const canContinue = validation.isValid;

    const handleNext = () => {
        if (!canContinue) return;
        dispatch({ type: 'SET_FIELD', field: 'firstName', value: sanitizeInput(firstName) });
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
                    {/* Title */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text style={styles.title}>Your{'\n'}Name</Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Input */}
                    <FadeUpView delay={350}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Alexander"
                            placeholderTextColor={COLORS.gray}
                            value={firstName}
                            onChangeText={setFirstName}
                            autoFocus
                            autoCapitalize="words"
                            selectionColor={COLORS.primary}
                            accessibilityLabel="First name"
                        />
                        {firstName.length > 0 && !validation.isValid ? (
                            <Text style={styles.errorText}>
                                {validation.error}
                            </Text>
                        ) : (
                            <Text style={styles.helperText}>
                                Please use your legal name as it appears on your ID.
                            </Text>
                        )}
                    </FadeUpView>
                </View>
            </KeyboardAvoidingView>

            {/* Footer */}
            <FooterFadeIn
                delay={500}
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
        paddingHorizontal: SPACING.lg,
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
        color: COLORS.primary, // Using primary color (red/peach) for error
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
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

export default NameScreen;
