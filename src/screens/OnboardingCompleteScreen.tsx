import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { useOnboarding } from '../context/OnboardingContext';
import { useProfile } from '../context/ProfileContext';
import { useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface OnboardingCompleteScreenProps {
    onNext: () => void;
}

const OnboardingCompleteScreen: React.FC<OnboardingCompleteScreenProps> = ({ onNext }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const btnFadeAnim = useRef(new Animated.Value(0)).current;
    const [isFinishing, setIsFinishing] = useState(false);

    const { state } = useOnboarding();
    const { setProfile } = useProfile();
    const { user } = useUser();
    const completeOnboardingMutation = useMutation(api.users.completeOnboarding);

    useEffect(() => {
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
        if (isFinishing) return;
        setIsFinishing(true);

        try {
            // Save onboarding data to local profile context
            setProfile({
                id: 'local_user',
                clerk_id: 'local_user',
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
                photo_urls: state.photos || [],
                verification_status: state.verificationStatus || 'unverified',
                onboarding_completed: true,
                distance_preference: state.distancePreference,
            });

            if (user) {
                await completeOnboardingMutation({ clerkId: user.id });
            }
            onNext();
        } catch {
            setIsFinishing(false);
            Alert.alert('Error', 'Something went wrong. Please try again.');
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
                        style={[styles.btnEnter, isFinishing && { opacity: 0.7 }]}
                        onPress={handleFinish}
                        activeOpacity={0.9}
                        disabled={isFinishing}
                    >
                        {isFinishing ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Text style={styles.btnText}>ENTER ALIGN</Text>
                                <Feather name="arrow-right" size={20} color={COLORS.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
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
