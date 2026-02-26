import React from 'react';
import { View, Animated, StyleSheet, Platform, ViewStyle } from 'react-native';
import useEntranceAnimation from '../hooks/useEntranceAnimation';
import useKeyboardOffset from '../hooks/useKeyboardOffset';

/**
 * PremiumScreenWrapper
 *
 * Wraps screen content with an optional staggered entrance animation.
 *
 * Props:
 *   animateEntrance {boolean} - Set true to run the slide-up/fade-in entrance
 *                               animation. Defaults to false — content renders
 *                               immediately at full opacity with zero transform.
 *
 * Usage — bare children (backward-compatible):
 *   <PremiumScreenWrapper>
 *     <View style={sharedStyles.content}>...</View>
 *   </PremiumScreenWrapper>
 *
 * Usage — named slots (full stagger + keyboard dodge):
 *   <PremiumScreenWrapper
 *     animateEntrance
 *     title={<Text>Title</Text>}
 *     content={<OptionList />}
 *     footer={<FAB />}
 *   />
 */

interface PremiumScreenWrapperProps {
    title?: React.ReactNode;
    content?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    animateEntrance?: boolean;
}

const PremiumScreenWrapper: React.FC<PremiumScreenWrapperProps> = ({
    title,
    content,
    footer,
    children,
    animateEntrance = false,
}) => {
    const { titleStyle, contentStyle, footerStyle } = useEntranceAnimation(animateEntrance);
    const keyboardOffset = useKeyboardOffset();

    // Backward-compatible: no named slots → wrap everything in contentStyle
    if (!title && !content && !footer) {
        return (
            <Animated.View style={[styles.wrapper, contentStyle]}>
                {children}
            </Animated.View>
        );
    }

    // Footer paddingBottom tracks keyboard height on iOS.
    // Android uses adjustResize (see app.json android.softwareKeyboardLayoutMode).
    const footerPadding: ViewStyle | undefined = Platform.OS === 'ios'
        ? { paddingBottom: keyboardOffset }
        : undefined;

    return (
        <Animated.View style={styles.wrapper}>
            {title && (
                <Animated.View style={titleStyle}>
                    {title}
                </Animated.View>
            )}
            {content && (
                <Animated.View style={[styles.contentSlot, contentStyle]}>
                    {content}
                </Animated.View>
            )}
            {footer && (
                <Animated.View style={footerStyle}>
                    <Animated.View style={footerPadding}>
                        {footer}
                    </Animated.View>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        // No flex:1 — content expands naturally inside ScrollViews
        // No height — allows Yoga to size from children
    },
    contentSlot: {
        // No flex:1 — allows natural height expansion inside ScrollViews
    },
});

export default PremiumScreenWrapper;
