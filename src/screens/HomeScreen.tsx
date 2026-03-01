import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Animated, Easing, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Star, X, Zap } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { BLACK, CREAM, ORANGE } from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '@clerk/clerk-expo';
import { getAuthenticatedSupabase } from '../config/supabase';
import { w, h, f, SP, H_PAD } from '../utils/responsive';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AIMMatch {
    clerk_id: string;
    name: string;
    birthday: string | null;
    bio: string | null;
    hometown: string | null;
    workplace: string | null;
    education: string | null;
    photo_url: string | null;
    compatibility_score: number;
    total_aps: number;
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
}: {
    match: AIMMatch;
    index: number;
    onDismiss: () => void;
    onViewProfile: () => void;
}) {
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardY = useRef(new Animated.Value(20)).current;
    const cardX = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(1)).current;
    const [isDismissed, setIsDismissed] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const starScale = useRef(new Animated.Value(1)).current;
    const starRotation = useRef(new Animated.Value(0)).current;

    const scoreSize = f(24);
    const cardNameSize = f(34);
    const cardPadH = w(18);
    const cardPadV = h(16);
    const cardRadius = w(20);
    const actionBtn = w(40);

    const age = calculateAge(match.birthday);
    const compatPct = Math.round(match.compatibility_score);
    const label = index === 0 ? 'TOP ALIGNMENT' : index === 1 ? 'RUNNER UP' : `#${index + 1} MATCH`;
    const labelColor = index === 0 ? '#999' : '#666';

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
                    paddingHorizontal: cardPadH, paddingVertical: cardPadV,
                    marginBottom: SP.sm, opacity: cardOpacity,
                    transform: [{ translateY: cardY }, { translateX: cardX }, { scale: cardScale }],
                }}
            >
                {/* Photo Banner */}
                {match.photo_url && (
                    <Image
                        source={{ uri: match.photo_url }}
                        style={{
                            width: '100%', height: h(180), borderRadius: w(14),
                            marginBottom: SP.sm, backgroundColor: '#1A1A1A',
                        }}
                        resizeMode="cover"
                    />
                )}

                {/* Top Row: Label + Score */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: f(9), fontWeight: '700', color: labelColor, letterSpacing: 3, textTransform: 'uppercase' }}>{label}</Text>
                    <Text style={{ fontSize: scoreSize, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, lineHeight: scoreSize }}>{compatPct}%</Text>
                </View>

                {/* AP Badge */}
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#1A1A1A', flexDirection: 'row', alignItems: 'center', gap: w(5), paddingHorizontal: w(10), paddingVertical: h(4), borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: SP.sm }}>
                    <Zap size={w(9)} color={ORANGE} fill={ORANGE} />
                    <Text style={{ fontSize: f(9), fontWeight: '800', color: CREAM, letterSpacing: 1 }}>{match.total_aps} APs</Text>
                </View>

                {/* Name + Age */}
                <Text style={{ fontSize: cardNameSize, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, lineHeight: cardNameSize, marginTop: SP.sm }}>
                    {(match.name || 'UNKNOWN').toUpperCase()}{age ? `, ${age}` : ''}
                </Text>

                {/* Bio / Details */}
                <Text style={{ fontSize: f(12), color: '#AAAAAA', marginTop: SP.sm, lineHeight: f(17) }} numberOfLines={2}>
                    {match.bio || [match.hometown, match.education, match.workplace].filter(Boolean).join(' · ') || 'New to Align'}
                </Text>

                {/* Action Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: SP.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SP.md }}>
                        <View style={{ flexDirection: 'row', gap: SP.sm }}>
                            {/* Dismiss */}
                            <TouchableOpacity activeOpacity={0.8} onPress={handleDismiss} style={{ width: actionBtn, height: actionBtn, borderRadius: actionBtn / 2, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={w(17)} strokeWidth={1.5} color="rgba(245,240,235,0.4)" />
                            </TouchableOpacity>
                            {/* Favorite */}
                            <TouchableOpacity activeOpacity={1} onPress={() => { animateStar(); setIsFavorited(!isFavorited); }}>
                                <Animated.View style={{ width: actionBtn, height: actionBtn, borderRadius: actionBtn / 2, backgroundColor: isFavorited ? ORANGE : 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', transform: [{ scale: starScale }, { rotate: starRotation.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-20deg', '0deg', '20deg'] }) }] }}>
                                    <Star size={w(17)} strokeWidth={1.5} color={isFavorited ? '#F5F0EB' : 'rgba(245,240,235,0.4)'} fill={isFavorited ? '#F5F0EB' : 'transparent'} />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                        {/* View Profile */}
                        <TouchableOpacity onPress={onViewProfile} style={{ backgroundColor: CREAM, paddingHorizontal: w(18), paddingVertical: h(10), borderRadius: w(20) }}>
                            <Text style={{ fontSize: f(9), fontWeight: '800', color: BLACK, letterSpacing: 0.5, textTransform: 'uppercase' }}>VIEW PROFILE</Text>
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
    const { getToken } = useAuth();

    // ── State ────────────────────────────────────────────────────────────
    const [matches, setMatches] = useState<AIMMatch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // ── Greeting ─────────────────────────────────────────────────────────
    const greeting = useMemo(() => getGreeting(), []);
    const displayName = profile?.name || profile?.first_name || 'you';

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

    // ── Fetch Real Matches ───────────────────────────────────────────────
    const fetchMatches = useCallback(async () => {
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const client = getAuthenticatedSupabase(token);

            const { data, error } = await client.rpc('get_home_aim_matches', { p_limit: 10 });

            if (error) {
                console.warn('AIM fetch warning:', error.message);
                setMatches([]);
            } else {
                setMatches((data as AIMMatch[]) || []);
            }
        } catch (err) {
            console.warn('AIM fetch error:', err);
            setMatches([]);
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchMatches();
        setRefreshing(false);
    }, [fetchMatches]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

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
                                fontSize: greetSize, fontWeight: '600',
                                color: 'rgba(13,13,13,0.45)', letterSpacing: 0.5, textTransform: 'uppercase',
                                opacity: greetOpacity, transform: [{ translateY: greetY }],
                            }}
                        >
                            {greeting}
                        </Animated.Text>
                        <Animated.Text
                            style={{
                                fontSize: nameSize, fontWeight: '900', color: BLACK,
                                lineHeight: nameLineH, letterSpacing: -1.5, marginTop: SP.xs,
                                opacity: nameOpacity, transform: [{ translateY: nameY }],
                            }}
                        >
                            {displayName}.
                        </Animated.Text>
                    </View>

                    {/* Pulsing Dots */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SP.sm, gap: w(5) }}>
                        <Animated.View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#FFD600', transform: [{ scale: dotPulse1 }] }} />
                        <Animated.View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#E03A2F', transform: [{ scale: dotPulse2 }] }} />
                        <Animated.View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: '#00C853', transform: [{ scale: dotPulse3 }] }} />
                        <Text style={{ fontSize: f(10), fontWeight: '700', color: BLACK, letterSpacing: 2, textTransform: 'uppercase', marginLeft: w(4) }}>
                            {isLoading ? 'ALIGN IS FINDING...' : matches.length > 0 ? `${matches.length} MATCHES FOUND` : 'ALIGN IS LEARNING...'}
                        </Text>
                    </View>

                    {/* ────── REAL MATCH CARDS ────── */}
                    {matches.map((match, index) => (
                        <MatchCard
                            key={match.clerk_id}
                            match={match}
                            index={index}
                            onDismiss={() => {
                                setMatches(prev => prev.filter(m => m.clerk_id !== match.clerk_id));
                            }}
                            onViewProfile={() => navigation.navigate('ProfileDetail', { clerk_id: match.clerk_id })}
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
                                fontSize: f(22), fontWeight: '900', color: BLACK,
                                textAlign: 'center', letterSpacing: -0.5, marginBottom: SP.sm,
                            }}>
                                STILL LEARNING
                            </Text>
                            <Text style={{
                                fontSize: f(13), fontWeight: '500', color: 'rgba(13,13,13,0.45)',
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
                        position: 'absolute', bottom: askBottom, left: SP.md, right: SP.md,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF', height: askH, borderRadius: askR,
                        paddingHorizontal: w(22), opacity: askBarOpacity, transform: [{ translateY: askBarY }],
                        shadowColor: '#000', shadowOffset: { width: 0, height: h(16) }, shadowOpacity: 0.18, shadowRadius: h(32), elevation: 20,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(10) }}>
                        <Ionicons name="mic" size={w(16)} color="rgba(13,13,13,0.3)" />
                        <Text style={{ fontSize: f(10), fontWeight: '800', color: 'rgba(13,13,13,0.4)', textTransform: 'uppercase', letterSpacing: 2 }}>
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
