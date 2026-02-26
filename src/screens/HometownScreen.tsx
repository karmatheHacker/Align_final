import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { STEP_ORDER } from '../constants/steps';
import OnboardingHeading from '../components/OnboardingHeading';

const HometownScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();

    const [hometown, setHometown] = useState(state.hometown || '');
    const [city, setCity] = useState(state.location || '');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(state.locationCoords || null);
    const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [locError, setLocError] = useState<string | null>(null);

    const isHometownValid = hometown.trim().length >= 2;

    const currentIndex = STEP_ORDER.indexOf('hometown');
    const totalSteps = STEP_ORDER.length;

    const handleEnableLocation = async () => {
        try {
            setLocStatus('loading');
            setLocError(null);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocError('Permission to access location was denied');
                setLocStatus('error');
                return;
            }

            const locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = locationData.coords;
            setCoords({ latitude, longitude });

            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (reverseGeocode.length > 0) {
                const { city: detCity, region, country } = reverseGeocode[0];
                const displayCity = detCity || region || 'Unknown Location';
                const fullLocation = detCity && region ? `${detCity}, ${region}` : (detCity || region || country || 'Detected Location');

                setCity(fullLocation);
                setLocStatus('success');
            } else {
                setLocStatus('error');
                setLocError('Unable to detect city name.');
            }
        } catch (e) {
            setLocStatus('error');
            setLocError('Location detection failed. Please try again.');
        }
    };

    const handleNext = () => {
        if (!isHometownValid) return;
        dispatch({ type: 'SET_FIELD', field: 'hometown', value: hometown.trim() });
        dispatch({ type: 'SET_FIELD', field: 'location', value: city });
        dispatch({ type: 'SET_FIELD', field: 'locationCoords', value: coords });
        onNext();
    };

    const footerPaddingBottom =
        Math.max(insets.bottom, SPACING.lg) + (Platform.OS === 'android' ? SPACING.md : 0);

    return (
        <View style={styles.container}>
            <StepIndicator
                currentIndex={currentIndex}
                totalSteps={totalSteps}
                onBack={onBack}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex1}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <OnboardingHeading title="WHERE YOU FROM?" delay={200} />

                    {/* Hometown Section */}
                    <FadeUpView delay={350} style={styles.section}>
                        <Text style={styles.inputLabel}>Hometown</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your hometown"
                            placeholderTextColor={COLORS.gray}
                            value={hometown}
                            onChangeText={setHometown}
                            autoCapitalize="words"
                            selectionColor={COLORS.primary}
                        />
                        <Text style={styles.helperText}>
                            Where your story began. This is a required field.
                        </Text>
                    </FadeUpView>

                    {/* Location Section */}
                    <FadeUpView delay={500} style={[styles.section, styles.locationSection]}>
                        <Text style={styles.inputLabel}>Current Location</Text>

                        <TouchableOpacity
                            style={[
                                styles.locationButton,
                                locStatus === 'loading' && styles.locationButtonDisabled
                            ]}
                            onPress={handleEnableLocation}
                            disabled={locStatus === 'loading'}
                            activeOpacity={0.7}
                        >
                            {locStatus === 'loading' ? (
                                <ActivityIndicator color={COLORS.text} size="small" />
                            ) : (
                                <MaterialIcons name="my-location" size={20} color={COLORS.text} />
                            )}
                            <Text style={styles.locationButtonText}>
                                USE CURRENT LOCATION
                            </Text>
                        </TouchableOpacity>

                        {/* Status Display */}
                        <View style={styles.statusContainer}>
                            {locStatus === 'loading' && (
                                <Text style={styles.statusText}>Detecting your location...</Text>
                            )}

                            {locStatus === 'success' && (
                                <View style={styles.successRow}>
                                    <View style={styles.pinCircle}>
                                        <Feather name="map-pin" size={14} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.cityName}>{city}</Text>
                                </View>
                            )}

                            {locStatus === 'error' && (
                                <View style={styles.errorRow}>
                                    <Feather name="alert-circle" size={14} color={COLORS.primary} />
                                    <Text style={styles.errorText}>{locError}</Text>
                                </View>
                            )}
                        </View>
                    </FadeUpView>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <FooterFadeIn
                delay={650}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnContinue, !isHometownValid && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!isHometownValid}
                >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={20} color={COLORS.white} />
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
        paddingHorizontal: SPACING.xl,
        paddingTop: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    locationSection: {
        marginTop: SPACING.md,
    },
    inputLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: COLORS.text,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: SPACING.sm,
    },
    input: {
        width: '100%',
        fontFamily: 'Inter_500Medium',
        borderWidth: 2,
        borderColor: COLORS.black,
        paddingVertical: 20,
        paddingHorizontal: 24,
        fontSize: 24,
        color: COLORS.black,
    },
    helperText: {
        fontFamily: 'Inter_400Regular',
        marginTop: SPACING.sm,
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.black,
        height: 56,
        gap: SPACING.sm,
    },
    locationButtonDisabled: {
        opacity: 0.5,
    },
    locationButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: COLORS.text,
        letterSpacing: 1.5,
    },
    statusContainer: {
        marginTop: SPACING.md,
        minHeight: 24,
    },
    statusText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: COLORS.gray,
    },
    successRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    pinCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cityName: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: COLORS.black,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    errorText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: COLORS.primary, // Red/Accent color
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        zIndex: 10,
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
        opacity: 0.3,
    },
    btnText: {
        fontFamily: 'Inter_700Bold',
        color: COLORS.white,
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.4,
        marginRight: SPACING.sm,
    },
});

export default HometownScreen;
