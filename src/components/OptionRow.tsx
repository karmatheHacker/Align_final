import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

interface OptionRowProps {
    label: string;
    description?: string;
    selected: boolean;
    onPress: () => void;
    variant?: 'radio' | 'checkbox';
    activeColor?: string;
    style?: ViewStyle | ViewStyle[];
    labelStyle?: TextStyle | TextStyle[];
}

const triggerLight = async () => {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { /* Haptics unavailable on this device — silently ignore */ }
};

const OptionRow: React.FC<OptionRowProps> = memo(({
    label,
    description,
    selected,
    onPress,
    variant = 'radio',
    activeColor = COLORS.black,
    style,
    labelStyle
}) => {
    // ─── NATIVE-DRIVER animations: transform + opacity only ───────────────────
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const selectionAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

    // ─── JS-DRIVER animations: shadow/elevation only ──────────────────────────
    const shadowAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

    // ── selectionAnim: drives radio dot / checkbox scale+opacity (native) ─────
    useEffect(() => {
        Animated.timing(selectionAnim, {
            toValue: selected ? 1 : 0,
            duration: 250,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
            useNativeDriver: true,
        }).start();
    }, [selected, selectionAnim]);

    // ── scaleAnim: selection pulse (native) ───────────────────────────────────
    useEffect(() => {
        if (selected) {
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1.02,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 6,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1.0,
                    useNativeDriver: true,
                    speed: 50,
                    bounciness: 0,
                }),
            ]).start();
        }
    }, [selected, scaleAnim]);

    // ── shadowAnim: shadow/elevation (JS-driver only, fully isolated) ─────────
    useEffect(() => {
        Animated.timing(shadowAnim, {
            toValue: selected ? 1 : 0,
            duration: selected ? 200 : 150,
            useNativeDriver: false,
        }).start();
    }, [selected, shadowAnim]);

    const handlePressIn = () => {
        Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 100,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
        }).start();
    };

    const shadowOpacity = shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.08],
    });
    const elevation = shadowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 3],
    });

    return (
        <TouchableOpacity
            onPress={() => { triggerLight(); onPress(); }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            accessibilityRole={variant === 'checkbox' ? 'checkbox' : 'radio'}
            accessibilityState={{
                checked: variant === 'checkbox' ? selected : undefined,
                selected: variant === 'radio' ? selected : undefined
            }}
            style={style as any}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
                <Animated.View
                    style={[
                        styles.selectableOptionRow,
                        selected && styles.selectableOptionRowSelected,
                        selected && { shadowColor: '#000' },
                        description ? { paddingVertical: 20 } : null,
                        { shadowOpacity, elevation } as any,
                    ]}
                >
                    <View style={{ flex: 1, paddingRight: SPACING.md }}>
                        <Text style={[styles.selectableOptionLabel, labelStyle, selected && { color: activeColor }]}>
                            {label}
                        </Text>
                        {description && (
                            <Text style={styles.optionDescription}>
                                {description.split('Learn more')[0]}
                                <Text style={{ color: activeColor, fontFamily: 'Inter_600SemiBold' }}>Learn more</Text>
                            </Text>
                        )}
                    </View>
                    {variant === 'radio' && (
                        <View style={[styles.radioCircle, selected && { borderColor: activeColor }]}>
                            <Animated.View
                                style={[
                                    styles.radioDot,
                                    {
                                        backgroundColor: activeColor,
                                        transform: [{ scale: selectionAnim }],
                                        opacity: selectionAnim
                                    }
                                ]}
                            />
                        </View>
                    )}
                    {variant === 'checkbox' && (
                        <View style={[styles.customCheckbox, selected && { backgroundColor: activeColor, borderColor: activeColor }]}>
                            {selected && (
                                <Animated.View style={{ transform: [{ scale: selectionAnim }] }}>
                                    <Feather name="check" size={16} color={COLORS.white} />
                                </Animated.View>
                            )}
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    selectableOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 24, // Matches SPACING.lg
        paddingHorizontal: 16, // Matches SPACING.md
        minHeight: 64,
        borderColor: 'transparent',
        borderRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
    },
    selectableOptionRowSelected: {
        backgroundColor: COLORS.white,
    },
    selectableOptionLabel: {
        fontFamily: 'Inter_500Medium',
        fontSize: 17,
        color: COLORS.text,
        letterSpacing: -0.2,
    },
    optionDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4, // Matches SPACING.xs
        lineHeight: 22,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.black,
    },
    customCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
});

export default OptionRow;
