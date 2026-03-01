import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, ImageBackground, FlatList, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Zap } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';
import COLORS from '../constants/colors';
import { getAuthenticatedSupabase } from '../config/supabase';
import { w, h, f, SP, H_PAD, SCREEN_W } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const COL_GAP = w(10);
const CARD_WIDTH = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;

interface LikeEntry {
    clerk_id: string;
    name: string;
    total_ap: number;
    photo_url: string | null;
    is_like: boolean;
}

// ─── Like Card ──────────────────────────────────────────────────────────────
const LikeCard = ({ item, onPress }: { item: LikeEntry; onPress: () => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                {item.photo_url ? (
                    <ImageBackground
                        source={{ uri: item.photo_url }}
                        style={styles.image}
                        imageStyle={{ borderRadius: w(20) }}
                        resizeMode="cover"
                    >
                        <View style={styles.darkGradientMap} />
                        <View style={styles.overlay}>
                            <Text style={styles.name} numberOfLines={1}>
                                {(item.name || 'USER').toUpperCase()}
                            </Text>
                            <View style={styles.intentRow}>
                                <Zap size={w(9)} color={ORANGE} fill={ORANGE} />
                                <Text style={styles.intentText}>{item.total_ap} APs</Text>
                            </View>
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={[styles.image, { alignItems: 'center', justifyContent: 'flex-end', backgroundColor: '#1A1A1A', borderRadius: w(20) }]}>
                        <View style={styles.overlay}>
                            <Text style={styles.name} numberOfLines={1}>
                                {(item.name || 'USER').toUpperCase()}
                            </Text>
                            <View style={styles.intentRow}>
                                <Zap size={w(9)} color={ORANGE} fill={ORANGE} />
                                <Text style={styles.intentText}>{item.total_ap} APs</Text>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LikesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { getToken } = useAuth();

    const [likes, setLikes] = useState<LikeEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLikes = useCallback(async () => {
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const client = getAuthenticatedSupabase(token);

            // Fetch priority queue (people who sent APs / liked this user)
            // then enrich with profile info in a single join via RPC or separate query
            const { data: queueData, error: queueErr } = await client
                .rpc('get_priority_queue');

            if (queueErr) {
                console.warn('get_priority_queue error:', queueErr.message);
                setLikes([]);
                return;
            }

            if (!queueData || queueData.length === 0) {
                setLikes([]);
                return;
            }

            // Extract unique sender clerk_ids
            const senderIds: string[] = queueData.map((q: any) => q.sender_clerk_id);

            // Fetch profile info for all senders in one query
            const { data: profilesData, error: profilesErr } = await client
                .from('profiles')
                .select('clerk_id, name')
                .in('clerk_id', senderIds);

            // Fetch primary photos for senders
            const { data: photosData } = await client
                .from('photos')
                .select('clerk_id, photo_url, position')
                .in('clerk_id', senderIds)
                .eq('position', 0);

            const profileMap: Record<string, { name: string }> = {};
            if (profilesData) {
                profilesData.forEach((p: any) => { profileMap[p.clerk_id] = p; });
            }

            const photoMap: Record<string, string> = {};
            if (photosData) {
                photosData.forEach((p: any) => { photoMap[p.clerk_id] = p.photo_url; });
            }

            const enriched: LikeEntry[] = queueData.map((q: any) => ({
                clerk_id: q.sender_clerk_id,
                name: profileMap[q.sender_clerk_id]?.name || 'User',
                total_ap: q.total_ap,
                photo_url: photoMap[q.sender_clerk_id] || null,
                is_like: q.is_like,
            }));

            setLikes(enriched);
        } catch (err) {
            console.error('fetchLikes error:', err);
            setLikes([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchLikes();
    }, [fetchLikes]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchLikes();
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />
            <View style={{ paddingTop: insets.top }} />

            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={BLACK} />
                </View>
            ) : (
                <FlatList
                    data={likes}
                    renderItem={({ item }) => (
                        <LikeCard
                            item={item}
                            onPress={() => navigation.navigate('ProfileDetail', { clerk_id: item.clerk_id })}
                        />
                    )}
                    keyExtractor={(item) => item.clerk_id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + h(100) }]}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={styles.headline}>LIKES</Text>
                            {likes.length > 0 && (
                                <Text style={styles.subheadline}>{likes.length} PEOPLE SENT YOU APs</Text>
                            )}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>NO LIKES YET</Text>
                            <Text style={styles.emptySubtext}>
                                When someone sends you AlignPoints, they'll appear here.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    scrollContent: { paddingHorizontal: H_PAD },
    header: { marginTop: SP.md, marginBottom: SP.xl },
    headline: {
        fontFamily: 'Inter_900Black', fontSize: f(38),
        lineHeight: f(40), color: BLACK, textTransform: 'uppercase', letterSpacing: -2,
    },
    subheadline: {
        fontFamily: 'Inter_700Bold', fontSize: f(10),
        color: 'rgba(13,13,13,0.45)', letterSpacing: 2,
        textTransform: 'uppercase', marginTop: SP.xs,
    },
    row: { justifyContent: 'space-between', marginBottom: COL_GAP },
    card: {
        width: CARD_WIDTH, aspectRatio: 3 / 4, borderRadius: w(20), backgroundColor: BLACK,
        shadowColor: '#000', shadowOffset: { width: 0, height: h(6) }, shadowOpacity: 0.1, shadowRadius: h(12), elevation: 8,
    },
    image: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    darkGradientMap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: w(20) },
    overlay: { padding: w(14) },
    name: { fontFamily: 'Inter_900Black', fontSize: f(16), color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: -0.5 },
    intentRow: { flexDirection: 'row', alignItems: 'center', marginTop: SP.xs, gap: w(5) },
    intentText: { fontFamily: 'Inter_700Bold', fontSize: f(9), color: '#FFFFFF', letterSpacing: 2, textTransform: 'uppercase' },

    emptyContainer: { alignItems: 'center', paddingVertical: h(60), paddingHorizontal: H_PAD },
    emptyTitle: { fontFamily: 'Inter_900Black', fontSize: f(22), color: BLACK, letterSpacing: -0.5, marginBottom: SP.sm },
    emptySubtext: { fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(13,13,13,0.45)', textAlign: 'center', lineHeight: f(19) },
});
