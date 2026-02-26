import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

const triggerLight = async () => {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) { }
};

interface VisibilityToggleProps {
    isVisible: boolean;
    onToggle: () => void;
    onInfoPress?: () => void;
    activeColor?: string;
    label?: string;
    style?: ViewStyle | ViewStyle[];
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
    isVisible,
    onToggle,
    onInfoPress,
    activeColor = COLORS.black,
    label,
    style
}) => {
    const displayLabel = isVisible ? (label || "Visible on profile") : "Hidden on profile";
    const iconName = isVisible ? "eye" : "eye-off";
    const contrastColor = isVisible ? activeColor : '#555555';

    return (
        <View style={[styles.visibilityContainer, style]}>
            <TouchableOpacity
                style={styles.visibilityToggleRow}
                onPress={() => { triggerLight(); onToggle(); }}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isVisible }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <View style={styles.visibilityLabelGroup}>
                    <Feather name={iconName} size={20} color={contrastColor} />
                    <Text style={[styles.visibilityText, !isVisible && { color: '#555555' }]}>
                        {displayLabel}
                    </Text>
                </View>
            </TouchableOpacity>

            {onInfoPress && (
                <TouchableOpacity
                    onPress={onInfoPress}
                    style={styles.infoButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Feather name="info" size={18} color="#9CA3AF" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    visibilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: -8,
        paddingRight: 8,
    },
    visibilityToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    visibilityLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    visibilityText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: COLORS.text,
    },
    infoButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default VisibilityToggle;
