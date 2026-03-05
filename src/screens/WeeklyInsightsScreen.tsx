import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import COLORS from '../constants/colors';
import { w, h, f, SP, H_PAD, SCREEN_W } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const StatCard = ({ label, value, trend, icon, color }: { label: string, value: number, trend: number, icon: any, color: string }) => {
    const isUp = trend > 0;
    const isDown = trend < 0;

    return (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={w(20)} color={color} />
            </View>
            <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{label}</Text>
                <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{value}</Text>
                    {trend !== 0 && (
                        <View style={[styles.trendBadge, { backgroundColor: isUp ? '#00C85315' : '#FF3B3015' }]}>
                            <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={w(10)} color={isUp ? '#00C853' : '#FF3B30'} />
                            <Text style={[styles.trendText, { color: isUp ? '#00C853' : '#FF3B30' }]}>
                                {Math.abs(trend)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default function WeeklyInsightsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const insights = useQuery(api.ai.weeklyInsights.getMyLatestWeeklyInsight);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (insights !== undefined) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]).start();
        }
    }, [insights]);

    if (insights === undefined) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={ORANGE} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + h(20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Weekly Insights</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + h(40) }]}
            >
                {!insights ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.pulseContainer}>
                            <MaterialCommunityIcons name="chart-timeline-variant" size={w(40)} color={ORANGE} />
                        </View>
                        <Text style={styles.emptyTitle}>Gathering Data</Text>
                        <Text style={styles.emptySubtitle}>
                            Your first weekly insight is being prepared. Check back in a few days as you interact more with the community!
                        </Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <Text style={styles.sectionTitle}>Activity Summary</Text>
                        <View style={styles.statsGrid}>
                            <StatCard
                                label="Profile Views"
                                value={insights.profileViews}
                                trend={insights.profileViews - insights.prevProfileViews}
                                icon="eye-outline"
                                color="#5856D6"
                            />
                            <StatCard
                                label="Likes Received"
                                value={insights.likesReceived}
                                trend={insights.likesReceived - insights.prevLikesReceived}
                                icon="heart-outline"
                                color="#FF2D55"
                            />
                            <StatCard
                                label="Matches"
                                value={insights.matchesMade}
                                trend={insights.matchesMade - insights.prevMatchesMade}
                                icon="account-group-outline"
                                color="#FF9500"
                            />
                            <StatCard
                                label="AlignPoints"
                                value={insights.apsReceived ?? 0}
                                trend={0}
                                icon="zap-outline"
                                color="#FFCC00"
                            />
                        </View>

                        <View style={styles.insightBox}>
                            <View style={styles.insightHeader}>
                                <Ionicons name="sparkles" size={w(18)} color={ORANGE} />
                                <Text style={styles.insightTitle}>WHAT'S WORKING</Text>
                            </View>
                            <Text style={styles.insightText}>{insights.whatsWorking}</Text>
                        </View>

                        <View style={[styles.insightBox, { backgroundColor: BLACK }]}>
                            <View style={styles.insightHeader}>
                                <Feather name="trending-up" size={w(18)} color={CREAM} />
                                <Text style={[styles.insightTitle, { color: CREAM }]}>FOR NEXT WEEK</Text>
                            </View>
                            <Text style={[styles.insightText, { color: 'rgba(255,255,255,0.7)' }]}>{insights.recommendation}</Text>
                        </View>

                        <View style={styles.qualityBox}>
                            <Text style={styles.qualityNote}>{insights.aimQualityNote}</Text>
                        </View>
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: CREAM,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: CREAM,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(18),
        color: BLACK,
        letterSpacing: -0.5,
    },
    content: {
        paddingHorizontal: H_PAD,
        paddingTop: 10,
    },
    sectionTitle: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(14),
        color: 'rgba(13,13,13,0.35)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 15,
        marginTop: 10,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statCard: {
        width: (SCREEN_W - H_PAD * 2 - w(15)) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
    },
    statIconContainer: {
        width: w(40),
        height: w(40),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statInfo: {
        flex: 1,
    },
    statLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(10),
        color: 'rgba(13,13,13,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontFamily: 'Inter_900Black',
        fontSize: f(18),
        color: BLACK,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    trendText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(9),
    },
    insightBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    insightTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(11),
        color: BLACK,
        letterSpacing: 1.5,
    },
    insightText: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(15),
        lineHeight: f(24),
        color: 'rgba(13,13,13,0.7)',
    },
    qualityBox: {
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    qualityNote: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(12),
        fontStyle: 'italic',
        color: 'rgba(13,13,13,0.4)',
        textAlign: 'center',
        lineHeight: f(18),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: h(80),
    },
    pulseContainer: {
        width: w(100),
        height: w(100),
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        shadowColor: ORANGE,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    emptyTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(24),
        color: BLACK,
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: f(14),
        color: 'rgba(13,13,13,0.4)',
        textAlign: 'center',
        lineHeight: f(22),
        paddingHorizontal: 30,
    }
});
