import React, { useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import COLORS from '../constants/colors';
import { w, h, f, SP, H_PAD } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

// ─── Calculate age helper ─────────────────────────────────────────────────────
function getAge(birthday: string | null): number | null {
    if (!birthday) return null;
    const today = new Date();
    const birth = new Date(birthday);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// ─── Match Card Subcomponent ──────────────────────────────────────────────────
const MatchCard = ({
    profile, index, onPress,
}: {
    profile: any; index: number; onPress: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const name = (profile.name || 'USER').toUpperCase();
    const age = getAge(profile.birthday);
    const score = Math.round(profile.compatibility_score ?? profile.aim_score ?? 0);
    const isTopPick = index === 0;

    const bio = profile.bio || '';
    const details = [profile.hometown, profile.education, profile.workplace]
        .filter(Boolean).join(' · ');
    const description = bio || details || '';

    const sharedContext = profile.shared_interests
        ? (profile.shared_interests as string[]).join(' · ')
        : null;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
            onPress={onPress}
        >
            <Animated.View style={[styles.card, isTopPick && styles.cardTopPick, { transform: [{ scale: scaleAnim }] }]}>
                {/* Photo */}
                {profile.photo_url && (
                    <Image
                        source={{ uri: profile.photo_url }}
                        style={{ width: '100%', height: h(160), borderRadius: w(14), marginBottom: SP.sm, backgroundColor: '#1A1A1A' }}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>
                        {name}{age ? `, ${age}` : ''}
                    </Text>
                    <Text style={styles.cardScore}>{score}%</Text>
                </View>

                {description !== '' && (
                    <Text style={styles.cardDescription} numberOfLines={3}>
                        {description}
                    </Text>
                )}

                {sharedContext && (
                    <Text style={styles.cardSharedContext}>SHARED: {sharedContext.toUpperCase()}</Text>
                )}

                {isTopPick && (
                    <View style={styles.topPickBadge}>
                        <Text style={styles.topPickText}>TOP PICK</Text>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchmakerScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    // Fetch live discovery profiles from Convex
    const rawProfiles = useQuery(api.users.getDiscoveryProfiles, {});
    const isLoading = rawProfiles === undefined;

    const discoveryFeed = React.useMemo(() => {
        if (!rawProfiles) return [];
        return [...rawProfiles]
            .sort((a, b) => (b.compatibility_score ?? 0) - (a.compatibility_score ?? 0))
            .slice(0, 5);
    }, [rawProfiles]);

    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // useQuery handles revalidation automatically, but we can add a manual refresh if needed
        setRefreshing(false);
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />
            <View style={{ paddingTop: insets.top }} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerLogo}>ALIGN</Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>DAILY</Text>
                </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={styles.flex1}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + h(100) }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BLACK} />
                }
            >
                <View style={styles.heroBlock}>
                    <Text style={styles.heroText}>TODAY'S{'\n'}ALIGNMENT.</Text>
                </View>

                {isLoading ? (
                    <View style={{ alignItems: 'center', paddingVertical: h(40) }}>
                        <ActivityIndicator size="large" color={BLACK} />
                    </View>
                ) : discoveryFeed.length > 0 ? (
                    discoveryFeed.map((profile: any, index: number) => (
                        <MatchCard
                            key={profile._id}
                            profile={{
                                ...profile,
                                name: profile.firstName,
                                photo_url: profile.photos?.[0],
                                compatibility_score: profile.compatibility_score ?? 0,
                            }}
                            index={index}
                            onPress={() => {
                                navigation.navigate('ProfileDetail', {
                                    userId: profile._id,
                                    compatibility_score: profile.compatibility_score ?? 0,
                                });
                            }}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>SEARCHING</Text>
                        <Text style={styles.emptySubtext}>
                            ALIGN is building your daily matches.{'\n'}Complete your profile to get better alignments.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Ask Align Bar */}
            <View style={[styles.askBarContainer, { paddingBottom: Math.max(insets.bottom, SP.lg) }]}>
                <TouchableOpacity onPress={() => navigation.navigate('AlignAI')} activeOpacity={0.9} style={styles.askBar}>
                    <Text style={styles.askBarText}>ASK ALIGN ANYTHING</Text>
                    <Ionicons name="arrow-forward" size={w(18)} color="#FFFFFF" style={{ transform: [{ rotate: '-45deg' }] }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    flex1: { flex: 1 },
    scrollContent: { paddingHorizontal: H_PAD },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: H_PAD, paddingTop: SP.md, paddingBottom: SP.sm,
    },
    headerLogo: { fontFamily: 'Inter_900Black', fontSize: f(14), color: BLACK, letterSpacing: 2, textTransform: 'uppercase' },
    headerBadge: { backgroundColor: BLACK, paddingHorizontal: w(12), paddingVertical: h(5), borderRadius: w(18) },
    headerBadgeText: { fontFamily: 'Inter_900Black', fontSize: f(10), color: '#FFFFFF', letterSpacing: 1.5, textTransform: 'uppercase' },

    heroBlock: { marginBottom: SP.lg, marginTop: SP.xs },
    heroText: { fontFamily: 'Inter_900Black', fontSize: f(36), color: BLACK, letterSpacing: -2, lineHeight: f(40), textTransform: 'uppercase' },

    card: {
        backgroundColor: BLACK, borderRadius: w(22), padding: w(20), marginBottom: SP.md,
        shadowColor: '#000', shadowOffset: { width: 0, height: h(8) }, shadowOpacity: 0.12, shadowRadius: h(16), elevation: 6,
    },
    cardTopPick: { borderWidth: 2, borderColor: ORANGE },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SP.sm },
    cardName: { fontFamily: 'Inter_900Black', fontSize: f(26), fontStyle: 'italic', color: '#FFFFFF', letterSpacing: -0.5, flex: 1 },
    cardScore: { fontFamily: 'Inter_800ExtraBold', fontSize: f(16), color: '#00C853', letterSpacing: 0.5 },
    cardDescription: {
        fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(255,255,255,0.7)',
        lineHeight: f(20), letterSpacing: 0.1, marginBottom: SP.md,
    },
    cardSharedContext: { fontFamily: 'Inter_800ExtraBold', fontSize: f(10), color: '#00C853', letterSpacing: 1.5, textTransform: 'uppercase' },
    topPickBadge: {
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
        paddingHorizontal: w(10), paddingVertical: h(4),
        alignSelf: 'flex-start', borderRadius: w(4), marginTop: SP.sm,
    },
    topPickText: { fontFamily: 'Inter_800ExtraBold', fontSize: f(9), color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },

    emptyContainer: { alignItems: 'center', paddingVertical: h(60), paddingHorizontal: H_PAD },
    emptyTitle: { fontFamily: 'Inter_900Black', fontSize: f(22), color: BLACK, letterSpacing: -0.5, marginBottom: SP.sm },
    emptySubtext: {
        fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(13,13,13,0.45)',
        textAlign: 'center', lineHeight: f(19),
    },

    askBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: H_PAD },
    askBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: BLACK, paddingHorizontal: w(22), paddingVertical: h(14), borderRadius: w(32),
        shadowColor: '#000', shadowOffset: { width: 0, height: h(12) }, shadowOpacity: 0.18, shadowRadius: h(24), elevation: 10,
    },
    askBarText: { fontFamily: 'Inter_700Bold', fontSize: f(12), color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, textTransform: 'uppercase' },
});
