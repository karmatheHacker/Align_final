import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
    TouchableOpacity,
    PanResponder,
    Easing,
    Pressable,
    ViewStyle
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CardItem {
    icon: string;
    headline: string;
    body: string;
}

interface WhySheetProps {
    visible: boolean;
    onClose: () => void;
    icon?: string;
    iconBg?: string;
    headline?: string;
    cards?: CardItem[];
    ctaLabel?: string;
    style?: ViewStyle | ViewStyle[];
}

const WhySheet: React.FC<WhySheetProps> = ({
    visible,
    onClose,
    icon = "lock",
    iconBg = COLORS.surface,
    headline = "Why we ask",
    cards = [],
    ctaLabel = "Got it"
}) => {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
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
                        tension: 40,
                        friction: 8,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            // Reset position before showing
            translateY.setValue(SCREEN_HEIGHT);
            backdropOpacity.setValue(0);

            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 320,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, translateY, backdropOpacity]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    const handlePressGotIt = () => {
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.96,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(buttonScale, {
                toValue: 1.0,
                friction: 4,
                useNativeDriver: true,
            }),
        ]).start(() => {
            handleDismiss();
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleDismiss}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
                    <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
                </Pressable>

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY }] }
                    ]}
                >
                    <View {...panResponder.panHandlers}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={[styles.mainIconContainer, { backgroundColor: iconBg }]}>
                        <Feather name={icon as any} size={32} color={COLORS.black} />
                    </View>

                    <Text style={styles.headline}>{headline}</Text>

                    <View style={styles.cardsContainer}>
                        {cards.map((card, index) => (
                            <View key={index} style={styles.trustCard}>
                                <View style={styles.cardIconCol}>
                                    <Feather name={card.icon as any} size={16} color={COLORS.black} />
                                </View>
                                <View style={styles.cardTextCol}>
                                    <Text style={styles.cardHeadline}>{card.headline}</Text>
                                    <Text style={styles.cardBody}>{card.body}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                        <TouchableOpacity
                            style={styles.ctaButton}
                            onPress={handlePressGotIt}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.ctaButtonText}>{ctaLabel}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xxl,
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.lightGray,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    mainIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: SPACING.md,
    },
    headline: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 22,
        color: COLORS.black,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    cardsContainer: {
        marginBottom: SPACING.xl,
    },
    trustCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.sm,
    },
    cardIconCol: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTextCol: {
        flex: 1,
    },
    cardHeadline: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: COLORS.black,
        marginBottom: 2,
    },
    cardBody: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: COLORS.gray,
        lineHeight: 20,
    },
    ctaButton: {
        backgroundColor: COLORS.black,
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    ctaButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: COLORS.white,
    },
});

export default WhySheet;
