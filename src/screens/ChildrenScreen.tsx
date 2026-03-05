import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
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
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';

interface ChildrenScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const ChildrenScreen: React.FC<ChildrenScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [children, setChildren] = useState<string | null>(state.children || null);

    const currentIndex = STEP_ORDER.indexOf('children');
    const totalSteps = STEP_ORDER.length;

    const handleNext = async () => {
        if (!children) return;
        try {
            await saveField({ children: children });
        } catch (error) {
            console.error("Failed to save children preference:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'children', value: children });
        onNext();
    };

    const handleSkip = async () => {
        try {
            await saveField({ children: null });
        } catch (error) {
            console.error("Failed to save children skip:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'children', value: null });
        onNext();
    };

    const options = [
        { id: 'want_someday', label: 'Want Someday' },
        { id: 'dont_want', label: "Don't Want" },
        { id: 'have_and_want_more', label: 'Have & Want More' },
        { id: 'have_and_dont_want_more', label: "Have & Don't Want More" },
        { id: 'not_sure', label: 'Not Sure' },
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
                    {/* Title */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text style={styles.title}>Your{'\n'}Plans</Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Subtitle */}
                    <FadeUpView delay={300}>
                        <Text style={styles.subtitle}>Regarding Children</Text>
                    </FadeUpView>

                    {/* Options */}
                    <FadeUpView delay={450} style={styles.optionsList}>
                        {options.map((opt) => (
                            <PremiumOptionRow
                                key={opt.id}
                                label={opt.label}
                                selected={children === opt.id}
                                onPress={() => setChildren(opt.id)}
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
                    style={[styles.btnContinue, !children && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!children}
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
    scrollContent: {
        paddingBottom: 160,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
    },
    titleContainer: {
        marginBottom: SPACING.md,
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
});

export default ChildrenScreen;
