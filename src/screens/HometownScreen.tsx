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
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import { STEP_ORDER, STEP_CONFIG } from '../constants/steps';
import OnboardingHeading from '../components/OnboardingHeading';
import SkipButton from '../components/SkipButton';
import { validateTextField, sanitizeInput } from '../utils/inputValidation';

const HometownScreen: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const { user: clerkUser } = useUser();
    const saveLocation = useMutation(api.users.updateUserLocation);
    const saveField = useUpdateOnboarding();

    const [hometown, setHometown] = useState(state.hometown || '');
    const [city, setCity] = useState(state.location || '');
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(state.locationCoords || null);
    const [locationDetails, setLocationDetails] = useState<{ city: string; region: string; country: string } | null>(null);
    const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [locError, setLocError] = useState<string | null>(null);

    const currentIndex = STEP_ORDER.indexOf('hometown');
    const totalSteps = STEP_ORDER.length;

    const stepConfig = STEP_CONFIG.find(s => s.id === 'hometown');
    const isRequired = stepConfig?.required ?? false;

    const validation = validateTextField(hometown, 100, !isRequired);
    const canContinue = validation.isValid;

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

            let detCity = '';
            let detRegion = '';
            let detCountry = '';
            let geocoded = false;

            const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}&types=place,region,country`
                );

                if (!response.ok) {
                    throw new Error(`Mapbox returned ${response.status}`);
                }

                const data = await response.json();
                const features: Array<{ place_type: string[]; text: string }> = data.features || [];

                for (const feature of features) {
                    if (feature.place_type?.includes('place') && !detCity) {
                        detCity = feature.text || '';
                    }
                    if (feature.place_type?.includes('region') && !detRegion) {
                        detRegion = feature.text || '';
                    }
                    if (feature.place_type?.includes('country') && !detCountry) {
                        detCountry = feature.text || '';
                    }
                }

                if (detCity || detRegion || detCountry) {
                    geocoded = true;
                }
            } catch (geoErr) {
                // Geocoding failed; proceed with fallback
            }

            if (geocoded) {
                const formattedLocation = detCity && detRegion
                    ? `${detCity}, ${detRegion}`
                    : (detCity || detRegion || detCountry || 'Detected Location');

                setCity(formattedLocation);
                setLocationDetails({
                    city: detCity,
                    region: detRegion,
                    country: detCountry
                });
                setLocStatus('success');
            } else {
                setLocStatus('error');
                setLocError('Unable to detect city name. Please type manually.');
            }
        } catch (e) {
            setLocStatus('error');
            setLocError('Location detection failed. Please try again.');
        }
    };

    const handleNext = async () => {
        if (!canContinue) return;

        const sanitizedHometown = sanitizeInput(hometown);

        // Save location details to Convex in background
        if (coords && locationDetails && clerkUser) {
            saveLocation({
                clerkId: clerkUser.id,
                latitude: coords.latitude,
                longitude: coords.longitude,
                city: locationDetails.city,
                region: locationDetails.region,
                country: locationDetails.country
            }).catch(() => undefined);
        }

        // Save hometown to Convex in background
        saveField({ hometown: sanitizedHometown }).catch(() => undefined);

        dispatch({ type: 'SET_FIELD', field: 'hometown', value: sanitizedHometown });
        dispatch({ type: 'SET_FIELD', field: 'location', value: city });
        dispatch({ type: 'SET_FIELD', field: 'locationCoords', value: coords });
        onNext();
    };

    const handleSkip = async () => {
        // Save skip to Convex in background
        saveField({ hometown: null, location: null, locationCoords: null }).catch(() => undefined);
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
                        {hometown.length > 0 && !validation.isValid ? (
                            <Text style={styles.validationError}>{validation.error}</Text>
                        ) : (
                            <Text style={styles.helperText}>
                                Where your story began. This is {isRequired ? "a required" : "an optional"} field.
                            </Text>
                        )}
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
                    style={[
                        styles.btnContinue,
                        !canContinue && styles.btnDisabled,
                        {
                            opacity: hometown.trim().length > 0 ? 1 : 0,
                            pointerEvents: hometown.trim().length > 0 ? 'auto' : 'none'
                        }
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!canContinue}
                >
                    <Text style={styles.btnText}>Continue</Text>
                    <Feather name="arrow-right" size={20} color={COLORS.white} />
                </TouchableOpacity>

                {!isRequired && (
                    <SkipButton onPress={handleSkip} />
                )}
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
    validationError: {
        fontFamily: 'Inter_500Medium',
        marginTop: SPACING.sm,
        fontSize: 14,
        color: COLORS.primary, // Red/Accent color
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
