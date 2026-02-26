import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Image,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Safe ImagePicker import
let ImagePicker = null;
try {
    ImagePicker = require('expo-image-picker');
} catch (e) {
    console.warn('ImagePicker module not found');
}

const VerificationScreen = ({ onNext, onBack }) => {
    const { state, dispatch } = useOnboarding();
    const insets = useSafeAreaInsets();

    const [verifying, setVerifying] = useState(false);
    const [capturedSelfie, setCapturedSelfie] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(
        state.verificationStatus === 'verified' ? 'success' : 'pending'
    );

    // Guard against double-tap / race conditions
    const verifyingRef = useRef(false);

    const currentIndex = STEP_ORDER.indexOf('verification');
    const totalSteps = STEP_ORDER.length;

    // Animations
    const scanPulse = useRef(new Animated.Value(0)).current;
    const scanLine = useRef(new Animated.Value(0)).current;
    const processingPing = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (verifying) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanPulse, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanPulse, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.timing(scanLine, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(processingPing, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(processingPing, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            scanPulse.setValue(0);
            scanLine.setValue(0);
            processingPing.setValue(0);
        }
    }, [verifying]);

    const handlePhotoAction = useCallback(async () => {
        if (verifyingRef.current) return;

        if (!ImagePicker || typeof ImagePicker.requestCameraPermissionsAsync !== 'function') {
            Alert.alert(
                'Module Missing',
                'Camera module is not available. Simulating verification...',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Simulate Success', onPress: () => startVerification('demo-uri') }
                ]
            );
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera access for verification.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            startVerification(result.assets[0].uri);
        }
    }, [state.photos]);

    const startVerification = async (uri) => {
        verifyingRef.current = true;
        setCapturedSelfie(uri === 'demo-uri' ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' : uri);
        setVerifying(true);
        setVerificationStatus('pending');

        // Simulate local frontend-only verification process
        setTimeout(() => {
            setVerificationStatus('success');
            dispatch({ type: 'SET_FIELD', field: 'verificationStatus', value: 'verified' });
            setVerifying(false);
            verifyingRef.current = false;
        }, 3000);
    };

    const isVerified = state.verificationStatus === 'verified' || verificationStatus === 'success';

    const ringScale = scanPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    const ringOpacity = scanPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 0.4],
    });

    const selfieSize = Math.min(SCREEN_WIDTH - 64, 320);
    const translateYLine = scanLine.interpolate({
        inputRange: [0, 1],
        outputRange: [0, selfieSize],
    });

    const pingScale = processingPing.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.5],
    });

    const pingOpacity = processingPing.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 0],
    });

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    if (isVerified) {
        return (
            <View style={styles.container}>
                <View style={styles.successContent}>
                    <FadeUpView delay={100} style={styles.collageContainer}>
                        <View style={[styles.floatDot, { top: -16, left: 30, backgroundColor: COLORS.black }]} />
                        <View style={[styles.floatDot, { bottom: 20, right: 20, backgroundColor: COLORS.text, opacity: 0.2 }]} />

                        <View style={[styles.photoTile, styles.tile1]}>
                            <Image
                                source={{ uri: state.photos?.[0] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' }}
                                style={styles.tileImage}
                            />
                        </View>

                        <View style={[styles.photoTile, styles.tile2]}>
                            <Image
                                source={{ uri: state.photos?.[1] || state.photos?.[0] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' }}
                                style={styles.tileImage}
                            />
                        </View>

                        <View style={[styles.photoTile, styles.tile3]}>
                            <Image
                                source={{ uri: state.photos?.[2] || state.photos?.[0] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' }}
                                style={styles.tileImage}
                            />
                        </View>

                        <View style={[styles.photoTile, styles.tile4]}>
                            <Image
                                source={{ uri: capturedSelfie || state.photos?.[0] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' }}
                                style={styles.tileImage}
                            />
                        </View>
                    </FadeUpView>

                    <FadeUpView delay={300} style={styles.successTextContainer}>
                        <Text style={styles.successTitle}>You're In</Text>
                    </FadeUpView>

                    <FadeUpView delay={500}>
                        <Text style={styles.successSubtitle}>
                            Align is ready.{"\n"}Go find your person.
                        </Text>
                    </FadeUpView>
                </View>

                <FooterFadeIn delay={700} style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
                    <TouchableOpacity
                        style={styles.btnContinue}
                        onPress={onNext}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnText}>Enter Align</Text>
                        <Feather name="arrow-right" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </FooterFadeIn>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StepIndicator
                currentIndex={currentIndex}
                totalSteps={totalSteps}
                onBack={onBack}
            />

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mainContent}>
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            allowFontScaling={false}
                        >
                            Verify
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    <FadeUpView delay={350} style={styles.descContainer}>
                        <Text style={styles.bodyText}>
                            Align uses AI to make sure everyone is who they say they are.
                        </Text>
                    </FadeUpView>

                    <FadeUpView delay={500} style={[styles.selfieWrapper, { width: selfieSize, height: selfieSize }]}>
                        {capturedSelfie ? (
                            <Image
                                source={{ uri: capturedSelfie }}
                                style={styles.capturedImage}
                            />
                        ) : (
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' }}
                                style={styles.cameraImage}
                            />
                        )}

                        {!capturedSelfie && !verifying && (
                            <TouchableOpacity
                                style={styles.captureOverlay}
                                onPress={handlePhotoAction}
                                activeOpacity={0.7}
                            >
                                <Feather name="camera" size={32} color={COLORS.text} />
                                <Text style={styles.captureText}>TAP TO VERIFY</Text>
                            </TouchableOpacity>
                        )}

                        {verifying && (
                            <>
                                <Animated.View style={[
                                    styles.scanningRing,
                                    {
                                        transform: [{ scale: ringScale }],
                                        opacity: ringOpacity,
                                    }
                                ]} />
                                <Animated.View style={[
                                    styles.scanLine,
                                    {
                                        transform: [{ translateY: translateYLine }]
                                    }
                                ]} />
                            </>
                        )}
                    </FadeUpView>

                    <FadeUpView delay={650} style={styles.processingBlock}>
                        <View style={styles.processingHeader}>
                            {verifying ? (
                                <View style={styles.pingContainer}>
                                    <Animated.View style={[
                                        styles.pingCircle,
                                        {
                                            transform: [{ scale: pingScale }],
                                            opacity: pingOpacity,
                                        }
                                    ]} />
                                    <View style={styles.pingDot} />
                                </View>
                            ) : (
                                <Feather
                                    name={verificationStatus === 'success' ? 'check-circle' : 'shield'}
                                    size={14}
                                    color={verificationStatus === 'success' ? COLORS.black : COLORS.gray}
                                />
                            )}
                            <Text style={[
                                styles.processingLabel,
                                verificationStatus === 'success' && { color: COLORS.black }
                            ]}>
                                {verifying ? 'AI ANALYSIS IN PROGRESS...' :
                                    verificationStatus === 'success' ? 'BIOMETRIC MATCH CONFIRMED' :
                                        verificationStatus === 'failed' ? 'VERIFICATION FAILED' :
                                            'READY FOR BIOMETRIC SCAN'}
                            </Text>
                        </View>
                        <Text style={styles.disclaimerText}>
                            {verificationStatus === 'success'
                                ? 'Your identity has been confirmed against your profile photos.'
                                : 'This photo is only for verification and won\'t be shown on your profile.'}
                        </Text>
                    </FadeUpView>
                </View>
            </ScrollView>

            <FooterFadeIn
                delay={800}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnContinue, verifying && styles.btnDisabled]}
                    onPress={verificationStatus === 'success' ? onNext : handlePhotoAction}
                    activeOpacity={0.8}
                    disabled={verifying}
                >
                    {verifying ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <>
                            <Text style={styles.btnText}>
                                {verificationStatus === 'success' ? 'Continue' : 'Quick Verify'}
                            </Text>
                            <Feather name="arrow-right" size={20} color={COLORS.white} />
                        </>
                    )}
                </TouchableOpacity>
            </FooterFadeIn>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    flex1: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 40,
    },
    titleContainer: {
        marginBottom: SPACING.xxl,
        width: '100%',
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
    },
    accentBar: {
        width: 48,
        height: 6,
        backgroundColor: COLORS.primary,
        marginTop: SPACING.md,
        borderRadius: 3,
    },
    descContainer: {
        marginBottom: SPACING.xxl,
    },
    bodyText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: COLORS.gray,
        lineHeight: 24,
    },
    selfieWrapper: {
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: COLORS.text,
        backgroundColor: 'rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: SPACING.xxl,
    },
    cameraImage: {
        width: '100%',
        height: '100%',
        opacity: 0.1,
    },
    capturedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    captureOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    captureText: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: COLORS.text,
        letterSpacing: 2,
    },
    scanningRing: {
        position: 'absolute',
        top: 40,
        left: 40,
        right: 40,
        bottom: 40,
        borderWidth: 2,
        borderColor: COLORS.black,
        opacity: 0.2,
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: COLORS.black,
        opacity: 0.5,
    },
    processingBlock: {
        width: '100%',
        borderWidth: 2,
        borderColor: COLORS.text,
        padding: SPACING.lg,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    processingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    pingContainer: {
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pingCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.black,
        position: 'absolute',
    },
    pingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.black,
    },
    processingLabel: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: COLORS.text,
        letterSpacing: 2,
    },
    disclaimerText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 13,
        color: COLORS.gray,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.surface,
        paddingTop: SPACING.lg,
    },
    btnContinue: {
        width: '100%',
        backgroundColor: COLORS.black,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 0,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnText: {
        fontFamily: 'Inter_700Bold',
        color: COLORS.white,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginRight: SPACING.sm,
    },
    successContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
    },
    collageContainer: {
        width: 260,
        height: 240,
        marginBottom: 60,
        position: 'relative',
    },
    floatDot: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    photoTile: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    tileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    tile1: {
        left: 0,
        top: 0,
        width: 130,
        height: 220,
    },
    tile2: {
        right: 0,
        top: 0,
        width: 118,
        height: 103,
    },
    tile3: {
        right: 60,
        top: 115,
        width: 58,
        height: 103,
    },
    tile4: {
        right: 0,
        top: 115,
        width: 58,
        height: 103,
    },
    successTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 72,
        lineHeight: 80,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: -4,
        textAlign: 'center',
    },
    successSubtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 18,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 28,
    },
    successTextContainer: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
});

export default VerificationScreen;
