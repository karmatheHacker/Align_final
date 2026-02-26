import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface BackButtonProps {
    onPress: () => void;
    style?: ViewStyle;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => (
    <TouchableOpacity
        onPress={onPress}
        style={[styles.backButton, style]}
        accessibilityRole="button"
        accessibilityLabel="Go back to previous step"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10, // Offset for alignment with text if needed
    },
});

export default BackButton;
