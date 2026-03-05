import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { w, h, f } from '../utils/responsive';

WebBrowser.maybeCompleteAuthSession();

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WelcomeScreenProps {
    onNext: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const insets = useSafeAreaInsets();

    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);

    const handleSignInWithGoogle = useCallback(async () => {
        try {
            const redirectUrl = Linking.createURL('/', { scheme: 'alignfinal' });
            const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
            } else {
                // Use signIn or signUp for next steps such as MFA
            }
        } catch {
            // User cancellations and OAuth errors are silently swallowed here
        }
    }, [startOAuthFlow]);

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
                <View style={styles.logoContainer}>
                    <Text style={styles.logo} numberOfLines={1} adjustsFontSizeToFit>
                        ALIGN
                    </Text>
                </View>

                <View style={styles.taglineContainer}>
                    <Text style={styles.tagline}>
                        Dating for people who are done wasting time
                    </Text>
                </View>

                <View style={styles.illustrationCard}>
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
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.ctaSection}>
                    <TouchableOpacity
                        style={styles.btnGoogle}
                        onPress={handleSignInWithGoogle}
                        activeOpacity={0.8}
                    >
                        <View style={styles.btnContent}>
                            <Ionicons name="logo-google" size={w(20)} color={COLORS.black} style={styles.googleIconContainer} />
                            <Text style={styles.btnGoogleText}>Continue with Google</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.disclaimerContainer}>
                        <Ionicons name="lock-closed" size={12} color={COLORS.black} style={{ opacity: 0.5 }} />
                        <Text style={styles.disclaimerText}>
                            High Intent Only • No Games
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

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
        fontSize: f(88),
        lineHeight: f(96),
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
        fontSize: SCREEN_WIDTH > 400 ? f(20) : f(18),
        lineHeight: SCREEN_WIDTH > 400 ? f(28) : f(24),
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    illustrationCard: {
        width: '100%',
        aspectRatio: 1 / 0.72,
        backgroundColor: '#ede8e0',
        borderRadius: w(40),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    svg: {
        width: '100%',
        height: '100%',
    },
    ctaSection: {
        marginTop: SPACING.xl,
        width: '100%',
    },
    btnGoogle: {
        backgroundColor: COLORS.white,
        height: h(54),
        borderRadius: w(27),
        borderWidth: 2,
        borderColor: COLORS.black,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    btnContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIconContainer: {
        marginRight: w(12),
        transform: [{ translateY: -1 }],
    },
    btnGoogleText: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(15),
        color: COLORS.black,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        includeFontPadding: false,
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: h(24),
        gap: w(8),
    },
    disclaimerText: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(10),
        color: COLORS.black,
        opacity: 0.5,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
