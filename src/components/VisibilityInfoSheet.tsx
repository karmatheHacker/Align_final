import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Modal,
    TouchableOpacity,
    PanResponder,
    Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { VISIBILITY_COPY } from '../constants/visibilityCopy';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VisibilityInfoSheetProps {
    fieldName: string;
    isVisible: boolean;
    onClose: () => void;
}

const VisibilityInfoSheet: React.FC<VisibilityInfoSheetProps> = ({ fieldName, isVisible, onClose }) => {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const copy = VISIBILITY_COPY[fieldName] || VISIBILITY_COPY.gender;
    const content = isVisible ? copy.visible : (copy.hidden || copy.visible);

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [translateY, opacity]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 80 || gestureState.vy > 0.5) {
                    handleDismiss();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 0,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal transparent visible animationType="none" onRequestClose={handleDismiss}>
            <View style={styles.modalOverlay}>
                <Animated.View style={[styles.backdrop, { opacity }]}>
                    <TouchableOpacity
                        style={styles.backdropTouch}
                        activeOpacity={1}
                        onPress={handleDismiss}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.sheetContainer,
                        { transform: [{ translateY }] },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.contentPadding}>
                        <View style={styles.iconContainer}>
                            <Feather name={copy.icon as any} size={28} color={COLORS.black} />
                        </View>

                        <Text style={styles.headline}>{content.headline}</Text>
                        <Text style={styles.body}>{content.body}</Text>

                        <View style={styles.statusPillContainer}>
                            {isVisible ? (
                                <View style={[styles.statusPill, styles.pillVisible]}>
                                    <Text style={styles.pillTextVisible}>👁  Currently visible</Text>
                                </View>
                            ) : (
                                <View style={[styles.statusPill, styles.pillHidden]}>
                                    <Text style={styles.pillTextHidden}>🔒  Currently hidden</Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.gotItButton}
                            onPress={handleDismiss}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.gotItText}>Got it</Text>
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
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    backdropTouch: {
        flex: 1,
    },
    sheetContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingBottom: 48, // Bottom safe area + extra
        width: '100%',
    },
    dragHandleContainer: {
        width: '100%',
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
    },
    contentPadding: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    headline: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 24,
        color: COLORS.black,
        marginBottom: SPACING.sm,
    },
    body: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: COLORS.gray,
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    statusPillContainer: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    statusPill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
    },
    pillVisible: {
        backgroundColor: COLORS.black,
    },
    pillHidden: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pillTextVisible: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: COLORS.white,
    },
    pillTextHidden: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: COLORS.black,
    },
    gotItButton: {
        backgroundColor: COLORS.black,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gotItText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: COLORS.white,
    },
});

export default VisibilityInfoSheet;
