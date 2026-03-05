import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import PremiumOptionRow from '../components/PremiumOptionRow';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import { STEP_ORDER } from '../constants/steps';

// ---------------------------------------------------------------------------
// DrugsScreen
// ---------------------------------------------------------------------------
interface DrugsScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const DRUG_OPTIONS = [
    { id: 'frequently', label: 'Frequently' },
    { id: 'socially', label: 'Socially' },
    { id: 'rarely', label: 'Rarely' },
    { id: 'never', label: 'Never' },
];

const DrugsScreen: React.FC<DrugsScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [drugs, setDrugs] = useState<string | null>(state.drugs || null);

    const currentIndex = STEP_ORDER.indexOf('drugs');
    const totalSteps = STEP_ORDER.length;

    const handleNext = async () => {
        if (!drugs) return;
        try {
            await saveField({ drugs: drugs });
        } catch (error) {
            console.error("Failed to save drugs usage:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'drugs', value: drugs });
        onNext();
    };

    const handleSkip = async () => {
        try {
            await saveField({ drugs: null });
        } catch (error) {
            console.error("Failed to save drugs skip:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'drugs', value: null });
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

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
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
                            HABITS
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Subtitle */}
                    <FadeUpView delay={300}>
                        <Text style={styles.subtitle}>Do you use drugs?</Text>
                    </FadeUpView>

                    {/* Options */}
                    <FadeUpView delay={450} style={styles.optionsList}>
                        {DRUG_OPTIONS.map((opt) => (
                            <PremiumOptionRow
                                key={opt.id}
                                label={opt.label}
                                selected={drugs === opt.id}
                                onPress={() => setDrugs(opt.id)}
                            />
                        ))}
                    </FadeUpView>
                </View>
            </ScrollView>

            {/* Footer */}
            <FooterFadeIn
                delay={650}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnContinue, !drugs && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!drugs}
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
    skipBtn: {
        alignItems: 'center',
        marginTop: SPACING.lg,
    },
    skipText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.gray,
        letterSpacing: 1.5,
    },
});

export default DrugsScreen;
