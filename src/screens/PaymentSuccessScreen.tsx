import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import COLORS from '../constants/colors';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const { width } = Dimensions.get('window');

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentSuccessScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const marqueeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Hero animations
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        // Infinite marquee background loop
        Animated.loop(
            Animated.timing(marqueeAnim, {
                toValue: -width,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();
    }, []);

    const handleExplore = () => {
        // Can route wherever appropriate for exploring premium mode
        navigation.navigate('Home');
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            {/* ── Background Marquee ────────────────────────────────────────── */}
            <View style={styles.marqueeContainer}>
                <Animated.View style={[styles.marqueeRow, { transform: [{ translateX: marqueeAnim }] }]}>
                    <Text style={styles.marqueeText}>
                        UNLOCKED · PREMIUM · UNLOCKED · PREMIUM ·
                    </Text>
                </Animated.View>
            </View>

            <View style={{ flex: 1, justifyContent: 'space-between', paddingBottom: Math.max(insets.bottom, 24) }}>

                {/* ── Header ────────────────────────────────────────────────── */}
                <View style={[styles.headerBlock, { paddingTop: insets.top + 32 }]}>
                    <Text style={styles.heroTitle}>
                        PREMIUM{'\n'}ACTIVE.
                    </Text>
                </View>

                {/* ── Center Visual checkmark ───────────────────────────────── */}
                <Animated.View style={[styles.centerVisual, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    <View style={styles.accentDot} />
                    <View style={styles.checkmarkBadge}>
                        <MaterialIcons name="check" size={100} color="#FFFFFF" />
                    </View>
                </Animated.View>

                {/* ── Info & Action Button ──────────────────────────────────── */}
                <Animated.View style={[styles.footerBlock, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
                    <View style={styles.footerInfoBox}>
                        <Text style={styles.footerMainText}>
                            YOUR PROFESSIONAL EDGE IS NOW UNLOCKED.
                        </Text>
                        <Text style={styles.footerSubText}>
                            ALL PREMIUM FEATURES ARE ACTIVE.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleExplore}
                        activeOpacity={0.85}
                        style={styles.actionBtn}
                    >
                        <Text style={styles.actionBtnText}>EXPLORE PREMIUM</Text>
                        <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
        overflow: 'hidden',
    },

    // Background Marquee
    marqueeContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        opacity: 0.04,
        zIndex: 0,
    },
    marqueeRow: {
        flexDirection: 'row',
        width: width * 3, // ensures it's long enough to wrap smoothly
    },
    marqueeText: {
        fontFamily: 'Inter_900Black',
        fontSize: 100,
        color: BLACK,
        textTransform: 'uppercase',
    },

    // Header structure
    headerBlock: {
        alignItems: 'center',
        zIndex: 10,
    },
    heroTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 60,
        color: BLACK,
        lineHeight: 56,
        textAlign: 'center',
        letterSpacing: -2,
        textTransform: 'uppercase',
    },

    // Center interactive visual
    centerVisual: {
        alignItems: 'center',
        marginVertical: 32,
        zIndex: 10,
    },
    accentDot: {
        position: 'absolute',
        top: 0,
        right: 40,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: ORANGE,
        zIndex: 1, // behind the check
    },
    checkmarkBadge: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: BLACK,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
    },

    // Footer actions
    footerBlock: {
        paddingHorizontal: 24,
        zIndex: 10,
    },
    footerInfoBox: {
        marginBottom: 40,
        borderTopWidth: 3,
        borderTopColor: BLACK,
        paddingTop: 24,
    },
    footerMainText: {
        fontFamily: 'Inter_900Black',
        color: BLACK,
        fontSize: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    footerSubText: {
        fontFamily: 'Inter_700Bold',
        color: 'rgba(0,0,0,0.5)',
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Action button
    actionBtn: {
        backgroundColor: BLACK,
        paddingVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        borderRadius: 2, // Slightly sharp or round? Let's use slight curve or sharp depending on architecture.
    },
    actionBtnText: {
        fontFamily: 'Inter_900Black',
        color: '#FFFFFF',
        fontSize: 16,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
