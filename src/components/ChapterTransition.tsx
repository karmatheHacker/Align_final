import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, Easing } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

interface ChapterTransitionProps {
    chapterLabel: string | null;
}

/**
 * ChapterTransition
 * Full-screen overlay that fades in, holds briefly, then fades out
 * whenever the chapter name changes.
 */
const ChapterTransition: React.FC<ChapterTransitionProps> = ({ chapterLabel }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const accentWidth = useRef(new Animated.Value(0)).current;

    const [visible, setVisible] = useState(false);
    const [displayName, setDisplayName] = useState(chapterLabel);
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip flash on initial load if needed, or allow it for Chapter 1
        if (!chapterLabel) return;

        // If it's the same label, don't re-trigger (unless we explicitly want to)
        if (displayName === chapterLabel && !isFirstRender.current) return;

        setDisplayName(chapterLabel);
        setVisible(true);
        isFirstRender.current = false;

        // Reset values for a fresh animation
        opacity.setValue(0);
        translateY.setValue(20);
        accentWidth.setValue(0);

        // Animation Sequence
        Animated.sequence([
            // Fade In & Slide Up
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.quad),
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1)),
                }),
                Animated.timing(accentWidth, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: false, // Cannot animate width with native driver
                    easing: Easing.out(Easing.quad),
                }),
            ]),
            // Hold
            Animated.delay(1500),
            // Fade Out
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.quad),
                }),
                Animated.timing(translateY, {
                    toValue: -30,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.quad),
                }),
            ]),
        ]).start(() => {
            setVisible(false);
        });
    }, [chapterLabel]);

    if (!visible) return null;

    const accentBarWidth = accentWidth.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 120],
    });

    return (
        <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
            <View style={styles.contentWrapper}>
                <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
                    <Text style={styles.chapterText}>{displayName}</Text>
                    <Animated.View style={[styles.accentBar, { width: accentBarWidth }]} />
                </Animated.View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        backgroundColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    chapterText: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 32,
        color: COLORS.white,
        textAlign: 'center',
        letterSpacing: 2,
        paddingHorizontal: SPACING.xl,
        textTransform: 'uppercase',
    },
    accentBar: {
        height: 4,
        backgroundColor: COLORS.primary,
        marginTop: SPACING.lg,
    },
});

export default ChapterTransition;
