import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function useEntranceAnimation(animate: boolean) {
    const titleOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
    const contentOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
    const footerOpacity = useRef(new Animated.Value(animate ? 0 : 1)).current;

    const titleTranslation = useRef(new Animated.Value(animate ? 20 : 0)).current;
    const contentTranslation = useRef(new Animated.Value(animate ? 20 : 0)).current;
    const footerTranslation = useRef(new Animated.Value(animate ? 20 : 0)).current;

    useEffect(() => {
        if (!animate) return;
        Animated.stagger(100, [
            Animated.parallel([
                Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(titleTranslation, { toValue: 0, duration: 500, useNativeDriver: true })
            ]),
            Animated.parallel([
                Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(contentTranslation, { toValue: 0, duration: 500, useNativeDriver: true })
            ]),
            Animated.parallel([
                Animated.timing(footerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(footerTranslation, { toValue: 0, duration: 500, useNativeDriver: true })
            ])
        ]).start();
    }, [animate]);

    return {
        titleStyle: { opacity: titleOpacity, transform: [{ translateY: titleTranslation }] },
        contentStyle: { opacity: contentOpacity, transform: [{ translateY: contentTranslation }] },
        footerStyle: { opacity: footerOpacity, transform: [{ translateY: footerTranslation }] }
    };
}
