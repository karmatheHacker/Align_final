import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Easing } from 'react-native';
import { SPACING } from '../constants/spacing';
import { COLORS } from '../constants/colors';
import { calculateAge, getBirthDateString } from '../utils/dateHelpers';

interface AgeConfirmationModalProps {
    visible: boolean;
    digits: string[];
    ageError?: string;
    onEdit: () => void;
    onConfirm: () => void;
}

const AgeConfirmationModal: React.FC<AgeConfirmationModalProps> = ({
    visible,
    digits,
    ageError,
    onEdit,
    onConfirm
}) => {
    const age = calculateAge(digits);
    const birthDateStr = getBirthDateString(digits);
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
                easing: Easing.out(Easing.quad),
            }).start();
        } else {
            opacity.setValue(0);
        }
    }, [visible, opacity]);

    return (
        <Modal visible={visible} transparent animationType="none">
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.modalContainer, { opacity }]}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>You’re {age}</Text>
                        <View style={styles.accentBar} />
                        <Text style={styles.modalBirthDate}>{birthDateStr}</Text>
                        <Text style={styles.modalBody}>
                            Confirm your age is correct. Let’s keep our community authentic.
                        </Text>
                    </View>
                    {!!ageError && (
                        <View style={styles.errorBox}>
                            <Text style={styles.modalError}>{ageError}</Text>
                        </View>
                    )}

                    <View style={styles.modalActionRow}>
                        <TouchableOpacity style={styles.modalButton} onPress={onEdit} activeOpacity={0.7}>
                            <Text style={styles.modalButtonTextEdit}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.confirmButton, !!ageError && { opacity: 0.4 }]}
                            onPress={onConfirm}
                            disabled={!!ageError}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalButtonTextConfirm}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 0,
        borderWidth: 2,
        borderColor: COLORS.black,
        overflow: 'hidden',
    },
    modalContent: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 36,
        color: COLORS.text,
        textTransform: 'uppercase',
    },
    accentBar: {
        width: 40,
        height: 6,
        backgroundColor: COLORS.primary,
        marginVertical: SPACING.md,
    },
    modalBirthDate: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: COLORS.gray,
        marginBottom: SPACING.lg,
        letterSpacing: 1,
    },
    modalBody: {
        fontFamily: 'Inter_500Medium',
        fontSize: 15,
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 22,
    },
    errorBox: {
        backgroundColor: 'rgba(236, 91, 19, 0.1)',
        padding: SPACING.md,
        marginHorizontal: SPACING.xl,
        marginBottom: SPACING.xl,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    modalError: {
        color: COLORS.primary,
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalActionRow: {
        flexDirection: 'row',
    },
    modalButton: {
        flex: 1,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    confirmButton: {
        backgroundColor: COLORS.black,
    },
    modalButtonTextEdit: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    modalButtonTextConfirm: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: COLORS.white,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});

export default AgeConfirmationModal;
