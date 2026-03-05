import React, { useRef } from 'react';
import { View, Text, ImageBackground, FlatList, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Zap } from 'lucide-react-native';
import COLORS from '../constants/colors';
import { w, h, f, SP, H_PAD, SCREEN_W } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const COL_GAP = w(10);
const CARD_WIDTH = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;

interface LikeEntry {
    _id: string;
    clerkId: string;
    name: string;
    photos: string[];
    swipedAt: number;
}

// ─── Like Card ──────────────────────────────────────────────────────────────
const LikeCard = ({ item, onPress }: { item: LikeEntry; onPress: () => void }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const photoUrl = item.photos?.[0] || null;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                {photoUrl ? (
                    <ImageBackground
                        source={{ uri: photoUrl }}
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
                                <Text style={styles.intentText}>LIKED YOU</Text>
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
                                <Text style={styles.intentText}>LIKED YOU</Text>
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

    const likes = useQuery(api.swipes.getPendingLikes);
    const isLoading = likes === undefined;

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
                            onPress={() => navigation.navigate('ProfileDetail', {
                                userId: item._id,
                            })}
                        />
                    )}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + h(100) }]}
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={styles.headline}>LIKES</Text>
                            {likes.length > 0 && (
                                <Text style={styles.subheadline}>{likes.length} PEOPLE LIKED YOU</Text>
                            )}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>NO LIKES YET</Text>
                            <Text style={styles.emptySubtext}>
                                When someone likes you, they'll appear here.
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
    header: { marginTop: SP.sm, marginBottom: SP.lg },
    headline: {
        fontFamily: 'Inter_900Black', fontSize: f(36),
        lineHeight: f(38), color: BLACK, textTransform: 'uppercase', letterSpacing: -2,
    },
    subheadline: {
        fontFamily: 'Inter_700Bold', fontSize: f(10),
        color: 'rgba(13,13,13,0.4)', letterSpacing: 2,
        textTransform: 'uppercase', marginTop: SP.xs,
    },
    row: { justifyContent: 'space-between', marginBottom: COL_GAP },
    card: {
        width: CARD_WIDTH, aspectRatio: 3 / 4, borderRadius: w(22), backgroundColor: BLACK,
        shadowColor: '#000', shadowOffset: { width: 0, height: h(8) }, shadowOpacity: 0.12, shadowRadius: h(14), elevation: 8,
    },
    image: { width: '100%', height: '100%', justifyContent: 'flex-end' },
    darkGradientMap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: w(22) },
    overlay: { padding: w(14), paddingBottom: w(16) },
    name: { fontFamily: 'Inter_900Black', fontSize: f(15), color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: -0.3 },
    intentRow: { flexDirection: 'row', alignItems: 'center', marginTop: h(4), gap: w(4) },
    intentText: { fontFamily: 'Inter_700Bold', fontSize: f(9), color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5, textTransform: 'uppercase' },

    emptyContainer: { alignItems: 'center', paddingVertical: h(60), paddingHorizontal: H_PAD },
    emptyTitle: { fontFamily: 'Inter_900Black', fontSize: f(22), color: BLACK, letterSpacing: -0.5, marginBottom: SP.sm },
    emptySubtext: { fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(13,13,13,0.45)', textAlign: 'center', lineHeight: f(19) },
});
