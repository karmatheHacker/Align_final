import React, { useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
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
                        {description.toUpperCase()}
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
    const { discoveryFeed, fetchDiscoveryFeed, isLoading } = useProfile();
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDiscoveryFeed();
        setRefreshing(false);
    }, [fetchDiscoveryFeed]);

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
                    discoveryFeed.slice(0, 5).map((profile: any, index: number) => (
                        <MatchCard
                            key={profile.clerk_id || profile.id || String(index)}
                            profile={profile}
                            index={index}
                            onPress={() => navigation.navigate('ProfileDetail', { clerk_id: profile.clerk_id || profile.id, compatibility_score: Math.round(profile.compatibility_score ?? profile.aim_score ?? 0) })}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>CALIBRATING</Text>
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
    headerLogo: { fontFamily: 'Inter_900Black', fontSize: f(18), color: BLACK, fontStyle: 'italic', letterSpacing: -0.5 },
    headerBadge: { backgroundColor: BLACK, paddingHorizontal: w(12), paddingVertical: h(5), borderRadius: w(18) },
    headerBadgeText: { fontFamily: 'Inter_900Black', fontSize: f(10), color: '#FFFFFF', letterSpacing: 1.5, textTransform: 'uppercase' },

    heroBlock: { marginBottom: SP.xl, marginTop: SP.sm },
    heroText: { fontFamily: 'Inter_900Black', fontSize: f(38), color: BLACK, letterSpacing: -2, lineHeight: f(38), textTransform: 'uppercase' },

    card: {
        backgroundColor: BLACK, borderRadius: w(20), padding: w(18), marginBottom: SP.md,
        shadowColor: '#000', shadowOffset: { width: 0, height: h(6) }, shadowOpacity: 0.1, shadowRadius: h(12), elevation: 6,
    },
    cardTopPick: { borderLeftWidth: 5, borderLeftColor: ORANGE },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: SP.md },
    cardName: { fontFamily: 'Inter_900Black', fontSize: f(28), fontStyle: 'italic', color: '#FFFFFF', letterSpacing: -1, flex: 1 },
    cardScore: { fontFamily: 'Inter_900Black', fontSize: f(28), color: '#00C853', letterSpacing: -1 },
    cardDescription: {
        fontFamily: 'Inter_700Bold', fontSize: f(11), color: 'rgba(255,255,255,0.85)',
        textTransform: 'uppercase', lineHeight: f(18), letterSpacing: -0.2, marginBottom: SP.lg,
    },
    cardSharedContext: { fontFamily: 'Inter_800ExtraBold', fontSize: f(10), color: '#00C853', letterSpacing: 1.5, textTransform: 'uppercase' },
    topPickBadge: {
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
        paddingHorizontal: w(10), paddingVertical: h(5),
        alignSelf: 'flex-start', borderRadius: 4, marginTop: SP.sm,
    },
    topPickText: { fontFamily: 'Inter_900Black', fontSize: f(9), color: '#FFFFFF', letterSpacing: 1.5 },

    emptyContainer: { alignItems: 'center', paddingVertical: h(60), paddingHorizontal: H_PAD },
    emptyTitle: { fontFamily: 'Inter_900Black', fontSize: f(28), color: BLACK, letterSpacing: -1, marginBottom: SP.sm },
    emptySubtext: {
        fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(13,13,13,0.45)',
        textAlign: 'center', lineHeight: f(19),
    },

    askBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: H_PAD },
    askBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: BLACK, paddingHorizontal: w(20), paddingVertical: h(16), borderRadius: w(32),
        shadowColor: '#000', shadowOffset: { width: 0, height: h(10) }, shadowOpacity: 0.15, shadowRadius: h(20), elevation: 10,
    },
    askBarText: { fontFamily: 'Inter_900Black', fontSize: f(12), color: '#FFFFFF', letterSpacing: 1, textTransform: 'uppercase' },
});
