import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ShimmerBone
 * A single shimmer bone — a fixed-size grey block overlaid with a
 * left-to-right LinearGradient sweep that loops continuously.
 */
interface ShimmerBoneProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle | ViewStyle[];
}

const ShimmerBone: React.FC<ShimmerBoneProps> = ({ width, height, borderRadius = 8, style }) => {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            })
        ).start();
    }, [shimmer]);

    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                styles.bone,
                { width, height, borderRadius } as any,
                style,
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    { transform: [{ translateX }] },
                ]}
            >
                <LinearGradient
                    colors={['#E8E2D0', '#F0EAD6', '#E8E2D0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

/**
 * SkeletonLoader
 * Shows a rough skeleton of the first onboarding screen while fonts load.
 * Layout mirrors: chapter label + dots row / title block / 3 option rows / FAB
 */
const SkeletonLoader: React.FC = () => (
    <View style={styles.container}>
        {/* ── Chapter / step indicator area ─────────────────────── */}
        <View style={styles.indicatorArea}>
            {/* Chapter label line */}
            <ShimmerBone width={140} height={10} borderRadius={5} style={{ marginBottom: 14 }} />
            {/* Dot row */}
            <View style={styles.dotRow}>
                {[...Array(8)].map((_, i) => (
                    <ShimmerBone key={i} width={18} height={18} borderRadius={9} style={{ marginRight: 10 }} />
                ))}
            </View>
            {/* Progress track */}
            <ShimmerBone width="100%" height={2} borderRadius={1} style={{ marginTop: 10 }} />
        </View>

        {/* ── Title block ───────────────────────────────────────── */}
        <View style={styles.titleBlock}>
            <ShimmerBone width="60%" height={32} borderRadius={8} style={{ marginBottom: 14 }} />
            <ShimmerBone width="40%" height={32} borderRadius={8} />
        </View>

        {/* ── Option row placeholders ───────────────────────────── */}
        <View style={styles.optionArea}>
            {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.optionRow}>
                    <ShimmerBone width="65%" height={18} borderRadius={6} />
                    <ShimmerBone width={44} height={24} borderRadius={12} />
                </View>
            ))}
        </View>

        {/* ── Footer FAB placeholder ────────────────────────────── */}
        <View style={styles.footer}>
            <ShimmerBone width={68} height={68} borderRadius={34} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
        paddingHorizontal: 32,
        paddingTop: 56,
        paddingBottom: 48,
    },
    indicatorArea: {
        marginBottom: 24,
    },
    dotRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleBlock: {
        marginBottom: 40,
        marginTop: 8,
    },
    optionArea: {
        flex: 1,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: 16,
    },
    bone: {
        backgroundColor: '#E8E2D0',
        overflow: 'hidden',
    },
});

export default SkeletonLoader;
