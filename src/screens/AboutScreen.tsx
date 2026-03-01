import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import COLORS from '../constants/colors';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const H_PAD = 24;

export default function AboutScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // ─── Animations ───────────────────────────────────────────────────────────
    const titleTranslateX = useRef(new Animated.Value(-100)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            // 1. Title Slam Sequence
            Animated.timing(titleTranslateX, {
                toValue: 0,
                duration: 400,
                easing: Easing.out(Easing.poly(4)),
                useNativeDriver: true,
            }),
            Animated.timing(titleOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            // 2. Staggered Content Fade in
            Animated.sequence([
                Animated.delay(400),
                Animated.parallel([
                    Animated.timing(contentOpacity, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(contentTranslateY, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    })
                ])
            ])
        ]).start();
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            {/* ── Decorative Geo Lines (Background) ────────────────────────── */}
            <View style={[styles.geoLine1, { bottom: -insets.bottom }]} />
            <View style={[styles.geoLine2, { bottom: -insets.bottom }]} />

            <View style={{ flex: 1, paddingTop: insets.top }}>
                {/* ── Header ────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <MaterialIcons name="arrow-back" size={28} color={BLACK} />
                    </TouchableOpacity>
                    <Text style={styles.headerSubtitle}>
                        Settings / About
                    </Text>
                </View>

                {/* ── Content ───────────────────────────────────────────────── */}
                <ScrollView
                    style={styles.flex1}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Huge Title */}
                    <Animated.Text
                        style={[
                            styles.heroTitle,
                            {
                                transform: [{ translateX: titleTranslateX }],
                                opacity: titleOpacity
                            }
                        ]}
                    >
                        ABOUT{'\n'}ALIGN
                    </Animated.Text>

                    {/* Divider */}
                    <Animated.View
                        style={[
                            styles.divider,
                            {
                                opacity: contentOpacity,
                                transform: [{ translateY: contentTranslateY }]
                            }
                        ]}
                    />

                    {/* Version */}
                    <Animated.Text
                        style={[
                            styles.versionText,
                            {
                                opacity: contentOpacity,
                                transform: [{ translateY: contentTranslateY }]
                            }
                        ]}
                    >
                        v1.0.4
                    </Animated.Text>

                    {/* Description Text */}
                    <Animated.Text
                        style={[
                            styles.descriptionText,
                            {
                                opacity: contentOpacity,
                                transform: [{ translateY: contentTranslateY }]
                            }
                        ]}
                    >
                        Align is a minimalist coordination tool designed for clarity and precision. Our mission is to streamline focus through high-contrast interfaces and structural simplicity.{'\n\n'}
                        Designed with passion by the Align Team.{'\n'}
                        Stockholm / San Francisco / Tokyo.{'\n'}
                        All rights reserved © 2024.
                    </Animated.Text>

                    {/* Terms Button */}
                    <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
                        <TouchableOpacity style={styles.termsButton} activeOpacity={0.9}>
                            <Text style={styles.termsButtonText}>
                                Terms of Service
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Social Icons */}
                    <Animated.View
                        style={[
                            styles.socialContainer,
                            {
                                opacity: contentOpacity,
                                transform: [{ translateY: contentTranslateY }]
                            }
                        ]}
                    >
                        <TouchableOpacity activeOpacity={0.8}>
                            <MaterialIcons name="share" size={28} color="rgba(0,0,0,0.6)" />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8}>
                            <MaterialIcons name="language" size={28} color="rgba(0,0,0,0.6)" />
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.8}>
                            <MaterialIcons name="mail" size={28} color="rgba(0,0,0,0.6)" />
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </View>
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
    },
    flex1: {
        flex: 1,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: H_PAD,
        paddingVertical: 16,
    },
    headerSubtitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: 'rgba(0,0,0,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // ── Content Layout ────────────────────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: H_PAD,
        paddingTop: 48,
    },
    heroTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 80,
        color: BLACK, // Fixed from "text-cream" in mock to ensure contrast
        lineHeight: 72,
        letterSpacing: -2,
        textTransform: 'uppercase',
        marginBottom: 48,
    },
    divider: {
        height: 2,
        backgroundColor: ORANGE,
        width: '100%',
        marginBottom: 48,
    },
    versionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 80,
        color: BLACK, // Adjusted for contrast against CREAM
        letterSpacing: -1,
        marginBottom: 48,
    },
    descriptionText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: 'rgba(0,0,0,0.4)',
        lineHeight: 24,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 80,
        maxWidth: '90%',
    },

    // ── Button ────────────────────────────────────────────────────────────────
    termsButton: {
        backgroundColor: ORANGE,
        paddingVertical: 20,
        borderRadius: 100, // full pill
        alignItems: 'center',
        marginBottom: 48,
        // Colored shadow effect mapping to tailwind "shadow-orange-500/30"
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    termsButtonText: {
        fontFamily: 'Inter_900Black',
        fontSize: 14,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },

    // ── Icons ─────────────────────────────────────────────────────────────────
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        paddingBottom: 48,
    },

    // ── Decorative Geo Elements ───────────────────────────────────────────────
    geoLine1: {
        position: 'absolute',
        right: 0,
        width: 256,
        height: 256,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.2)', // ORANGE with 0.2 opacity
        transform: [
            { translateX: 128 },
            { translateY: 128 },
            { rotate: '45deg' }
        ],
        pointerEvents: 'none', // Critical so they don't block scroll
    },
    geoLine2: {
        position: 'absolute',
        right: 0,
        width: 256,
        height: 256,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.2)',
        transform: [
            { translateX: 96 },
            { translateY: 96 },
            { rotate: '30deg' }
        ],
        pointerEvents: 'none',
    },
});
