import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    Platform,
    TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import PremiumOptionRow from '../components/PremiumOptionRow';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { STEP_ORDER, STEP_CONFIG } from '../constants/steps';
import SkipButton from '../components/SkipButton';

// ---------------------------------------------------------------------------
// PronounsScreen
// ---------------------------------------------------------------------------
interface PronounsScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const PRONOUN_OPTIONS = [
    { id: 'HE / HIM', label: 'HE / HIM' },
    { id: 'SHE / HER', label: 'SHE / HER' },
    { id: 'THEY / THEM', label: 'THEY / THEM' },
    { id: 'HE / THEY', label: 'HE / THEY' },
    { id: 'SHE / THEY', label: 'SHE / THEY' },
    { id: 'PREFER NOT TO SAY', label: 'PREFER NOT TO SAY' }
];

const PronounsScreen: React.FC<PronounsScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();

    const [selectedPronouns, setSelectedPronouns] = useState<string[]>(state.pronouns || []);
    const [customPronoun, setCustomPronoun] = useState('');

    const currentIndex = STEP_ORDER.indexOf('pronouns');
    const totalSteps = STEP_ORDER.length;

    // Dynamically get required state from config
    const stepConfig = STEP_CONFIG.find(s => s.id === 'pronouns');
    const isRequired = stepConfig?.required ?? true;

    const togglePronoun = (pronoun: string) => {
        if (selectedPronouns.includes(pronoun)) {
            setSelectedPronouns(selectedPronouns.filter(p => p !== pronoun));
        } else {
            if (pronoun === 'PREFER NOT TO SAY') {
                setSelectedPronouns(['PREFER NOT TO SAY']);
                setCustomPronoun('');
            } else {
                const newSelection = selectedPronouns.filter(p => p !== 'PREFER NOT TO SAY');
                newSelection.push(pronoun);
                setSelectedPronouns(newSelection);
            }
        }
    };

    const handleNext = () => {
        const finalPronouns = [...selectedPronouns];
        if (customPronoun.trim().length > 0) {
            finalPronouns.push(customPronoun.trim().toUpperCase());
        }

        if (finalPronouns.length === 0) return;

        dispatch({ type: 'SET_FIELD', field: 'pronouns', value: finalPronouns });
        onNext();
    };

    const handleSkip = () => {
        // Skip behavior behaves exactly like continue, but without saving required input
        onNext();
    };

    const hasInput = selectedPronouns.length > 0 || customPronoun.trim().length > 0;

    // For optional steps, we allow continuing even without input
    const canProceed = isRequired ? hasInput : true;

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    return (
        <View style={styles.container}>
            <StepIndicator
                currentIndex={currentIndex}
                totalSteps={totalSteps}
                onBack={onBack}
            />

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.mainContent}>
                    {/* Title */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            allowFontScaling={false}
                        >
                            PRONOUNS
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Subtitle */}
                    <FadeUpView delay={300}>
                        <Text style={styles.subtitle}>How do you identify?</Text>
                    </FadeUpView>

                    {/* Options */}
                    <FadeUpView delay={450} style={styles.optionsList}>
                        {PRONOUN_OPTIONS.map((opt) => (
                            <PremiumOptionRow
                                key={opt.id}
                                label={opt.label}
                                selected={selectedPronouns.includes(opt.id)}
                                onPress={() => togglePronoun(opt.id)}
                            />
                        ))}
                    </FadeUpView>

                    {/* Custom Input */}
                    <FadeUpView delay={800} style={styles.customContainer}>
                        <Text style={styles.customLabel}>OR ENTER CUSTOM</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type your own..."
                            placeholderTextColor="rgba(0,0,0,0.15)"
                            value={customPronoun}
                            onChangeText={(text) => {
                                setCustomPronoun(text);
                                if (text.length > 0 && selectedPronouns.includes('PREFER NOT TO SAY')) {
                                    setSelectedPronouns([]);
                                }
                            }}
                            autoCapitalize="characters"
                            selectionColor={COLORS.primary}
                        />
                    </FadeUpView>
                </View>
            </ScrollView>

            {/* Footer */}
            <FooterFadeIn
                delay={900}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnContinue, !canProceed && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!canProceed}
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
    scrollContent: {
        paddingBottom: 160,
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
    subtitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: SPACING.xxl,
    },
    optionsList: {
        gap: SPACING.md,
    },
    customContainer: {
        marginTop: 40,
    },
    customLabel: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: 'rgba(0,0,0,0.3)',
        letterSpacing: 2,
        marginBottom: 12,
    },
    textInput: {
        fontFamily: 'Inter_900Black',
        fontSize: 18,
        color: COLORS.text,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(0,0,0,0.15)',
        letterSpacing: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.surface,
        paddingTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
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

export default PronounsScreen;
