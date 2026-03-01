import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { useOnboarding } from '../context/OnboardingContext';
import { useProfile } from '../context/ProfileContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { getAuthenticatedSupabase } from '../config/supabase';
import { ProfileData } from '../services/profileService';

interface OnboardingCompleteScreenProps {
    onNext: () => void;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({ onNext }) => {
    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const btnFadeAnim = useRef(new Animated.Value(0)).current;

    const { state } = useOnboarding();
    const { user } = useUser();
    const { getToken } = useAuth();
    const { setProfile, loadFullProfile } = useProfile();
    const [isSaving, setIsSaving] = React.useState(false);

    useEffect(() => {
        // Sequenced entrance
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]),
            Animated.timing(btnFadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleFinish = async () => {
        if (!user) {
            onNext();
            return;
        }

        setIsSaving(true);
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) throw new Error('No Supabase Token Formed');
            const client = getAuthenticatedSupabase(token);

            const distanceInt = parseInt(state.distancePreference, 10);

            // 1. Upsert Profile Core Data
            const profilePayload = {
                id: user.id,
                clerk_id: user.id,
                name: state.firstName,
                birthday: state.birthday,
                gender: state.gender,
                sexuality: state.sexuality,
                pronouns: Array.isArray(state.pronouns) ? state.pronouns : (state.pronouns ? [state.pronouns] : []),
                relationship_type: state.relationshipType,
                dating_intention: state.datingIntention,
                hometown: state.hometown,
                education: state.education,
                school: state.school,
                workplace: state.workplace,
                religion: state.religion,
                politics: state.politics,
                children: state.children,
                tobacco: state.tobacco,
                drinking: state.drinking,
                drugs: state.drugs,
                bio: state.publicBio || state.bio,
                verification_status: state.verificationStatus || 'unverified',
                onboarding_completed: true,
                updated_at: new Date().toISOString()
            };

            const { error: pErr } = await client.from('profiles').upsert([profilePayload]);
            if (pErr) throw pErr;

            // 2. Upsert Preferences
            await client.from('user_preferences').upsert([{
                clerk_id: user.id,
                preferences: { distance_max: isNaN(distanceInt) ? 50 : distanceInt },
                updated_at: new Date().toISOString()
            }]);

            // 3. Upsert Onboarding Data
            await client.from('onboarding_data').upsert([{
                clerk_id: user.id,
                raw_onboarding: state,
                completed: true
            }]);

            // 4. Insert photo URLs directly (already uploaded during PhotosScreen)
            if (state.photos && state.photos.length > 0) {
                const photoRows = state.photos
                    .filter((url: string) => !!url)
                    .map((url: string, i: number) => ({
                        clerk_id: user.id,
                        photo_url: url,
                        position: i,
                    }));

                if (photoRows.length > 0) {
                    const { error: photoErr } = await client.from('photos').upsert(photoRows, { onConflict: 'clerk_id,position' });
                    if (photoErr) console.warn('Photo insert warning:', photoErr.message);
                }
            }

            // Sync Context
            try { await loadFullProfile(user.id); } catch (_) { /* non-blocking */ }
            onNext();
        } catch (error) {
            console.error("Failed to save profile on completion:", error);
            alert("Something went wrong saving your profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.content}>
                <View style={styles.centerSection}>
                    <Animated.View
                        style={[
                            styles.successCircle,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: fadeAnim
                            }
                        ]}
                    >
                        <MaterialIcons name="done" size={56} color="#FFFFFF" />
                    </Animated.View>

                    <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                        <Text style={styles.title}>
                            YOU'RE IN.
                        </Text>
                        <Text style={styles.subtitle}>
                            Your profile is verified and ready.{'\n'}Welcome to the community.
                        </Text>
                    </Animated.View>
                </View>

                {/* Footer Action */}
                <Animated.View style={[styles.footer, { opacity: btnFadeAnim }]}>
                    <TouchableOpacity
                        style={styles.btnEnter}
                        onPress={handleFinish}
                        activeOpacity={0.9}
                        disabled={isSaving}
                    >
                        <Text style={styles.btnText}>{isSaving ? 'SAVING...' : 'ENTER ALIGN'}</Text>
                        {!isSaving && <Feather name="arrow-right" size={20} color={COLORS.white} />}
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface, // bg-cream
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 40,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    title: {
        fontFamily: 'Inter_900Black',
        fontSize: 44,
        color: COLORS.text,
        letterSpacing: -1,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
        lineHeight: 24,
        marginTop: 12,
    },
    footer: {
        width: '100%',
        paddingBottom: 40,
    },
    btnEnter: {
        width: '100%',
        backgroundColor: COLORS.black,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        fontFamily: 'Inter_900Black',
        color: COLORS.white,
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: SPACING.sm,
    },
});

export default OnboardingCompleteScreen;
