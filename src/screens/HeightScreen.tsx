import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
    Easing,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { STEP_ORDER } from '../constants/steps';
import OnboardingHeading from '../components/OnboardingHeading';

// ---------------------------------------------------------------------------
// Scroll Picker Column
// ---------------------------------------------------------------------------
interface PickerColumnProps {
    options: number[];
    selectedValue: number;
    onSelect: (value: number) => void;
    label?: string;
    itemHeight?: number;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ options, selectedValue, onSelect, label, itemHeight = 64 }) => {
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);
    const [boxHeight, setBoxHeight] = useState(240);
    const padding = (boxHeight - itemHeight) / 2;

    useEffect(() => {
        const index = options.indexOf(selectedValue);
        if (index !== -1 && boxHeight > 0) {
            scrollRef.current?.scrollTo({ y: index * itemHeight, animated: false });
        }
    }, [options, boxHeight, selectedValue, itemHeight]);

    const onMomentumScrollEnd = (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / itemHeight);
        if (options[index] !== undefined) {
            onSelect(options[index]);
        }
    };

    const onBoxLayout = (event: any) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) setBoxHeight(height);
    };

    return (
        <View style={styles.pickerColumn}>
            {label && <Text style={styles.columnLabel}>{label}</Text>}
            <View style={styles.pickerBox} onLayout={onBoxLayout}>
                <Animated.ScrollView
                    ref={scrollRef as any}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: padding }}
                >
                    {options.map((item, index) => {
                        const inputRange = [
                            (index - 1) * itemHeight,
                            index * itemHeight,
                            (index + 1) * itemHeight,
                        ];
                        const opacity = scrollY.interpolate({
                            inputRange,
                            outputRange: [0.15, 1, 0.15],
                            extrapolate: 'clamp',
                        });
                        const scale = scrollY.interpolate({
                            inputRange,
                            outputRange: [0.8, 1.15, 0.8],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[styles.pickerItem, { height: itemHeight, opacity, transform: [{ scale }] }]}
                            >
                                <Text style={styles.pickerText}>{item}</Text>
                            </Animated.View>
                        );
                    })}
                </Animated.ScrollView>
                <View style={[styles.selectionOverlay, { height: itemHeight, marginTop: -itemHeight / 2 }]} pointerEvents="none" />
            </View>
        </View>
    );
};

// ---------------------------------------------------------------------------
// HeightScreen
// ---------------------------------------------------------------------------
interface HeightScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const HeightScreen: React.FC<HeightScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();

    const [unit, setUnit] = useState<'FT' | 'CM'>(state.height?.unit || 'FT');
    const [feet, setFeet] = useState(Math.floor((state.height?.value || 70) / 12));
    const [inches, setInches] = useState((state.height?.value || 70) % 12);
    const [cm, setCm] = useState(state.height?.unit === 'CM' ? state.height.value : 178);

    const currentIndex = STEP_ORDER.indexOf('height');
    const totalSteps = STEP_ORDER.length;

    const handleNext = () => {
        const value = unit === 'FT' ? (feet * 12) + Number(inches) : cm;
        dispatch({ type: 'SET_FIELD', field: 'height', value: { value, unit } });
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

            <View style={styles.flex1}>
                <View style={styles.mainContent}>
                    {/* Title */}
                    <OnboardingHeading title="HEIGHT" delay={200} />

                    {/* Unit Toggle */}
                    <FadeUpView delay={350} style={styles.unitSelector}>
                        <TouchableOpacity
                            onPress={() => setUnit('FT')}
                            activeOpacity={0.7}
                            style={[styles.optionCard, unit === 'FT' && styles.optionCardSelected]}
                        >
                            <Text style={[styles.optionLabel, unit === 'FT' && styles.optionLabelSelected]}>FT / IN</Text>
                            <View style={[styles.radioRing, unit === 'FT' && styles.radioRingSelected]}>
                                {unit === 'FT' && <View style={styles.radioDot} />}
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setUnit('CM')}
                            activeOpacity={0.7}
                            style={[styles.optionCard, unit === 'CM' && styles.optionCardSelected]}
                        >
                            <Text style={[styles.optionLabel, unit === 'CM' && styles.optionLabelSelected]}>CM</Text>
                            <View style={[styles.radioRing, unit === 'CM' && styles.radioRingSelected]}>
                                {unit === 'CM' && <View style={styles.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    </FadeUpView>

                    {/* Picker Matrix */}
                    <FadeUpView delay={500} style={styles.pickerMatrix}>
                        {unit === 'FT' ? (
                            <>
                                <PickerColumn
                                    label="FEET"
                                    options={[4, 5, 6, 7]}
                                    selectedValue={feet}
                                    onSelect={setFeet}
                                />
                                <PickerColumn
                                    label="INCHES"
                                    options={Array.from({ length: 12 }, (_, i) => i)}
                                    selectedValue={inches}
                                    onSelect={setInches}
                                />
                            </>
                        ) : (
                            <PickerColumn
                                label="CENTIMETERS"
                                options={Array.from({ length: 91 }, (_, i) => i + 120)}
                                selectedValue={cm}
                                onSelect={setCm}
                            />
                        )}
                    </FadeUpView>
                </View>
            </View>

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
        paddingHorizontal: SPACING.xl,
    },
    unitSelector: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    optionCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: COLORS.text,
        backgroundColor: 'transparent',
    },
    optionCardSelected: {
        backgroundColor: COLORS.text,
    },
    optionLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 12,
        color: COLORS.text,
        letterSpacing: 1,
    },
    optionLabelSelected: {
        color: COLORS.surface,
    },
    radioRing: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.text,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioRingSelected: {
        borderColor: COLORS.surface,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.surface,
    },
    pickerMatrix: {
        flexDirection: 'row',
        gap: SPACING.md,
        flex: 1,
    },
    pickerColumn: {
        flex: 1,
        alignItems: 'stretch',
    },
    columnLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 10,
        color: COLORS.gray,
        letterSpacing: 1.5,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    pickerBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderWidth: 2,
        borderColor: COLORS.text,
        overflow: 'hidden',
    },
    pickerItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 32,
        color: COLORS.text,
    },
    selectionOverlay: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: COLORS.text,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
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
});

export default HeightScreen;
