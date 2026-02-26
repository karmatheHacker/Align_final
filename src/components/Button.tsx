import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { LucideIcon } from 'lucide-react-native';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: LucideIcon;
    style?: ViewStyle;
}

export const PremiumButton: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    icon: Icon,
    style
}) => {
    const isOutline = variant === 'outline';

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={isOutline ? ['transparent', 'transparent'] : (theme.colors.gradient as any)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradient,
                    isOutline && {
                        borderWidth: 1,
                        borderColor: theme.colors.primary,
                        backgroundColor: 'rgba(99, 102, 241, 0.1)'
                    }
                ]}
            >
                <Text style={[styles.text, isOutline && { color: theme.colors.primary }]}>
                    {title}
                </Text>
                {Icon && <Icon color={isOutline ? theme.colors.primary : "white"} size={20} />}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
