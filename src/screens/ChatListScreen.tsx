import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import COLORS from '../constants/colors';
import { useChat, Conversation } from '../context/ChatContext';
import { w, h, f, SP, H_PAD } from '../utils/responsive';
import DateFeedbackBanner from '../components/DateFeedbackBanner';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;

// ─── Time formatter ──────────────────────────────────────────────────────────
function formatTime(isoStr: string): string {
    if (!isoStr) return '';
    const now = new Date();
    const date = new Date(isoStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'NOW';
    if (diffMins < 60) return `${diffMins}M`;
    if (diffHours < 24) return `${diffHours}H`;
    return `${diffDays}D`;
}

// ─── Chat Card ──────────────────────────────────────────────────────────────
const ChatCard = ({ item, currentUserId }: { item: Conversation; currentUserId: string }) => {
    const navigation = useNavigation<any>();
    const hoverAnim = useRef(new Animated.Value(0)).current;

    const otherUser = item.other_user;
    const photoUri = otherUser?.photo_url || null;
    const displayName = (otherUser?.name || 'MATCH').toUpperCase();
    const receiverId = item.user1_clerk_id === currentUserId ? item.user2_clerk_id : item.user1_clerk_id;

    const handlePressIn = () => Animated.timing(hoverAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    const handlePressOut = () => Animated.timing(hoverAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    const handlePress = () => navigation.navigate('ActiveChat', {
        conversationId: item.id,
        receiverId,
        matchName: displayName,
        photo: photoUri,
    });

    const backgroundColor = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', '#0D0D0D'] });
    const textColor = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['#0D0D0D', CREAM] });
    const subTextColor = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(13,13,13,0.6)', 'rgba(245,240,235,0.7)'] });
    const focusOverlayOpacity = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

    const hasUnread = item.unread_count > 0 && item.last_message_sender !== currentUserId;

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress} style={styles.cardWrapper}>
            <Animated.View style={[styles.card, { backgroundColor }]}>
                <View style={styles.avatarContainer}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject as any} resizeMode="cover" />
                    ) : (
                        <View style={[StyleSheet.absoluteFillObject as any, {
                            backgroundColor: '#2A2A2A', borderRadius: w(24),
                            alignItems: 'center', justifyContent: 'center'
                        }]}>
                            <Text style={{ color: '#fff', fontFamily: 'Inter_900Black', fontSize: f(18) }}>
                                {displayName[0]}
                            </Text>
                        </View>
                    )}
                    <Animated.View style={[StyleSheet.absoluteFillObject, {
                        backgroundColor: 'rgba(0,0,0,1)', opacity: focusOverlayOpacity, borderRadius: w(24)
                    }]} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.topRow}>
                        <Animated.Text style={[styles.nameText, { color: textColor }]}>{displayName}</Animated.Text>
                        <Animated.Text style={[styles.timeText, { color: subTextColor }]}>
                            {item.last_message_at ? formatTime(item.last_message_at) : ''}
                        </Animated.Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(6) }}>
                        <Animated.Text style={[styles.previewText, { color: subTextColor, flex: 1 }]} numberOfLines={1}>
                            {item.last_message_preview || 'Start the conversation...'}
                        </Animated.Text>
                        {hasUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {item.unread_count > 9 ? '9+' : item.unread_count}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function ChatListScreen() {
    const insets = useSafeAreaInsets();
    const { conversations, isLoading, fetchConversations } = useChat();
    const { user } = useUser();

    useEffect(() => {
        fetchConversations();
    }, []);

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />
            <FlatList
                data={conversations}
                renderItem={({ item }) => (
                    <ChatCard item={item} currentUserId={user?.id || ''} />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + h(100) }]}
                showsVerticalScrollIndicator={false}
                onRefresh={fetchConversations}
                refreshing={isLoading}
                ListHeaderComponent={
                    <View style={[styles.header, { marginTop: insets.top + SP.xs }]}>
                        <Text style={styles.headline}>MESSAGES</Text>
                        <DateFeedbackBanner />
                    </View>
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>NO MESSAGES YET</Text>
                            <Text style={styles.emptySubtext}>
                                Match with someone to start a conversation.
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    scrollContent: { paddingHorizontal: H_PAD },
    header: { marginBottom: SP.md },
    headline: { fontFamily: 'Inter_900Black', fontSize: f(36), color: BLACK, letterSpacing: -2 },

    cardWrapper: { width: '100%', marginBottom: h(6) },
    card: {
        width: '100%', flexDirection: 'row', alignItems: 'center',
        padding: w(16), borderRadius: w(22),
        borderWidth: 1, borderColor: 'rgba(13,13,13,0.07)',
    },
    avatarContainer: {
        width: w(50), height: w(50), borderRadius: w(25), marginRight: w(14),
        overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(13,13,13,0.08)', backgroundColor: BLACK,
    },
    contentContainer: { flex: 1, justifyContent: 'center' },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: h(3) },
    nameText: { fontFamily: 'Inter_900Black', fontSize: f(16), flex: 1, textTransform: 'uppercase', letterSpacing: -0.3 },
    timeText: { fontFamily: 'Inter_700Bold', fontSize: f(9), textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: SP.sm, color: 'rgba(13,13,13,0.38)' },
    previewText: { fontFamily: 'Inter_500Medium', fontSize: f(13), lineHeight: f(18) },

    unreadBadge: {
        backgroundColor: COLORS.primary, borderRadius: 100,
        minWidth: w(18), height: w(18),
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: w(4),
    },
    unreadText: { fontFamily: 'Inter_900Black', fontSize: f(9), color: '#fff' },

    emptyContainer: { alignItems: 'center', paddingVertical: h(60), paddingHorizontal: H_PAD },
    emptyTitle: { fontFamily: 'Inter_900Black', fontSize: f(22), color: BLACK, letterSpacing: -0.5, marginBottom: SP.sm },
    emptySubtext: { fontFamily: 'Inter_500Medium', fontSize: f(13), color: 'rgba(13,13,13,0.45)', textAlign: 'center', lineHeight: f(19) },
});
