import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

interface PremiumOptionRowProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    style?: ViewStyle | ViewStyle[];
    activeColor?: string;
    onInfoPress?: () => void;
}

const triggerLight = async () => {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) { }
};

const PremiumOptionRow: React.FC<PremiumOptionRowProps> = memo(({
    label,
    selected,
    onPress,
    style,
    activeColor = COLORS.black,
    onInfoPress
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

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

    return (
        <TouchableOpacity
            onPress={() => { triggerLight(); onPress(); }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={style}
        >
            <Animated.View
                style={[
                    styles.optionBtn,
                    selected && styles.optionBtnSelected,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                <View style={styles.optionInfo}>
                    <Text style={[
                        styles.optionText,
                        selected && styles.optionTextSelected
                    ]}>
                        {label}
                    </Text>
                </View>
                <View style={[
                    styles.radioRing,
                    selected && styles.radioRingSelected
                ]}>
                    {selected && <View style={styles.radioDot} />}
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
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
});

export default PremiumOptionRow;
