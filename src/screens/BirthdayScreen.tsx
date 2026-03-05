import React, { useState, useRef } from 'react';
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
import StepIndicator from '../components/StepIndicator';
import AgeConfirmationModal from '../components/AgeConfirmationModal';
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';

interface BirthdayScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const BirthdayScreen: React.FC<BirthdayScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [birthdayDigits, setBirthdayDigits] = useState<string[]>([]);

    const dayRef = useRef<TextInput>(null);
    const monthRef = useRef<TextInput>(null);
    const yearRef = useRef<TextInput>(null);

    const currentIndex = STEP_ORDER.indexOf('birthday');
    const totalSteps = STEP_ORDER.length;

    const getAge = (d: string, m: string, y: string) => {
        if (!d || !m || !y || y.length < 4) return 0;
        const birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        if (isNaN(birthDate.getTime())) return 0;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = getAge(day, month, year);
    const isValidDate = day.length > 0 && month.length > 0 && year.length === 4;
    const canContinue = isValidDate && age >= 18;

    const handleContinue = () => {
        if (!isValidDate) return;

        const paddedDay = day.padStart(2, '0');
        const paddedMonth = month.padStart(2, '0');
        const paddedYear = year.padStart(4, '0');

        const digits = [
            paddedDay[0], paddedDay[1],
            paddedMonth[0], paddedMonth[1],
            paddedYear[0], paddedYear[1], paddedYear[2], paddedYear[3]
        ];

        setBirthdayDigits(digits);
        setShowModal(true);
    };

    const handleConfirm = async () => {
        const birthdayStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        dispatch({ type: 'SET_FIELD', field: 'birthday', value: birthdayStr });

        // Fire and forget save to Convex
        saveField({ birthday: birthdayStr }).catch(error => {
            console.error("Failed to save birthday:", error);
        });

        setShowModal(false);
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
                        <Text style={styles.title}>Birthday</Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Input Grid */}
                    <FadeUpView delay={350} style={styles.gridContainer}>
                        <View style={styles.gridRow}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.dateLabel}>MM</Text>
                                <View style={styles.dateBox}>
                                    <TextInput
                                        ref={monthRef}
                                        style={styles.dateInput}
                                        placeholder="01"
                                        placeholderTextColor={COLORS.gray}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        value={month}
                                        onChangeText={(v) => {
                                            setMonth(v);
                                            if (v.length === 2) dayRef.current?.focus();
                                        }}
                                        selectionColor={COLORS.primary}
                                        autoFocus
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.dateLabel}>DD</Text>
                                <View style={styles.dateBox}>
                                    <TextInput
                                        ref={dayRef}
                                        style={styles.dateInput}
                                        placeholder="01"
                                        placeholderTextColor={COLORS.gray}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        value={day}
                                        onChangeText={(v) => {
                                            setDay(v);
                                            if (v.length === 2) yearRef.current?.focus();
                                        }}
                                        onKeyPress={({ nativeEvent }) => {
                                            if (nativeEvent.key === 'Backspace' && day === '') monthRef.current?.focus();
                                        }}
                                        selectionColor={COLORS.primary}
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, { flex: 1.2 }]}>
                                <Text style={styles.dateLabel}>YYYY</Text>
                                <View style={styles.dateBox}>
                                    <TextInput
                                        ref={yearRef}
                                        style={styles.dateInput}
                                        placeholder="2000"
                                        placeholderTextColor={COLORS.gray}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        value={year}
                                        onChangeText={setYear}
                                        onKeyPress={({ nativeEvent }) => {
                                            if (nativeEvent.key === 'Backspace' && year === '') dayRef.current?.focus();
                                        }}
                                        selectionColor={COLORS.primary}
                                    />
                                </View>
                            </View>
                        </View>
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
                            opacity: (month.trim().length > 0 || day.trim().length > 0 || year.trim().length > 0) ? 1 : 0,
                            pointerEvents: (month.trim().length > 0 || day.trim().length > 0 || year.trim().length > 0) ? 'auto' : 'none'
                        }
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!canContinue}
                >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={20} color={COLORS.white} />
                </TouchableOpacity>
            </FooterFadeIn>

            <AgeConfirmationModal
                visible={showModal}
                digits={birthdayDigits}
                ageError={isValidDate && age < 18 ? "You must be at least 18 years old." : undefined}
                onEdit={() => setShowModal(false)}
                onConfirm={handleConfirm}
            />
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
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
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
    gridContainer: {
        marginBottom: SPACING.xl,
    },
    gridRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    inputGroup: {
        flex: 1,
    },
    dateLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.gray,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: SPACING.sm,
    },
    dateBox: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderWidth: 2,
        borderColor: COLORS.black,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateInput: {
        width: '100%',
        textAlign: 'center',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 24,
        color: COLORS.black,
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

export default BirthdayScreen;
