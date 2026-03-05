import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Animated, Easing, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Star, X, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useAction } from 'convex/react';
import { Image as ExpoImage } from 'expo-image';
import { api } from '../../convex/_generated/api';

import { BLACK, CREAM, ORANGE } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';

import { w, h, f, SP, H_PAD } from '../utils/responsive';

// ─── Smart Crop ──────────────────────────────────────────────────────────────
// Module-level cache: survives re-renders and scroll, cleared on app restart
const cropCache = new Map<string, { top: string; left: string }>();

function getPositionFromRatio(ratio: number): { top: string; left: string } {
    if (ratio < 0.60) {
        // Very tall (9:16 vertical video / tall selfie) — face is near the very top
        return { top: '2%', left: '50%' };
    }
    if (ratio < 0.80) {
        // Standard portrait (3:4) — face usually in upper third
        return { top: '8%', left: '50%' };
    }
    if (ratio < 1.05) {
        // Near-square — center crop is safe
        return { top: '50%', left: '50%' };
    }
    // Landscape — subject is typically centered horizontally and vertically
    return { top: '50%', left: '50%' };
}

function useSmartCrop(imageUrl: string | null): { top: string; left: string } {
    const [position, setPosition] = useState<{ top: string; left: string }>({ top: '8%', left: '50%' });

    useEffect(() => {
        if (!imageUrl) return;

        const cached = cropCache.get(imageUrl);
        if (cached) {
            setPosition(cached);
            return;
        }

        Image.getSize(
            imageUrl,
            (width, height) => {
                const pos = getPositionFromRatio(width / height);
                cropCache.set(imageUrl, pos);
                setPosition(pos);
            },
            () => {
                // On error fall back to portrait-safe default
                const fallback = { top: '8%', left: '50%' };
                cropCache.set(imageUrl, fallback);
                setPosition(fallback);
            }
        );
    }, [imageUrl]);

    return position;
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface AIMMatch {
    _id: string;
    profileId?: string;
    clerkId: string;
    firstName: string;
    age: number;
    photos: string[];
    location: string;
    prompts: { question: string; answer: string }[];
    bio: string;
    explanation?: string;
    compatibility_score?: number;
    total_aps?: number;
    isAim?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning,';
    if (hour >= 12 && hour < 17) return 'Good afternoon,';
    if (hour >= 17 && hour < 22) return 'Good evening,';
    return 'Welcome back,';
}

function calculateAge(birthday: string | null): number | null {
    if (!birthday) return null;
    const today = new Date();
    const birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// ─── Match Card Component ────────────────────────────────────────────────────
function MatchCard({
    match,
    index,
    onDismiss,
    onViewProfile,
    onSwipeLeft,
    onSwipeRight,
}: {
    match: AIMMatch;
    index: number;
    onDismiss: () => void;
    onViewProfile: () => void;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}) {
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(20)).current;
    const cardX = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const [isDismissed, setIsDismissed] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const starScale = useRef(new Animated.Value(1)).current;
    const starRotation = useRef(new Animated.Value(0)).current;

    const scoreSize = f(20);
    const cardNameSize = f(26);
    const cardPadH = w(20);
    const cardPadV = h(18);
    const cardRadius = w(22);
    const actionBtn = w(40);

    const age = match.age;
    const compatPct = (match.compatibility_score && match.compatibility_score > 0) ? match.compatibility_score : null;
    const isComputing = compatPct === null;
    const totalAps = match.total_aps || 0;
    const label = index === 0 ? 'TOP ALIGNMENT' : index === 1 ? 'RUNNER UP' : `#${index + 1} MATCH`;
    const labelColor = index === 0 ? '#999' : '#666';

    const photoUrl = match.photos?.[0] || null;
    const cropPosition = useSmartCrop(photoUrl);
    const promptSnippet = match.explanation
        || (match.prompts?.[0] ? `"${match.prompts[0].answer}"` : match.bio || "New to Align");

    useEffect(() => {
        Animated.sequence([
            Animated.delay(600 + index * 120),
            Animated.parallel([
                Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(cardY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const handleDismiss = () => {
        onSwipeLeft();
        Animated.parallel([
            Animated.timing(cardX, { toValue: -420, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            setIsDismissed(true);
            onDismiss();
        });
    };

    const animateStar = () => {
        Animated.sequence([
            Animated.spring(starScale, { toValue: 1.5, friction: 3, tension: 400, useNativeDriver: true }),
            Animated.spring(starScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
        ]).start();
        if (!isFavorited) {
            Animated.sequence([
                Animated.timing(starRotation, { toValue: -1, duration: 70, useNativeDriver: true }),
                Animated.timing(starRotation, { toValue: 1, duration: 70, useNativeDriver: true }),
                Animated.spring(starRotation, { toValue: 0, friction: 5, tension: 200, useNativeDriver: true }),
            ]).start();
        }
    };

    if (isDismissed) return null;

    return (
        <TouchableWithoutFeedback
            onPressIn={() => Animated.spring(cardScale, { toValue: 0.98, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(cardScale, { toValue: 1, useNativeDriver: true }).start()}
        >
            <Animated.View
                style={{
                    backgroundColor: BLACK, borderRadius: cardRadius,
                    marginBottom: SP.sm, opacity: cardOpacity,
                    overflow: 'hidden',
                    transform: [{ translateY: cardY }, { translateX: cardX }, { scale: cardScale }],
                }}
            >
                {/* Photo Banner */}
                {photoUrl && (
                    <View style={{ width: '100%', height: h(280), overflow: 'hidden', borderTopLeftRadius: cardRadius, borderTopRightRadius: cardRadius, backgroundColor: '#1A1A1A' }}>
                        <ExpoImage
                            source={{ uri: photoUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            contentPosition={cropPosition}
                        />
                    </View>
                )}

                {/* Content Container: Text + Actions */}
                <View style={{ paddingHorizontal: cardPadH, paddingVertical: cardPadV }}>
                    {/* Top Row: Label + Score */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: f(9), fontFamily: 'Inter_700Bold', color: labelColor, letterSpacing: 2.5, textTransform: 'uppercase' }}>{label}</Text>
                        {compatPct !== null ? (
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: w(2) }}>
                                <Text style={{ fontSize: scoreSize, fontFamily: 'Inter_900Black', color: '#00C853', letterSpacing: -0.5, lineHeight: scoreSize * 1.1 }}>{compatPct}</Text>
                                <Text style={{ fontSize: f(12), fontFamily: 'Inter_800ExtraBold', color: 'rgba(255,255,255,0.5)', letterSpacing: 0 }}>%</Text>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: w(2) }}>
                                <Text style={{ fontSize: scoreSize, fontFamily: 'Inter_900Black', color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>--</Text>
                                <Text style={{ fontSize: f(12), fontFamily: 'Inter_800ExtraBold', color: 'rgba(255,255,255,0.2)', letterSpacing: 0 }}>%</Text>
                            </View>
                        )}
                    </View>

                    {/* AP Badge */}
                    {totalAps > 0 && (
                        <View style={{ alignSelf: 'flex-start', backgroundColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', gap: w(5), paddingHorizontal: w(10), paddingVertical: h(4), borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: h(10) }}>
                            <Zap size={w(9)} color={ORANGE} fill={ORANGE} />
                            <Text style={{ fontSize: f(9), fontFamily: 'Inter_800ExtraBold', color: CREAM, letterSpacing: 1 }}>{totalAps} APS</Text>
                        </View>
                    )}

                    {/* Name + Age */}
                    <Text style={{ fontSize: cardNameSize, fontFamily: 'Inter_900Black', color: '#FFFFFF', letterSpacing: -1, lineHeight: Math.round(cardNameSize * 1.1), marginTop: SP.sm }}>
                        {(match.firstName || 'UNKNOWN').toUpperCase()}{age ? `, ${age}` : ''}
                    </Text>

                    {/* Bio / Details / Prompts */}
                    <Text style={{ fontSize: f(13), fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: SP.xs, lineHeight: f(19), letterSpacing: 0.1 }} numberOfLines={2}>
                        {promptSnippet}
                    </Text>

                    {/* Action Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SP.lg }}>
                        <View style={{ flexDirection: 'row', gap: SP.sm }}>
                            {/* Dismiss */}
                            <TouchableOpacity activeOpacity={0.8} onPress={handleDismiss} style={{ width: actionBtn, height: actionBtn, borderRadius: actionBtn / 2, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={w(17)} strokeWidth={1.5} color="rgba(245,240,235,0.4)" />
                            </TouchableOpacity>
                            {/* Favorite */}
                            <TouchableOpacity activeOpacity={1} onPress={() => { animateStar(); if (!isFavorited) onSwipeRight(); setIsFavorited(!isFavorited); }}>
                                <Animated.View style={{ width: actionBtn, height: actionBtn, borderRadius: actionBtn / 2, backgroundColor: isFavorited ? ORANGE : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: starScale }, { rotate: starRotation.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-20deg', '0deg', '20deg'] }) }] }}>
                                    <Star size={w(17)} strokeWidth={1.5} color={isFavorited ? '#F5F0EB' : 'rgba(245,240,235,0.4)'} fill={isFavorited ? '#F5F0EB' : 'transparent'} />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>

                        {/* View Profile */}
                        <TouchableOpacity onPress={onViewProfile} style={{ backgroundColor: CREAM, paddingHorizontal: w(18), paddingVertical: h(10), borderRadius: w(20) }}>
                            <Text style={{ fontSize: f(9), fontFamily: 'Inter_800ExtraBold', color: BLACK, letterSpacing: 0.5, textTransform: 'uppercase' }}>VIEW PROFILE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </TouchableWithoutFeedback>

    );
}

// ─── Main Home Screen ────────────────────────────────────────────────────────
export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { profile } = useProfile();
    const recordSwipe = useMutation(api.swipes.recordSwipe);
    const markAIMShown = useMutation(api.ai.aims.markAIMShown);

    // ── State ────────────────────────────────────────────────────────────
    const [dismissedAimIds, setDismissedAimIds] = useState<Set<string>>(new Set());
    const rawAIMs = useQuery(api.ai.aims.getMyAIMs, {});
    const discoveryProfiles = useQuery(api.users.getDiscoveryProfiles, {});
    const triggerPersonality = useAction(api.ai.personality.triggerPersonalityCompute);
    const triggerBatchCompat = useAction(api.ai.compatibility.triggerBatchCompatibility);
    const isLoading = rawAIMs === undefined || discoveryProfiles === undefined;

    // Trigger personality profile computation on first load
    useEffect(() => {
        triggerPersonality({}).catch(() => { });
    }, []);

    // Trigger batch compatibility computation for profiles that don't have scores yet
    useEffect(() => {
        if (!discoveryProfiles || discoveryProfiles.length === 0) return;
        const missingIds = discoveryProfiles
            .filter((p: any) => !p.compatibility_score || p.compatibility_score === 0)
            .map((p: any) => p.clerkId);
        if (missingIds.length > 0) {
            triggerBatchCompat({ otherClerkIds: missingIds }).catch(() => { });
        }
    }, [discoveryProfiles]);

    const matches: AIMMatch[] = useMemo(() => {
        const aimData = (rawAIMs || [])
            .filter((aim: any) => !dismissedAimIds.has(aim._id))
            .map((aim: any) => ({
                _id: aim._id,
                profileId: aim.targetUserId,
                clerkId: aim.targetClerkId,
                firstName: aim.target.firstName,
                age: aim.target.age,
                photos: aim.target.photos,
                location: aim.target.location,
                prompts: [],
                bio: '',
                explanation: aim.explanation,
                compatibility_score: aim.compatibilityScore,
                total_aps: 0,
                isAim: true,
            }));

        const aimClerkIds = new Set(aimData.map(a => a.clerkId));

        const otherProfiles = (discoveryProfiles || [])
            .filter(p => !aimClerkIds.has(p.clerkId))
            .map(p => ({
                _id: p._id,
                profileId: p._id,
                clerkId: p.clerkId,
                firstName: p.firstName,
                age: p.age,
                photos: p.photos,
                location: p.location,
                prompts: p.prompts,
                bio: p.bio,
                compatibility_score: (p as any).compatibility_score ?? 0, // Real score from DB lookup
            }));

        const combined = [...aimData, ...otherProfiles];
        // Sort by compatibility score DESC
        return combined.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
    }, [rawAIMs, discoveryProfiles, dismissedAimIds]);



    const [refreshing, setRefreshing] = useState(false);

    // ── Greeting ─────────────────────────────────────────────────────────
    const greeting = useMemo(() => getGreeting(), []);
    const displayName = profile?.firstName || profile?.name || 'you';

    // ── Animation Values ─────────────────────────────────────────────────
    const greetOpacity = useRef(new Animated.Value(0)).current;
    const greetY = useRef(new Animated.Value(30)).current;
    const nameOpacity = useRef(new Animated.Value(0)).current;
    const nameY = useRef(new Animated.Value(30)).current;
    const dotPulse1 = useRef(new Animated.Value(1)).current;
    const dotPulse2 = useRef(new Animated.Value(1)).current;
    const dotPulse3 = useRef(new Animated.Value(1)).current;
    const askBarOpacity = useRef(new Animated.Value(0)).current;
    const askBarY = useRef(new Animated.Value(30)).current;
    const emptyOpacity = useRef(new Animated.Value(0)).current;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setRefreshing(false);
    }, []);

    // ── Entrance Animations ──────────────────────────────────────────────
    useEffect(() => {
        Animated.stagger(120, [
            Animated.parallel([
                Animated.timing(greetY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(greetOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(nameY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                Animated.timing(nameOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
            ]),
        ]).start();

        Animated.sequence([
            Animated.delay(1100),
            Animated.parallel([
                Animated.timing(askBarOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(askBarY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]),
        ]).start();

        const pulse = (anim: Animated.Value, delay: number) =>
            Animated.loop(Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1.4, duration: 500, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]));
        pulse(dotPulse1, 0).start();
        pulse(dotPulse2, 150).start();
        pulse(dotPulse3, 300).start();
    }, []);

    // Empty state fade-in after loading
    useEffect(() => {
        if (!isLoading && matches.length === 0) {
            Animated.timing(emptyOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        }
    }, [isLoading, matches.length]);

    // ── Responsive sizes ─────────────────────────────────────────────────
    const greetSize = f(14);
    const nameSize = f(36);
    const nameLineH = Math.round(nameSize * 1.05);
    const actionBtn = w(40);
    const askH = h(48);
    const askR = askH / 2;
    const dotSize = w(7);
    const accentDot = w(24);
    const askBottom = Math.max(insets.bottom, SP.sm);

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar style="dark" />
            <View style={{ flex: 1, paddingTop: insets.top }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: askH + askBottom + SP.md }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLACK} />
                    }
                >
                    {/* Orange Accent Dot */}
                    <View style={{ position: 'absolute', top: SP.xs, right: 0, width: accentDot, height: accentDot, borderRadius: accentDot / 2, backgroundColor: ORANGE }} />

                    {/* Personalized Greeting */}
                    <View style={{ marginTop: SP.xs, marginBottom: SP.sm }}>
                        <Animated.Text
                            style={{
                                fontSize: greetSize, fontFamily: 'Inter_600SemiBold',
                                color: 'rgba(13,13,13,0.40)', letterSpacing: 0.8, textTransform: 'uppercase',
                                opacity: greetOpacity, transform: [{ translateY: greetY }],
                            }}
                        >
                            {greeting}
                        </Animated.Text>
                        <Animated.Text
                            style={{
                                fontSize: nameSize, fontFamily: 'Inter_900Black', color: BLACK,
                                lineHeight: nameLineH, letterSpacing: -1.5, marginTop: SP.xs,
                                opacity: nameOpacity, transform: [{ translateY: nameY }],
                            }}
                        >
                            {displayName}.
                        </Animated.Text>
                    </View>

                    {/* Pulsing Dots */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: h(10), gap: w(5) }}>
                        <Animated.View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#FFD600', transform: [{ scale: dotPulse1 }] }} />
                        <Animated.View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#E03A2F', transform: [{ scale: dotPulse2 }] }} />
                        <Animated.View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#00C853', transform: [{ scale: dotPulse3 }] }} />
                        <Text style={{ fontSize: f(10), fontFamily: 'Inter_700Bold', color: 'rgba(13,13,13,0.55)', letterSpacing: 1.8, textTransform: 'uppercase', marginLeft: w(6) }}>
                            {isLoading ? 'ALIGN IS FINDING...' : matches.length > 0 ? 'DISCOVERY FEED' : 'ALIGN IS LEARNING...'}
                        </Text>
                    </View>

                    {/* ────── DISCOVERY FEED ────── */}
                    {matches.map((match, index) => (
                        <MatchCard
                            key={match._id}
                            match={match}
                            index={index}
                            onSwipeLeft={() => { recordSwipe({ toClerkId: match.clerkId, direction: 'left' }); }}
                            onSwipeRight={() => { recordSwipe({ toClerkId: match.clerkId, direction: 'right' }); }}
                            onDismiss={() => {
                                setDismissedAimIds(prev => new Set([...prev, match._id]));
                                if (match.isAim) {
                                    markAIMShown({ aimId: match._id as any });
                                }
                            }}
                            onViewProfile={() => navigation.navigate('ProfileDetail', {
                                userId: match.profileId || match._id,
                                compatibility_score: match.compatibility_score,
                                explanation: match.explanation,
                            })}
                        />
                    ))}

                    {/* ────── EMPTY STATE ────── */}
                    {!isLoading && matches.length === 0 && (
                        <Animated.View style={{ opacity: emptyOpacity, alignItems: 'center', paddingVertical: h(60) }}>
                            <View style={{
                                width: w(80), height: w(80), borderRadius: w(40),
                                backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center',
                                marginBottom: SP.lg,
                            }}>
                                <Ionicons name="pulse" size={w(32)} color={ORANGE} />
                            </View>
                            <Text style={{
                                fontSize: f(22), fontFamily: 'Inter_900Black', color: BLACK,
                                textAlign: 'center', letterSpacing: -0.5, marginBottom: SP.sm,
                            }}>
                                STILL LEARNING
                            </Text>
                            <Text style={{
                                fontSize: f(13), fontFamily: 'Inter_500Medium', color: 'rgba(13,13,13,0.45)',
                                textAlign: 'center', lineHeight: f(19), paddingHorizontal: w(20),
                            }}>
                                ALIGN is still learning your preferences.{'\n'}New matches will appear here as more{'\n'}people join the community.
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>

                {/* ────── ASK BAR ────── */}
                <Animated.View
                    style={{
                        position: 'absolute', bottom: askBottom, left: H_PAD, right: H_PAD,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF', height: askH, borderRadius: askR,
                        paddingHorizontal: w(20), opacity: askBarOpacity, transform: [{ translateY: askBarY }],
                        shadowColor: '#000', shadowOffset: { width: 0, height: h(14) }, shadowOpacity: 0.15, shadowRadius: h(28), elevation: 18,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(10) }}>
                        <Ionicons name="mic" size={w(16)} color="rgba(13,13,13,0.3)" />
                        <Text style={{ fontSize: f(10), fontFamily: 'Inter_800ExtraBold', color: 'rgba(13,13,13,0.4)', textTransform: 'uppercase', letterSpacing: 2 }}>
                            ASK ALIGN ANYTHING...
                        </Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('AlignAI')}
                        style={{ width: actionBtn, height: actionBtn, borderRadius: actionBtn / 2, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Ionicons name="arrow-up" size={w(16)} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}
