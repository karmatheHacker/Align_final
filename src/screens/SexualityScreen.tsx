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
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';

interface SexualityScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const SexualityScreen: React.FC<SexualityScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [selectedSexuality, setSelectedSexuality] = useState<string | null>(state.sexuality || null);

    const currentIndex = STEP_ORDER.indexOf('sexuality');
    const totalSteps = STEP_ORDER.length;

    const handleNext = async () => {
        if (!selectedSexuality) return;
        try {
            await saveField({ sexuality: selectedSexuality }); } catch {
            // Save is best-effort; user proceeds regardless
        }
        dispatch({ type: 'SET_FIELD', field: 'sexuality', value: selectedSexuality });
        onNext();
    };

    const options = [
        { id: 'straight', label: 'Straight' },
        { id: 'gay', label: 'Gay' },
        { id: 'lesbian', label: 'Lesbian' },
        { id: 'bisexual', label: 'Bisexual' },
        { id: 'pansexual', label: 'Pansexual' },
        { id: 'queer', label: 'Queer' },
        { id: 'asexual', label: 'Asexual' },
        { id: 'demisexual', label: 'Demisexual' },
        { id: 'sapiosexual', label: 'Sapiosexual' },
        { id: 'heteroflexible', label: 'Heteroflexible' },
        { id: 'homoflexible', label: 'Homoflexible' },
        { id: 'polysexual', label: 'Polysexual' },
        { id: 'bicurious', label: 'Bicurious' },
        { id: 'questioning', label: 'Questioning' },
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
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            Sexuality
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Options */}
                    <FadeUpView delay={350} style={styles.optionsList}>
                        {options.map((opt) => {
                            const isSelected = selectedSexuality === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedSexuality(opt.id)}
                                    style={[
                                        styles.optionBtn,
                                        isSelected && styles.optionBtnSelected,
                                    ]}
                                >
                                    <View style={styles.optionInfo}>
                                        <Text style={[
                                            styles.optionText,
                                            isSelected && styles.optionTextSelected
                                        ]}>
                                            {opt.label}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.radioRing,
                                        isSelected && styles.radioRingSelected
                                    ]}>
                                        {isSelected && <View style={styles.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </FadeUpView>
                </View>
            </ScrollView>

            {/* Footer */}
            <FooterFadeIn
                delay={650}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnContinue, !selectedSexuality && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!selectedSexuality}
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
    optionsList: {
        gap: SPACING.md,
    },
    optionBtn: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderColor: COLORS.black,
        backgroundColor: 'transparent',
    },
    optionBtnSelected: {
        backgroundColor: COLORS.black,
    },
    optionInfo: {
        flex: 1,
        marginRight: 16,
    },
    optionText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    optionTextSelected: {
        color: COLORS.surface,
    },
    radioRing: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioRingSelected: {
        borderColor: COLORS.surface,
    },
    radioDot: {
        width: 11,
        height: 11,
        borderRadius: 5.5,
        backgroundColor: COLORS.surface,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
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

export default SexualityScreen;
