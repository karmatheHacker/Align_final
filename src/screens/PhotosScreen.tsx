import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Animated,
    Alert,
    ScrollView,
    Platform,
    Easing,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import { useProfile } from '../context/ProfileContext';
import { useUser } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER } from '../constants/steps';
import { FadeUpView, FooterFadeIn } from '../components/OnboardingAnimations';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';


// Safe ImagePicker import to prevent crash on Dev Clients without the module
let ImagePicker = null;
try {
    ImagePicker = require('expo-image-picker');
} catch (e) {
    console.warn('ImagePicker module not found');
}

// ---------------------------------------------------------------------------
// MediaSlotItem
// ---------------------------------------------------------------------------
interface MediaItem {
    id: string;
    uri: string | null;
}

const MediaSlotItem = ({ item, index, onAction }: { item: MediaItem, index: number, onAction: (actionType: 'add' | 'remove', id: string) => void }) => {
    const isRequired = index < 3;
    const isFilled = !!item.uri;

    return (
        <View style={styles.mediaSlot}>
            {isFilled ? (
                <View style={styles.mediaSlotFilled}>
                    <Image source={{ uri: item.uri! }} style={styles.mediaImage} />
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => onAction('remove', item.id)}
                        activeOpacity={0.8}
                    >
                        <Feather name="trash-2" size={14} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.mediaSlotEmpty,
                        isRequired && styles.requiredSlot
                    ]}
                    onPress={() => onAction('add', item.id)}
                    activeOpacity={0.6}
                >
                    <Feather name="plus" size={28} color={isRequired ? COLORS.text : COLORS.gray} />
                    {isRequired && (
                        <View style={styles.requiredBadge}>
                            <Text style={styles.requiredBadgeText}>REQ</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

// ---------------------------------------------------------------------------
// PhotosScreen
// ---------------------------------------------------------------------------
const PhotosScreen = ({ onNext, onBack }: { onNext: () => void, onBack: () => void }) => {
    const { dispatch, state } = useOnboarding();
    const { addPhoto } = useProfile();
    const { user } = useUser();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const initialMedia = [1, 2, 3, 4, 5, 6].map((idx) => {
        const existingUri = state.photos && state.photos[idx - 1];
        return {
            id: idx.toString(),
            uri: existingUri || null
        };
    });

    const [mediaItems, setMediaItems] = useState(initialMedia);
    const [isUploading, setIsUploading] = useState(false);

    const currentIndex = STEP_ORDER.indexOf('photos');
    const totalSteps = STEP_ORDER.length;

    const uploadedCount = mediaItems.filter(i => !!i.uri).length;
    const canProceed = uploadedCount >= 3;



    const handleMediaAction = async (actionType: 'add' | 'remove', id: string) => {
        if (actionType === 'remove') {
            setMediaItems(prev => prev.map(item =>
                item.id === id ? { ...item, uri: null } : item
            ));
            return;
        }

        // Safety check for native module availability
        if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== 'function') {
            Alert.alert(
                'Module Missing',
                'The Image Picker native module is not available. Please ensure expo-image-picker is installed.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Use Demo Photo',
                        onPress: () => {
                            setMediaItems(prev => prev.map(item =>
                                item.id === id ? { ...item, uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800' } : item
                            ));
                        }
                    }
                ]
            );
            return;
        }

        // 1. Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your photos to upload them.');
            return;
        }

        // 2. Launch picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const pickedUri = result.assets[0].uri;
            setMediaItems(prev => prev.map(item =>
                item.id === id ? { ...item, uri: pickedUri } : item
            ));
        }
    };

    const handleNext = async () => {
        if (!canProceed || isUploading) return;
        setIsUploading(true);

        try {
            const localUris = mediaItems.filter(i => !!i.uri).map(i => i.uri!);
            const clerkId = user ? user.id : 'local_user';

            // Upload all photos in parallel for maximum speed
            const uploadPromises = localUris.map((uri, index) => {
                // If it's a local file, upload it
                if (uri.startsWith('file://') || uri.startsWith('content://')) {
                    return addPhoto(clerkId, uri, index);
                }
                // If it's already a remote URL, we don't strictly need to addPhoto again 
                // but for consistency with the position we can still do it if the backend handles it.
                return Promise.resolve();
            });

            // Wait for all uploads to finish before final sync and navigation
            await Promise.all(uploadPromises);

            // Sync final photo array to Convex users table in background
            saveField({ photos: localUris }).catch(error => {
                console.error("Failed to sync photos to Convex user table:", error);
            });

            dispatch({ type: 'SET_FIELD', field: 'photos', value: localUris });
            onNext();
        } catch (err) {
            console.error("Photo upload error:", err);
            Alert.alert("Upload Failed", "Could not save your photos. Please check your connection and try again.");
            setIsUploading(false);
        }
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

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mainContent}>
                    {/* Title */}
                    <FadeUpView delay={200} style={styles.titleContainer}>
                        <Text
                            style={styles.title}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            allowFontScaling={false}
                        >
                            Photos
                        </Text>
                        <View style={styles.accentBar} />
                    </FadeUpView>

                    {/* Counter & Instruction */}
                    <FadeUpView delay={350} style={styles.instructionRow}>
                        <View style={styles.statusIndicator}>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: canProceed ? COLORS.primary : COLORS.gray }
                            ]} />
                            <Text style={styles.statusText}>
                                {uploadedCount} / 6 PHOTOS ADDED
                            </Text>
                        </View>
                        <Text style={styles.helperText}>Add at least 3 photos to continue.</Text>
                    </FadeUpView>

                    {/* Media Grid */}
                    <FadeUpView delay={500} style={styles.mediaGrid}>
                        {mediaItems.map((item, index) => (
                            <MediaSlotItem key={item.id} item={item} index={index} onAction={handleMediaAction} />
                        ))}
                    </FadeUpView>

                    {/* Tip Card */}
                    <FadeUpView delay={650} style={styles.tipCard}>
                        <View style={styles.bulbContainer}>
                            <MaterialIcons name="lightbulb" size={22} color="#FFD700" />
                        </View>
                        <View style={styles.tipTextContainer}>
                            <Text style={styles.tipTitle}>PRO TIP</Text>
                            <Text style={styles.tipBody}>
                                Photos with friends or doing activities get 3x more matches.
                            </Text>
                        </View>
                    </FadeUpView>
                </View>
            </ScrollView>

            {/* Footer */}
            <FooterFadeIn
                delay={800}
                style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
            >
                <TouchableOpacity
                    style={[styles.btnContinue, (!canProceed || isUploading) && styles.btnDisabled]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={!canProceed || isUploading}
                >
                    <Text style={styles.btnText}>
                        {isUploading ? 'Uploading...' : 'Continue'}
                    </Text>
                    {!isUploading && <Feather name="arrow-right" size={20} color={COLORS.white} />}
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
        paddingBottom: 120,
    },
    mainContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: 40,
    },
    titleContainer: {
        marginBottom: SPACING.xl,
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
    instructionRow: {
        marginBottom: SPACING.xxl,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 10,
        color: COLORS.text,
        letterSpacing: 2,
    },
    helperText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: COLORS.gray,
    },
    mediaGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -SPACING.xs,
    },
    mediaSlot: {
        width: '33.33%',
        aspectRatio: 0.75,
        padding: SPACING.xs,
    },
    mediaSlotFilled: {
        flex: 1,
        borderWidth: 2,
        borderColor: COLORS.text,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    mediaSlotEmpty: {
        flex: 1,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.01)',
    },
    requiredSlot: {
        borderColor: COLORS.text,
        borderStyle: 'solid',
    },
    requiredBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.text,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    requiredBadgeText: {
        fontFamily: 'Inter_900Black',
        fontSize: 7,
        color: COLORS.white,
    },
    mediaImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    editButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 28,
        height: 28,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.black,
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.text,
        padding: SPACING.lg,
        marginTop: SPACING.xxl,
        gap: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    bulbContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipTextContainer: {
        flex: 1,
    },
    tipTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: COLORS.text,
        letterSpacing: 2,
        marginBottom: 4,
    },
    tipBody: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
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

export default PhotosScreen;
