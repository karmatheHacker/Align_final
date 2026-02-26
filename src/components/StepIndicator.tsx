import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { CHAPTER_CONFIG, STEP_ORDER } from '../constants/steps';

/**
 * Premium StepIndicator
 * A unified global header for the onboarding flow.
 * Matches the high-energy, clean aesthetic of the 'Identity' design system.
 */
interface StepIndicatorProps {
    currentIndex: number;
    totalSteps: number;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentIndex, totalSteps, onBack, rightAction }) => {
    const insets = useSafeAreaInsets();

    // Animated value for progress width
    const animatedWidth = useRef(new Animated.Value((currentIndex + 1) / totalSteps)).current;

    // Animated value for content entrance
    const entranceOpacity = useRef(new Animated.Value(0)).current;
    const entranceTranslateY = useRef(new Animated.Value(-10)).current;

    useEffect(() => {
        // Initial entrance
        Animated.parallel([
            Animated.timing(entranceOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            Animated.timing(entranceTranslateY, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
        ]).start();
    }, [entranceOpacity, entranceTranslateY]);

    useEffect(() => {
        // Update progress bar
        Animated.timing(animatedWidth, {
            toValue: (currentIndex + 1) / totalSteps,
            duration: 450,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false, // width cannot be animated with native driver
        }).start();
    }, [currentIndex, totalSteps, animatedWidth]);

    // Calculate Chapter Info
    const getChapterInfo = () => {
        const stepKey = STEP_ORDER[currentIndex];
        const chapter = CHAPTER_CONFIG.find(c => c.steps.includes(stepKey));

        if (chapter) {
            // Remove "Chapter X: " prefix for the small label
            const label = chapter.label.split(': ').pop() || chapter.label;
            return { name: label, id: chapter.id };
        }

        // Fallback detection
        if (currentIndex <= 6) return { name: 'About You', id: 'about' };
        if (currentIndex <= 16) return { name: 'Your Life', id: 'life' };
        return { name: 'Your Photos', id: 'photos' };
    };

    const chapter = getChapterInfo();
    const progressPercent = Math.round(((currentIndex + 1) / totalSteps) * 100);

    const barWidth = animatedWidth.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View style={[
            styles.container,
            {
                paddingTop: Math.max(insets.top, 20) + SPACING.sm,
                opacity: entranceOpacity,
                transform: [{ translateY: entranceTranslateY }]
            }
        ]}>
            {/* Top Row: Back Button & Optional Action */}
            <View style={styles.topRow}>
                <View style={styles.leftCol}>
                    {onBack && (
                        <TouchableOpacity
                            onPress={onBack}
                            style={styles.backButton}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Feather name="arrow-left" size={24} color={COLORS.black} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.centerCol}>
                    <Text style={styles.progressText}>{progressPercent}% COMPLETE</Text>
                </View>

                <View style={styles.rightCol}>
                    {rightAction || <View style={{ width: 24 }} />}
                </View>
            </View>

            {/* Middle Row: The Progress Bar */}
            <View style={styles.barContainer}>
                <View style={styles.track}>
                    <Animated.View style={[styles.fill, { width: barWidth }]} />
                </View>
            </View>

            {/* Bottom Row: Chapter & Step Info */}
            <View style={styles.bottomRow}>
                <Text style={styles.chapterName}>{chapter.name}</Text>
                <Text style={styles.stepCounter}>
                    STEP {currentIndex + 1} <Text style={styles.dimText}>/ {totalSteps}</Text>
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.surface,
        zIndex: 100,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    leftCol: {
        width: 44,
        alignItems: 'flex-start',
    },
    centerCol: {
        flex: 1,
        alignItems: 'center',
    },
    rightCol: {
        width: 44,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: 4,
    },
    progressText: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: COLORS.black,
        letterSpacing: 1,
    },
    barContainer: {
        width: '100%',
        marginBottom: SPACING.sm,
    },
    track: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: SPACING.xs,
    },
    chapterName: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    stepCounter: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.black,
        letterSpacing: 1,
    },
    dimText: {
        color: COLORS.gray,
    }
});

export default StepIndicator;
