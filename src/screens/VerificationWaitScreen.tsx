import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

interface VerificationWaitScreenProps {
    onNext: () => void;
}

const VerificationWaitScreen: React.FC<VerificationWaitScreenProps> = ({ onNext }) => {
    const insets = useSafeAreaInsets();
    const progress = useRef(new Animated.Value(0)).current;

    // Spinning circle animation
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Pulsing dots
    const dot1 = useRef(new Animated.Value(1)).current;
    const dot2 = useRef(new Animated.Value(1)).current;
    const dot3 = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Progress bar
        Animated.timing(progress, {
            toValue: 1,
            duration: 3500, // Slightly longer for "premium" feel
            easing: Easing.linear,
            useNativeDriver: false,
        }).start(() => {
            onNext();
        });

        // Spinning circle
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulsing dots
        const pulse = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, { toValue: 1.5, duration: 450, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: true }),
                ])
            );
        pulse(dot1, 0).start();
        pulse(dot2, 150).start();
        pulse(dot3, 300).start();
    }, []);

    const barWidth = progress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.content, { paddingTop: insets.top + SPACING.xl }]}>
                {/* Top — Title */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        VERIFYING{'\n'}ACCOUNT.
                    </Text>
                    <View style={styles.accentBar} />
                </View>

                {/* Center — Spinning Circle + Dots */}
                <View style={styles.centerSection}>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
                        <View style={styles.spinnerNeedle} />
                    </Animated.View>

                    {/* Pulsing Dots */}
                    <View style={styles.dotsRow}>
                        <Animated.View style={[styles.dot, { backgroundColor: '#FFD600', transform: [{ scale: dot1 }] }]} />
                        <Animated.View style={[styles.dot, { backgroundColor: '#E03A2F', transform: [{ scale: dot2 }] }]} />
                        <Animated.View style={[styles.dot, { backgroundColor: '#00C853', transform: [{ scale: dot3 }] }]} />
                    </View>

                    <Text style={styles.statusLabel}>
                        SECURING YOUR DATA AND{'\n'}SETTING UP YOUR PROFILE SPACE
                    </Text>
                </View>

                {/* Bottom — Progress Bar */}
                <View style={styles.footer}>
                    <View style={styles.progressBarWrapper}>
                        <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
                    </View>
                    <Text style={styles.waitText}>
                        PLEASE WAIT
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface, // bg-cream
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: SPACING.xl,
    },
    header: {
        marginTop: 24,
    },
    title: {
        fontFamily: 'Inter_900Black',
        fontSize: 52,
        lineHeight: 52,
        color: COLORS.black,
        letterSpacing: -2,
        textTransform: 'uppercase',
    },
    accentBar: {
        width: 48,
        height: 6,
        backgroundColor: COLORS.primary,
        marginTop: SPACING.md,
        borderRadius: 3,
    },
    centerSection: {
        alignItems: 'center',
        gap: 32,
    },
    spinner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinnerNeedle: {
        width: 40,
        height: 2,
        backgroundColor: COLORS.black,
        position: 'absolute',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: COLORS.gray,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        marginBottom: SPACING.xl,
    },
    progressBarWrapper: {
        width: '100%',
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary, // ORANGE
        borderRadius: 2,
    },
    waitText: {
        fontFamily: 'Inter_900Black',
        fontSize: 11,
        color: COLORS.black,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginTop: 12,
    },
});

export default VerificationWaitScreen;
