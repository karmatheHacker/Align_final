import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    Platform,
    Dimensions,
    Easing,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// PoliticsScreen
// ---------------------------------------------------------------------------
interface PoliticsScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const POLITICS_OPTIONS = [
    { id: 'liberal', label: 'Liberal' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'conservative', label: 'Conservative' },
    { id: 'apolitical', label: 'Apolitical' },
    { id: 'other', label: 'Other' }
];

const PoliticsScreen: React.FC<PoliticsScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [politics, setPolitics] = useState<string | null>(state.politics || null);

    const currentIndex = STEP_ORDER.indexOf('politics');
    const totalSteps = STEP_ORDER.length;

    const bgDriftY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgDriftY, { toValue: -15, duration: 10000, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(bgDriftY, { toValue: 0, duration: 10000, easing: Easing.linear, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleNext = async () => {
        if (!politics) return;
        try {
            await saveField({ politics: politics });
        } catch (error) {
            console.error("Failed to save politics:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'politics', value: politics });
        onNext();
    };

    const handleSkip = async () => {
        try {
            await saveField({ politics: null });
        } catch (error) {
            console.error("Failed to save politics skip:", error);
        }
        dispatch({ type: 'SET_FIELD', field: 'politics', value: null });
        onNext();
    };

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    return (
        <View style={styles.container}>
            {/* Background Text Layer */}
            <View style={styles.bgOverlay} pointerEvents="none">
                <Animated.Text style={[styles.bgText, { top: 80, left: -20, transform: [{ rotate: '-6deg' }, { translateY: bgDriftY }] }]}>
                    VIEWS
                </Animated.Text>
                <Animated.Text style={[styles.bgText, { top: 300, right: -30, fontSize: 90, transform: [{ rotate: '4deg' }, { translateY: bgDriftY }] }]}>
                    STANCE
                </Animated.Text>
            </View>

            {/* Accent Dot */}
            <View style={styles.accentDot} />

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
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                            allowFontScaling={false}
                        >
                            POLITICAL VIEWS?
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Subtitle */}
                    <FadeUpView delay={300}>
                        <Text style={styles.subtitle}>Share your political standing.</Text>
                    </FadeUpView>

                    {/* Options */}
                    <FadeUpView delay={450} style={styles.optionsList}>
                        {POLITICS_OPTIONS.map((opt) => (
                            <PremiumOptionRow
                                key={opt.id}
                                label={opt.label}
                                selected={politics === opt.id}
                                onPress={() => setPolitics(opt.id)}
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
                    style={[styles.btnContinue, !politics && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!politics}
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
        backgroundColor: COLORS.surface, // bg-cream
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
        fontSize: 110,
        color: COLORS.black,
        opacity: 0.03,
    },
    accentDot: {
        position: 'absolute',
        top: 128,
        right: 40,
        width: 12,
        height: 12,
        backgroundColor: '#E03A2F',
        borderRadius: 6,
        zIndex: 0,
    },
    scrollContent: {
        paddingBottom: 160,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 40,
        zIndex: 10,
    },
    titleContainer: {
        marginBottom: SPACING.xxl,
        width: '100%',
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 48,
        lineHeight: 52,
        letterSpacing: -1,
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

export default PoliticsScreen;
