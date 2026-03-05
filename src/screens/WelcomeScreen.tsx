import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    Easing,
    ActivityIndicator,
    ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Reusable staggered fade-up animation wrapper
// ---------------------------------------------------------------------------
interface FadeUpViewProps {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle | ViewStyle[];
}

const FadeUpView: React.FC<FadeUpViewProps> = ({ children, delay = 0, style }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 700,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 700,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
        ]).start();
    }, [delay, opacity, translateY]);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

// ---------------------------------------------------------------------------
// WelcomeScreen
// ---------------------------------------------------------------------------
interface WelcomeScreenProps {
    onNext: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
    const insets = useSafeAreaInsets();

    // Error shimmer animation (kept for structural compatibility)
    const errorOpacity = useRef(new Animated.Value(0)).current;

    return (
        <View style={styles.container}>
            {/* Background Watermark */}
            <View style={styles.watermarkContainer}>
                <Text style={styles.watermarkText} numberOfLines={1}>ALIGN</Text>
            </View>

            <View style={[styles.content, {
                paddingTop: insets.top + (SCREEN_WIDTH > 400 ? 60 : 40),
                paddingBottom: Math.max(insets.bottom, 40)
            }]}>
                {/* Logo Section */}
                <FadeUpView delay={100} style={styles.logoContainer}>
                    <Text
                        style={styles.logo}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        ALIGN
                    </Text>
                </FadeUpView>

                {/* Tagline Section */}
                <FadeUpView delay={250} style={styles.taglineContainer}>
                    <Text style={styles.tagline}>
                        Dating for people who are done wasting time
                    </Text>
                </FadeUpView>

                {/* Illustration Section */}
                <FadeUpView delay={400} style={styles.illustrationCard}>
                    <Svg viewBox="0 0 400 288" style={styles.svg}>
                        <Rect width="400" height="288" fill="#ede8e0" />
                        <Line x1="0" y1="72" x2="400" y2="72" stroke="#d8d2c8" strokeWidth={0.5} />
                        <Line x1="0" y1="144" x2="400" y2="144" stroke="#d8d2c8" strokeWidth={0.5} />
                        <Line x1="0" y1="216" x2="400" y2="216" stroke="#d8d2c8" strokeWidth={0.5} />
                        <Path
                            d="M -20 200 C 60 200, 80 88, 200 88 C 320 88, 340 200, 440 200"
                            stroke={COLORS.black}
                            strokeWidth="18"
                            fill="none"
                            strokeLinecap="round"
                        />
                        <Circle cx="305" cy="136" r="18" fill={COLORS.primary} />
                    </Svg>
                </FadeUpView>

                {/* Bottom Spacer pushed by auto margin */}
                <View style={{ flex: 1 }} />



                {/* Primary Actions */}
                <FadeUpView delay={600} style={styles.ctaSection}>
                    <TouchableOpacity
                        style={styles.btnGoogle}
                        onPress={onNext}
                        activeOpacity={0.8}
                    >
                        <View style={styles.btnContent}>
                            <View style={styles.googleIconContainer}>
                                <Ionicons name="arrow-forward" size={20} color={COLORS.black} />
                            </View>
                            <Text style={styles.btnGoogleText}>Get Started</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.disclaimerContainer}>
                        <Ionicons name="lock-closed" size={12} color={COLORS.black} style={{ opacity: 0.5 }} />
                        <Text style={styles.disclaimerText}>
                            High Intent Only • No Games
                        </Text>
                    </View>
                </FadeUpView>
            </View>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    watermarkContainer: {
        position: 'absolute',
        bottom: -SCREEN_WIDTH * 0.1,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 0,
    },
    watermarkText: {
        fontSize: SCREEN_WIDTH * 0.45,
        fontFamily: 'Inter_700Bold',
        color: COLORS.black,
        opacity: 0.04,
        letterSpacing: -10,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        zIndex: 1,
    },
    logoContainer: {
        marginBottom: SPACING.xs,
        width: '100%',
    },
    logo: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 88,
        lineHeight: 96,
        letterSpacing: -4,
        color: COLORS.black,
        textTransform: 'uppercase',
        includeFontPadding: false,
        textAlign: 'left',
    },
    taglineContainer: {
        marginBottom: SPACING.xxl,
        width: '90%',
    },
    tagline: {
        fontFamily: 'Inter_700Bold',
        fontSize: SCREEN_WIDTH > 400 ? 20 : 18,
        lineHeight: SCREEN_WIDTH > 400 ? 28 : 24,
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    illustrationCard: {
        width: '100%',
        aspectRatio: 1 / 0.72,
        backgroundColor: '#ede8e0',
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    svg: {
        width: '100%',
        height: '100%',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(236, 91, 19, 0.06)',
    },
    errorText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 11,
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    ctaSection: {
        marginTop: SPACING.xl,
        width: '100%',
    },
    btnGoogle: {
        backgroundColor: COLORS.white,
        height: 64,
        borderRadius: 0, // Squared as per design
        borderWidth: 2,
        borderColor: COLORS.black,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    btnContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnLoading: {
        opacity: 0.7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    googleIconContainer: {
        marginRight: 12,
        // Vertical micro-alignment for baseline perfection
        transform: [{ translateY: -1 }],
    },
    btnGoogleText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        includeFontPadding: false,
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        gap: 8,
    },
    disclaimerText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.black,
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});

export default WelcomeScreen;
