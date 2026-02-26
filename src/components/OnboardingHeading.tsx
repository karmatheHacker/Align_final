import React from 'react';
import { Text, View, StyleSheet, Platform, TextStyle, ViewStyle } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { FadeUpView } from './OnboardingAnimations';

interface OnboardingHeadingProps {
    title: string;
    subtitle?: string; // Optional if we want "YOUR" small and "EDUCATION" big, but sticking to user's style
    delay?: number;
    style?: TextStyle | TextStyle[];
    containerStyle?: ViewStyle | ViewStyle[];
    showAccent?: boolean;
}

/**
 * Premium Onboarding Heading Component
 * 
 * Fixes character-level wrapping issues by using adjustsFontSizeToFit
 * and ensuring proper layout constraints.
 */
const OnboardingHeading: React.FC<OnboardingHeadingProps> = ({
    title,
    delay = 200,
    style,
    containerStyle,
    showAccent = true
}) => {
    return (
        <FadeUpView delay={delay} style={[styles.container, containerStyle]}>
            <Text
                style={[styles.title, style]}
                numberOfLines={2} // Allow up to 2 lines for long headings
                adjustsFontSizeToFit
                minimumFontScale={0.65} // Allow scaling down to ~48px if needed on small devices
                allowFontScaling={false} // Prevent system accessibility font scaling from breaking layout
            >
                {title}
            </Text>
            {showAccent && <View style={styles.accentBar} />}
        </FadeUpView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.xxl,
        width: '100%', // Take full width of parent padding
        alignItems: 'flex-start',
    },
    title: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 72,
        lineHeight: 84,
        letterSpacing: -2,
        textTransform: 'uppercase',
        color: COLORS.text,
        paddingTop: Platform.OS === 'ios' ? 8 : 2,
        paddingBottom: 2,
        width: '100%',
        flexShrink: 0,
    },
    accentBar: {
        width: 48,
        height: 6,
        backgroundColor: COLORS.primary,
        marginTop: SPACING.md,
        borderRadius: 3,
    },
});

export default OnboardingHeading;
