import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing,
    StyleSheet,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useOnboarding } from '../context/OnboardingContext';



const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.6;

interface VerificationScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({ onNext, onBack }) => {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType, setCameraType] = useState<CameraType>('front');
    const [isVerifying, setIsVerifying] = useState(false);
    const { state, dispatch } = useOnboarding();
    const cameraRef = useRef<CameraView>(null);

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const submitVerification = useMutation(api.verifications.submitVerification);

    const currentIndex = STEP_ORDER.indexOf('verification');
    const totalSteps = STEP_ORDER.length;

    // Animations
    const marqueeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Background Marquee Animation
        Animated.loop(
            Animated.timing(marqueeAnim, {
                toValue: -SCREEN_WIDTH,
                duration: 10000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();

        // Pulse Animation for the frame
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const handleVerify = async () => {
        if (!cameraRef.current || isVerifying) return;
        setIsVerifying(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
            if (!photo) throw new Error("Could not capture photo.");

            const uploadUrl = await generateUploadUrl();
            if (!uploadUrl) throw new Error("Could not generate upload URL");

            const response = await fetch(photo.uri);
            const blob = await response.blob();

            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type },
                body: blob,
            });

            if (!result.ok) throw new Error("Upload to storage failed");
            const { storageId } = await result.json();

            await submitVerification({ storageId });

            dispatch({ type: 'SET_FIELD', field: 'verificationStatus', value: 'pending' });
            onNext();
        } catch (err: any) {
            console.error('Verification error:', err);
            Alert.alert("Verification Error", "Could not submit your verification. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    if (!permission) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.centered, { padding: SPACING.xl }]}>
                <View style={styles.iconCircle}>
                    <MaterialIcons name="camera-alt" size={40} color={COLORS.text} />
                </View>
                <Text style={styles.permissionText}>
                    We need your permission to access the camera for liveness verification.
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={styles.permissionBtn}
                    activeOpacity={0.8}
                >
                    <Text style={styles.permissionBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    return (
        <View style={styles.container}>
            {/* Background Marquee Layer */}
            <View style={styles.bgOverlay} pointerEvents="none">
                <Animated.View style={[styles.marqueeRow, { transform: [{ translateX: marqueeAnim }] }]}>
                    <Text style={styles.marqueeText}>
                        BLINK · REAL · LIVE · VERIFIED · HUMAN · BLINK · REAL · LIVE · VERIFIED · HUMAN ·
                    </Text>
                    <Text style={styles.marqueeText}>
                        BLINK · REAL · LIVE · VERIFIED · HUMAN · BLINK · REAL · LIVE · VERIFIED · HUMAN ·
                    </Text>
                </Animated.View>
            </View>

            <StepIndicator
                currentIndex={currentIndex}
                totalSteps={totalSteps}
                onBack={onBack}
            />

            <View style={styles.mainContent}>
                <FadeUpView delay={200} style={styles.headerSection}>
                    <Text style={styles.bigTitle}>BLINK.</Text>
                    <Text style={styles.subTitle}>
                        Look at the camera. Follow the prompts to confirm you are you.
                    </Text>
                </FadeUpView>

                <View style={styles.cameraSection}>
                    <Animated.View style={[
                        styles.cameraFrame,
                        { transform: [{ scale: pulseAnim }] }
                    ]}>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing={cameraType}
                        />
                    </Animated.View>
                </View>

                {/* Status Dot */}
                <View style={styles.statusSection}>
                    <View style={styles.yellowDot} />
                    <Text style={styles.statusText}>AI LIVENESS DETECTOR ACTIVE</Text>
                </View>
            </View>

            {/* Footer */}
            <FooterFadeIn
                delay={100}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnVerify, isVerifying && styles.btnDisabled]}
                    onPress={handleVerify}
                    activeOpacity={0.8}
                    disabled={isVerifying}
                >
                    {isVerifying ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                        <>
                            <Text style={styles.btnText}>VERIFY</Text>
                            <Feather name="shield" size={20} color={COLORS.white} />
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
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        zIndex: 0,
    },
    marqueeRow: {
        flexDirection: 'row',
        width: SCREEN_WIDTH * 4,
        opacity: 0.04,
    },
    marqueeText: {
        fontFamily: 'Inter_900Black',
        fontSize: 90,
        color: COLORS.black,
        textTransform: 'uppercase',
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: 40,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    bigTitle: {
        fontFamily: 'PlayfairDisplay_700Bold',
        fontSize: 72,
        color: COLORS.text,
        letterSpacing: -2,
    },
    subTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 280,
    },
    cameraSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraFrame: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        borderWidth: 4,
        borderColor: COLORS.black,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.05)',
        position: 'relative',
    },
    camera: {
        width: '100%',
        height: '100%',
    },
    statusSection: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
        gap: 8,
    },
    yellowDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFD600',
    },
    statusText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 9,
        color: COLORS.gray,
        letterSpacing: 2,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        backgroundColor: COLORS.surface,
        paddingTop: SPACING.lg,
    },
    btnVerify: {
        width: '100%',
        backgroundColor: COLORS.black,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 64,
        borderRadius: 0,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        fontFamily: 'Inter_700Bold',
        color: COLORS.white,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginRight: SPACING.sm,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    permissionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    permissionBtn: {
        backgroundColor: COLORS.black,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 32,
    },
    permissionBtnText: {
        fontFamily: 'Inter_700Bold',
        color: COLORS.white,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});

export default VerificationScreen;
