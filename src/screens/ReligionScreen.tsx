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
    ViewStyle,
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
// ReligionScreen
// ---------------------------------------------------------------------------
interface ReligionScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const ReligionScreen: React.FC<ReligionScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [religion, setReligion] = useState<string | null>(state.religion || null);

    const currentIndex = STEP_ORDER.indexOf('religion');
    const totalSteps = STEP_ORDER.length;

    const handleNext = async () => {
        if (!religion) return;
        try {
            await saveField({ religion: religion });
        } catch (error) {
            console.error("Failed to save religion:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'religion', value: religion });
        onNext();
    };

    const handleSkip = async () => {
        try {
            await saveField({ religion: null });
        } catch (error) {
            console.error("Failed to save religion skip:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'religion', value: null });
        onNext();
    };

    const options = [
        { id: 'agnostic', label: 'Agnostic' },
        { id: 'atheist', label: 'Atheist' },
        { id: 'buddhist', label: 'Buddhist' },
        { id: 'christian', label: 'Christian' },
        { id: 'hindu', label: 'Hindu' },
        { id: 'jewish', label: 'Jewish' },
        { id: 'muslim', label: 'Muslim' },
        { id: 'spiritual', label: 'Spiritual' },
        { id: 'other', label: 'Other' },
    ];

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
                    {/* Title - Local implementation to prevent breaking and clipping */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            allowFontScaling={false}
                        >
                            RELIGION
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Options */}
                    <FadeUpView delay={350} style={styles.optionsList}>
                        {options.map((opt) => (
                            <PremiumOptionRow
                                key={opt.id}
                                label={opt.label}
                                selected={religion === opt.id}
                                onPress={() => setReligion(opt.id)}
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
                    style={[styles.btnContinue, !religion && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!religion}
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

export default ReligionScreen;
