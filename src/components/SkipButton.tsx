import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

interface SkipButtonProps {
    onPress: () => void;
}

const SkipButton: React.FC<SkipButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.skipBtn}
            activeOpacity={0.6}
        >
            <Text style={styles.skipText}>SKIP FOR NOW</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    skipBtn: {
        alignItems: 'center',
        marginTop: SPACING.lg,
    },
    skipText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.gray,
        letterSpacing: 1.5,
    },
});

export default SkipButton;
