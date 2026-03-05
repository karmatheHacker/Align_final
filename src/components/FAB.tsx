import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

interface FABProps {
    onPress: () => void;
    disabled?: boolean;
    hint?: string;
    style?: ViewStyle | ViewStyle[];
}

const FAB: React.FC<FABProps> = ({ onPress, disabled, hint, style }) => {
    const [showHint, setShowHint] = useState(false);
    // Hint tooltip opacity
    const hintOpacity = useRef(new Animated.Value(0)).current;
    // Press scale
    const pressScale = useRef(new Animated.Value(1)).current;

    const handleDisabledPress = () => {
        if (!hint) return;
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch { /* Haptics unavailable on this device — silently ignore */ }

        setShowHint(true);
        // Disabled FAB: show tooltip but NO scale animation
        Animated.sequence([
            Animated.timing(hintOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.delay(2000),
            Animated.timing(hintOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }),
        ]).start(() => setShowHint(false));
    };

    const handlePressIn = () => {
        if (disabled) return;
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch { /* Haptics unavailable on this device — silently ignore */ }

        Animated.spring(pressScale, {
            toValue: 0.92,
            useNativeDriver: true,
            speed: 50,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 40,
            bounciness: 6,
        }).start();
    };

    return (
        <View style={{ alignItems: 'center' }}>
            {showHint && (
                <Animated.View style={[styles.fabHint, { opacity: hintOpacity }]}>
                    <Text testID="fab-hint-text" style={styles.fabHintText}>{hint || "Please complete all fields"}</Text>
                </Animated.View>
            )}
            {/* Animated.View carries the scale; Pressable is the touch target */}
            <Animated.View style={{ transform: [{ scale: pressScale }] }}>
                <Pressable
                    testID="fab-button"
                    onPress={disabled ? handleDisabledPress : onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={[styles.fab, disabled && styles.fabDisabled, style]}
                    accessibilityRole="button"
                    accessibilityLabel={disabled ? hint : 'Continue to next step'}
                    accessibilityState={{ disabled }}
                >
                    <MaterialIcons
                        name="arrow-forward"
                        size={30}
                        color={COLORS.white}
                        style={{ opacity: disabled ? 0.3 : 1 }}
                    />
                </Pressable>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    fab: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    fabDisabled: {
        opacity: 0.3,
    },
    fabHint: {
        position: 'absolute',
        bottom: 80,
        backgroundColor: '#1F2937',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
        maxWidth: 220,
        alignItems: 'center',
        zIndex: 100,
    },
    fabHintText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: COLORS.white,
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default FAB;
