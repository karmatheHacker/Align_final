import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle, Platform } from 'react-native';

interface AnimationProps {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle | ViewStyle[];
    duration?: number;
}

/**
 * Reusable staggered fade-up animation wrapper
 */
export const FadeUpView: React.FC<AnimationProps> = ({ children, delay = 0, style, duration = 600 }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }),
        ]).start();
    }, [delay, opacity, translateY, duration]);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
            {children}
        </Animated.View>
    );
};

/**
 * Reusable footer fade-in animation wrapper
 */
export const FooterFadeIn: React.FC<AnimationProps> = ({ children, delay = 0, style, duration = 600 }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration,
            delay,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
        }).start();
    }, [delay, opacity, duration]);

    return (
        <Animated.View style={[style, { opacity }]}>
            {children}
        </Animated.View>
    );
};
