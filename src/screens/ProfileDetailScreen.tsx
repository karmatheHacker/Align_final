import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    StyleSheet,
    Modal,
    FlatList,
    Easing,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Zap } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { BLACK, CREAM, ORANGE } from '../constants/colors';
import { w, h, f, H_PAD, SCREEN_W, SCREEN_H } from '../utils/responsive';

const W = SCREEN_W;
const HERO_H = SCREEN_H * 0.56;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
    clerk_id: string;
    name: string;
    birthday: string | null;
    bio: string | null;
    hometown: string | null;
    location: string | null;
    workplace: string | null;
    education: string | null;
    school: string | null;
    pronouns: string[] | null;
    sexuality: string | null;
    relationship_type: string | null;
    dating_intention: string | null;
    children: string | null;
    religion: string | null;
    politics: string | null;
    drinking: string | null;
    tobacco: string | null;
    drugs: string | null;
    gender: string | null;
    height: { value: number; unit: string } | null;
    verificationStatus?: string;
}

interface ProfilePromptData {
    id: string;
    prompt_question: string;
    prompt_answer: string;
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

function buildIdentityPills(p: ProfileData) {
    const pills: { category: string; value: string }[] = [];
    if (p.gender) pills.push({ category: 'GENDER', value: p.gender });
    if (p.pronouns && p.pronouns.length > 0) pills.push({ category: 'PRONOUNS', value: p.pronouns.join(' / ') });
    if (p.height) pills.push({ category: 'HEIGHT', value: `${p.height.value}${p.height.unit}` });
    if (p.sexuality) pills.push({ category: 'SEXUALITY', value: p.sexuality });
    if (p.dating_intention) pills.push({ category: 'INTENT', value: p.dating_intention });
    if (p.relationship_type) pills.push({ category: 'LOOKING FOR', value: p.relationship_type });
    if (p.children) pills.push({ category: 'FAMILY', value: p.children });
    if (p.religion) pills.push({ category: 'RELIGION', value: p.religion });
    if (p.politics) pills.push({ category: 'POLITICS', value: p.politics });
    return pills;
}

function buildLifestyle(p: ProfileData) {
    const items: { icon: any; label: string; value: string }[] = [];
    if (p.drinking) items.push({ icon: 'wine-outline', label: 'Drinks', value: p.drinking });
    if (p.tobacco) items.push({ icon: 'leaf-outline', label: 'Smokes', value: p.tobacco });
    if (p.drugs) items.push({ icon: 'flask-outline', label: 'Substances', value: p.drugs });
    return items;
}

function buildBackground(p: ProfileData) {
    const rows: { label: string; value: string }[] = [];
    if (p.education) rows.push({ label: 'EDUCATION', value: p.education });
    if (p.school) rows.push({ label: 'SCHOOL', value: p.school });
    if (p.workplace) rows.push({ label: 'WORKS AT', value: p.workplace });
    if (p.hometown) rows.push({ label: 'BASED IN', value: p.hometown });
    return rows;
}

// ─── Photo Carousel Dots ────────────────────────────────────────────────────────
function CarouselDot({ active }: { active: boolean }) {
    const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(anim, {
            toValue: active ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [active]);

    const width = anim.interpolate({ inputRange: [0, 1], outputRange: [4, 16] });
    const backgroundColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.5)', ORANGE] });

    return (
        <Animated.View style={[styles.progressDot, { width, backgroundColor, borderRadius: 2, marginHorizontal: 2 }]} />
    );
}

// ─── Hero Photo Carousel ──────────────────────────────────────────────────────
function PhotoCarousel({ photos, name, age, location, isVerified }: { photos: string[]; name: string; age: number | null; location: string; isVerified?: boolean }) {
    const [index, setIndex] = useState(0);
    const flatRef = useRef<FlatList>(null);

    const onScroll = (e: any) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / W);
        if (i !== index) setIndex(i);
    };

    const goTo = (dir: 1 | -1) => {
        const next = Math.max(0, Math.min(photos.length - 1, index + dir));
        flatRef.current?.scrollToIndex({ index: next, animated: true });
    };

    return (
        <View style={{ height: HERO_H }}>
            <FlatList
                ref={flatRef}
                data={photos}
                horizontal
                pagingEnabled
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                nestedScrollEnabled={true}
                renderItem={({ item }) => (
                    <Image source={{ uri: item as string }} style={{ width: W, height: HERO_H }} resizeMode="cover" />
                )}
            />

            {/* Dark gradient overlay */}
            <View style={styles.heroGradient} pointerEvents="none" />

            {/* Photo counter pill */}
            <View style={styles.counterPill}>
                <Text style={styles.counterText}>{index + 1} / {photos.length}</Text>
            </View>

            {/* Chevron navigation */}
            {index > 0 && (
                <TouchableOpacity style={[styles.chevron, styles.chevronLeft]} onPress={() => goTo(-1)} activeOpacity={0.8}>
                    <Ionicons name="chevron-back" size={w(18)} color="#FFFFFF" />
                </TouchableOpacity>
            )}
            {index < photos.length - 1 && (
                <TouchableOpacity style={[styles.chevron, styles.chevronRight]} onPress={() => goTo(1)} activeOpacity={0.8}>
                    <Ionicons name="chevron-forward" size={w(18)} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Name / Age / Location overlay */}
            <View style={styles.heroTextBlock}>
                <View style={styles.progressRow}>
                    {photos.map((_, i) => (
                        <CarouselDot key={`dot-${i}`} active={i === index} />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(10) }}>
                    <Text style={styles.heroName} allowFontScaling={false}>{name}{age ? `, ${age}` : ''}</Text>
                    {isVerified && (
                        <View style={{ width: w(22), height: w(22), borderRadius: w(11), backgroundColor: '#00FF88', alignItems: 'center', justifyContent: 'center', marginTop: h(4) }}>
                            <Ionicons name="checkmark" size={w(14)} color={BLACK} />
                        </View>
                    )}
                </View>
                {location ? <Text style={styles.heroLocation} allowFontScaling={false}>{location}</Text> : null}
            </View>
        </View>
    );
}

// ─── Section Label ─────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
    return <Text style={styles.sectionLabel}>{text}</Text>;
}

// ─── Light Card wrapper ────────────────────────────────────────────────────────
function LightCard({ children, style }: { children: React.ReactNode; style?: object }) {
    return <View style={[styles.lightCard, style]}>{children}</View>;
}

// ─── Toast Notification ────────────────────────────────────────────────────────
function ToastNotification({ msg, visible }: { msg: string; visible: boolean }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 200, useNativeDriver: true })
            ]).start();
        } else {
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }
    }, [visible]);

    return (
        <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
            <Zap size={w(14)} color={ORANGE} fill={ORANGE} />
            <Text style={styles.toastText}>{msg}</Text>
        </Animated.View>
    );
}

// ─── AP Send Bottom Sheet ──────────────────────────────────────────────────────
function ApSendSheet({ visible, onDismiss, onConfirm, profileName, profilePhoto }: { visible: boolean; onDismiss: () => void; onConfirm: (count: number) => void; profileName: string; profilePhoto: string }) {
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sheetY = useRef(new Animated.Value(500)).current;
    const [apCount, setApCount] = useState(1);

    React.useEffect(() => {
        if (visible) {
            setApCount(1);
            Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            Animated.spring(sheetY, { toValue: 0, damping: 25, stiffness: 120, useNativeDriver: true }).start();
        } else {
            overlayOpacity.setValue(0);
            sheetY.setValue(500);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
            <Animated.View style={[styles.sheetBackdrop, { opacity: overlayOpacity }]}>
                <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }], paddingBottom: 40 }]}>
                    <TouchableOpacity style={{ position: 'absolute', top: h(22), right: w(22), width: w(36), height: w(36), alignItems: 'center', justifyContent: 'center' }} onPress={onDismiss} activeOpacity={0.8}>
                        <Ionicons name="close" size={w(20)} color="rgba(13,13,13,0.38)" />
                    </TouchableOpacity>

                    {/* Header: Photo and Name */}
                    {profilePhoto ? <Image source={{ uri: profilePhoto }} style={{ width: w(64), height: w(64), borderRadius: w(32), marginBottom: h(14) }} /> : null}
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: f(22), color: BLACK, textTransform: 'uppercase', marginBottom: h(4), letterSpacing: -0.5 }}>{profileName}</Text>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: f(10), color: 'rgba(13,13,13,0.38)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: h(28) }}>SEND ALIGNPOINTS</Text>

                    {/* Stepper */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(28), marginBottom: h(36) }}>
                        <TouchableOpacity style={styles.stepperBtn} onPress={() => setApCount(Math.max(1, apCount - 1))} activeOpacity={0.7}>
                            <Ionicons name="remove" size={w(22)} color={BLACK} />
                        </TouchableOpacity>

                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: f(48), color: BLACK, minWidth: w(56), textAlign: 'center', letterSpacing: -1 }}>{apCount}</Text>

                        <TouchableOpacity style={styles.stepperBtn} onPress={() => setApCount(apCount + 1)} activeOpacity={0.7}>
                            <Ionicons name="add" size={w(22)} color={BLACK} />
                        </TouchableOpacity>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.sheetBtn} onPress={() => onConfirm(apCount)} activeOpacity={0.85}>
                        <Zap size={w(16)} color={CREAM} fill={CREAM} />
                        <Text style={styles.sheetBtnText}>SEND APS</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ─── Success Bottom Sheet ──────────────────────────────────────────────────────
function SuccessSheet({ visible, onDismiss, profileName, profilePhoto }: { visible: boolean; onDismiss: () => void; profileName: string; profilePhoto: string }) {
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sheetY = useRef(new Animated.Value(400)).current;
    const avatarScale = useRef(new Animated.Value(0.8)).current;
    const avatarOpacity = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0)).current;
    const checkRotate = useRef(new Animated.Value(-20)).current;
    const textY = useRef(new Animated.Value(20)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const btnOpacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            Animated.spring(sheetY, { toValue: 0, damping: 25, stiffness: 120, useNativeDriver: true }).start();

            Animated.sequence([
                Animated.delay(200),
                Animated.parallel([
                    Animated.timing(avatarOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.spring(avatarScale, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true })
                ])
            ]).start();

            Animated.sequence([
                Animated.delay(400),
                Animated.parallel([
                    Animated.spring(checkScale, { toValue: 1, damping: 12, stiffness: 150, useNativeDriver: true }),
                    Animated.spring(checkRotate, { toValue: 0, damping: 12, stiffness: 150, useNativeDriver: true })
                ])
            ]).start();

            Animated.sequence([
                Animated.delay(500),
                Animated.parallel([
                    Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(textY, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
                    Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true })
                ])
            ]).start();
        } else {
            overlayOpacity.setValue(0);
            sheetY.setValue(400);
            avatarScale.setValue(0.8);
            avatarOpacity.setValue(0);
            checkScale.setValue(0);
            checkRotate.setValue(-20);
            textY.setValue(20);
            textOpacity.setValue(0);
            btnOpacity.setValue(0);
        }
    }, [visible]);

    if (!visible) return null;

    const checkRotation = checkRotate.interpolate({
        inputRange: [-20, 0],
        outputRange: ['-20deg', '0deg']
    });

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
            <Animated.View style={[styles.sheetBackdrop, { opacity: overlayOpacity }]}>
                <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>

                    <Animated.View style={[styles.sheetAvatarRing, { opacity: avatarOpacity, transform: [{ scale: avatarScale }] }]}>
                        {profilePhoto ? <Image source={{ uri: profilePhoto }} style={styles.sheetAvatar} /> : <View style={[styles.sheetAvatar, { backgroundColor: '#333' }]} />}
                        <Animated.View style={[styles.sheetCheck, { transform: [{ scale: checkScale }, { rotate: checkRotation }] }]}>
                            <Ionicons name="checkmark" size={w(14)} color="#FFFFFF" />
                        </Animated.View>
                    </Animated.View>

                    <Animated.View style={{ alignItems: 'center', opacity: textOpacity, transform: [{ translateY: textY }] }}>
                        <Text style={styles.sheetTitle}>REQUEST{'\n'}SENT.</Text>
                        <View style={styles.sheetTagRow}>
                            {['INTENTIONAL', 'ALIGNED'].map((t) => (
                                <View key={t} style={styles.sheetTag}>
                                    <Text style={styles.sheetTagText}>{t}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.sheetSub}>
                            Your request is on its way. If {profileName} accepts, you'll both be notified instantly.
                        </Text>
                    </Animated.View>

                    <Animated.View style={{ width: '100%', opacity: btnOpacity, marginTop: h(12) }}>
                        <TouchableOpacity style={styles.sheetBtn} onPress={onDismiss} activeOpacity={0.85}>
                            <Text style={styles.sheetBtnText}>CONTINUE BROWSING</Text>
                            <Ionicons name="arrow-forward" size={w(16)} color={CREAM} />
                        </TouchableOpacity>
                    </Animated.View>

                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileDetailScreen() {
    const scrollRef = useRef<ScrollView>(null);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const userId = route.params?.userId;
    const initialScore: number = route.params?.compatibility_score ?? 0;
    const explanation: string | null = route.params?.explanation ?? null;

    // ── Data Fetching ───────────────────────────────────────────────────
    const convexProfile = useQuery(api.users.getProfileById, { userId });
    const isLoading = convexProfile === undefined;

    // ── Local state derived from Query or Params ─────────────────────────
    const profileData = convexProfile || null;
    const photos = convexProfile?.photos || [];
    const prompts = convexProfile?.prompts || [];
    const voicePrompt = null; // To be implemented with voiceProfiles table later
    const compatScore = initialScore;

    const getCompatibilityInsights = useAction(api.ai.insights.getCompatibilityInsights);
    const [insights, setInsights] = useState<any>(null);
    const [insightsGenerating, setInsightsGenerating] = useState(false);

    const recordProfileView = useMutation(api.swipes.recordProfileView);

    // Record view once the real clerkId is available
    useEffect(() => {
        if (profileData?.clerk_id) {
            recordProfileView({ viewedClerkId: profileData.clerk_id });
        }
    }, [profileData?.clerk_id]);

    // Fetch compatibility insights when we have a score and target
    useEffect(() => {
        if (!profileData?.clerk_id || !compatScore) return;
        setInsightsGenerating(true);
        getCompatibilityInsights({ otherClerkId: profileData.clerk_id })
            .then((data) => {
                if (data) setInsights(data);
                setInsightsGenerating(data?.generating ?? false);
            })
            .catch(() => setInsightsGenerating(false));
    }, [profileData?.clerk_id]);

    const [success, setSuccess] = useState(false);
    const [apSheetVisible, setApSheetVisible] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    // ── Derived Data ─────────────────────────────────────────────────────
    const displayName = (profileData?.name || 'UNKNOWN').toUpperCase();
    const age = route.params?.age || calculateAge(profileData?.birthday || null);
    const location = (profileData?.location || profileData?.hometown || '').toUpperCase();
    const identity = profileData ? buildIdentityPills(profileData) : [];
    const lifestyle = profileData ? buildLifestyle(profileData) : [];
    const background = profileData ? buildBackground(profileData) : [];
    const bio = profileData?.bio || '';
    const aiBio = profileData?.aiBio || '';
    const personality = profileData?.personality || null;
    const aiReason = explanation || (compatScore > 0
        ? `${displayName} scores ${compatScore}% based on AI personality vector analysis, behavioral compatibility modeling, and shared value alignment.`
        : 'Compatibility is still being calculated by the ALIGN engine.');

    const handleSendApsConfirm = async (count: number) => {
        // No-op without backend
        setApSheetVisible(false);
        setToastMsg(`${count} APS SENT TO ${displayName}`);
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 3000);
    };

    const handleSendRequest = async () => {
        // No-op without backend
        setSuccess(true);
    };

    // ── Loading State ────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: CREAM, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={BLACK} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar style="light" />

            {/* Back + Report overlay buttons */}
            <View style={[styles.topBar, { top: insets.top + h(10) }]}>
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-down" size={w(22)} color={BLACK} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Report', { clerk_id: profileData?.clerk_id })} activeOpacity={0.8}>
                    <Ionicons name="flag-outline" size={w(18)} color={BLACK} />
                </TouchableOpacity>
            </View>

            {/* Manual Scroll Toggle */}
            <TouchableOpacity
                style={styles.scrollToggle}
                onPress={() => scrollRef.current?.scrollTo({ y: h(600), animated: true })}
                activeOpacity={0.8}
            >
                <Ionicons name="arrow-down" size={w(20)} color={CREAM} />
                <Text style={styles.scrollToggleText}>VIEW INFO</Text>
            </TouchableOpacity>

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 250 }}
                showsVerticalScrollIndicator={true}
            >
                {/* ── Hero ──────────────────────────────────────────────── */}
                {photos.length > 0 ? (
                    <PhotoCarousel
                        photos={photos}
                        name={displayName}
                        age={age}
                        location={location}
                        isVerified={profileData?.verificationStatus === 'approved'}
                    />
                ) : (
                    <View style={{ height: HERO_H, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={w(72)} color="rgba(255,255,255,0.18)" />
                        <View style={[styles.heroTextBlock, { position: 'absolute', bottom: h(24) }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(10) }}>
                                <Text style={styles.heroName} allowFontScaling={false}>{displayName}{age ? `, ${age}` : ''}</Text>
                                {profileData?.verificationStatus === 'approved' && (
                                    <View style={{ width: w(22), height: w(22), borderRadius: w(11), backgroundColor: '#00FF88', alignItems: 'center', justifyContent: 'center', marginTop: h(4) }}>
                                        <Ionicons name="checkmark" size={w(14)} color={BLACK} />
                                    </View>
                                )}
                            </View>
                            {location ? <Text style={styles.heroLocation} allowFontScaling={false}>{location}</Text> : null}
                        </View>
                    </View>
                )}

                <View style={styles.content}>
                    {/* ── AI Alignment Card ─────────────────────────────── */}
                    <View style={styles.aiCard}>
                        <View style={styles.aiTopRow}>
                            <View style={styles.greenDot} />
                            <Text style={styles.aiLabel}>AI ALIGNMENT SCORE</Text>
                        </View>
                        <Text style={styles.aiPct}>{compatScore}%</Text>

                        <View style={styles.whyMatchedContainer}>
                            <Text style={styles.whyMatchedLabel}>ALIGNED ANALYSIS</Text>
                            {insightsGenerating ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(8) }}>
                                    <ActivityIndicator size="small" color={ORANGE} />
                                    <Text style={styles.aiReason}>Generating deep compatibility analysis…</Text>
                                </View>
                            ) : insights?.narrative ? (
                                <>
                                    <Text style={styles.aiReason}>{insights.narrative}</Text>

                                    {/* Dimension Breakdown */}
                                    {insights.dimensions?.length > 0 && (
                                        <View style={{ marginTop: h(24) }}>
                                            <Text style={[styles.whyMatchedLabel, { marginBottom: h(14) }]}>COMPATIBILITY BREAKDOWN</Text>
                                            {insights.dimensions.map((d: any, i: number) => (
                                                <View key={i} style={{ marginBottom: h(12) }}>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: h(4) }}>
                                                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: f(10), color: 'rgba(245,240,235,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>{d.label}</Text>
                                                        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: f(10), color: CREAM }}>{Math.round(d.score)}%</Text>
                                                    </View>
                                                    <View style={{ height: h(4), backgroundColor: 'rgba(245,240,235,0.1)', borderRadius: 2 }}>
                                                        <View style={{ height: '100%', width: `${d.score}%`, backgroundColor: ORANGE, borderRadius: 2 }} />
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {insights.topStrengths?.length > 0 && (
                                        <View style={{ marginTop: h(14) }}>
                                            <Text style={[styles.whyMatchedLabel, { marginBottom: h(6) }]}>TOP ALIGNMENTS</Text>
                                            {insights.topStrengths.slice(0, 3).map((s: string, i: number) => (
                                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: h(4) }}>
                                                    <View style={{ width: w(6), height: w(6), borderRadius: w(3), backgroundColor: '#00FF88', marginRight: w(8) }} />
                                                    <Text style={[styles.aiReason, { fontSize: f(12) }]}>{s}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <Text style={styles.aiReason}>{aiReason}</Text>
                            )}
                        </View>
                    </View>

                    {/* ── Voice Prompt ──────────────────────────────────── */}
                    {voicePrompt && (
                        <>
                            <SectionLabel text="VOICE PROMPT" />
                            <LightCard>
                                <View style={styles.voiceRow}>
                                    <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
                                        <Ionicons name="play" size={w(18)} color={CREAM} />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.voiceQ}>"{voicePrompt}"</Text>
                                        <View style={styles.waveform}>
                                            {Array.from({ length: 28 }).map((_, i) => (
                                                <View
                                                    key={`wave-${i}`}
                                                    style={[
                                                        styles.waveBar,
                                                        {
                                                            height: 4 + Math.sin(i * 0.7) * 10 + Math.random() * 6,
                                                            backgroundColor: i < 10 ? ORANGE : 'rgba(13,13,13,0.18)',
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </LightCard>
                        </>
                    )}

                    {/* ── Bio ───────────────────────────────────────────── */}
                    {bio ? (
                        <>
                            <SectionLabel text="ABOUT" />
                            <LightCard>
                                <Text style={styles.bioText}>{bio}</Text>
                            </LightCard>
                        </>
                    ) : null}

                    {/* ── Written Prompts ───────────────────────────────── */}
                    {prompts.length > 0 && (
                        <>
                            <SectionLabel text="PROMPTS" />
                            <LightCard>
                                {prompts.map((prompt: any, index: number) => (
                                    <View
                                        key={`prompt-${prompt.id || index}`}
                                        style={index < prompts.length - 1 ? styles.promptBorder : undefined}
                                    >
                                        <Text style={styles.promptQ}>{prompt.prompt_question || prompt.question}</Text>
                                        <Text style={styles.promptA}>{prompt.prompt_answer || prompt.answer}</Text>
                                    </View>
                                ))}
                            </LightCard>
                        </>
                    )}

                    {/* ── Personality Profile ────────────────────────────── */}
                    {personality && (
                        <>
                            <SectionLabel text="PERSONALITY PROFILE" />
                            <LightCard>
                                {personality.lifeStage ? (
                                    <View style={styles.promptBorder}>
                                        <Text style={styles.promptQ}>LIFE STAGE</Text>
                                        <Text style={[styles.promptA, { textTransform: 'uppercase', letterSpacing: 1, fontSize: f(14) }]}>{personality.lifeStage.replace(/-/g, ' ')}</Text>
                                    </View>
                                ) : null}
                                {personality.communicationStyle ? (
                                    <View style={styles.promptBorder}>
                                        <Text style={styles.promptQ}>COMMUNICATION STYLE</Text>
                                        <Text style={[styles.promptA, { textTransform: 'uppercase', letterSpacing: 1, fontSize: f(14) }]}>{personality.communicationStyle.replace(/-/g, ' ')}</Text>
                                    </View>
                                ) : null}
                                {personality.values && Array.isArray(personality.values) && personality.values.length > 0 ? (
                                    <View style={styles.promptBorder}>
                                        <Text style={styles.promptQ}>CORE VALUES</Text>
                                        <View style={[styles.tagWrap, { marginTop: h(8) }]}>
                                            {personality.values.map((v: any, i: number) => (
                                                <View key={`val-${userId}-${i}`} style={[styles.tag, { borderColor: 'rgba(255,107,0,0.2)', backgroundColor: 'rgba(255,107,0,0.02)' }]}>
                                                    <Text style={[styles.tagText, { color: ORANGE, fontSize: f(10) }]}>{String(v).toUpperCase()}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : null}
                                {personality.interestVector && Array.isArray(personality.interestVector) && personality.interestVector.length > 0 ? (
                                    <View style={{ paddingTop: h(4) }}>
                                        <Text style={styles.promptQ}>INTERESTS</Text>
                                        <View style={[styles.tagWrap, { marginTop: h(8) }]}>
                                            {personality.interestVector.map((v: any, i: number) => (
                                                <View key={`int-${userId}-${i}`} style={styles.tag}>
                                                    <Text style={styles.tagText}>{String(v).toUpperCase()}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                ) : null}
                            </LightCard>
                        </>
                    )}

                    {/* ── Identity & Background ─────────────────────────── */}
                    {identity.length > 0 && (
                        <>
                            <SectionLabel text="IDENTITY" />
                            <View style={styles.tagWrap}>
                                {identity.map((item, idx) => (
                                    <View key={`identity-${item.category}-${idx}`} style={styles.identityPill}>
                                        <Text style={styles.pillCategory}>{item.category}</Text>
                                        <Text style={styles.pillValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {background.length > 0 && (
                        <>
                            <SectionLabel text="BACKGROUND" />
                            <LightCard>
                                {background.map((item, idx) => (
                                    <View key={`bg-${idx}`} style={idx < background.length - 1 ? styles.bgRowBorder : undefined}>
                                        <View style={styles.bgRow}>
                                            <Text style={styles.bgLabel}>{item.label}</Text>
                                            <Text style={styles.bgValue}>{item.value}</Text>
                                        </View>
                                    </View>
                                ))}
                            </LightCard>
                        </>
                    )}

                    {/* ── Lifestyle ─────────────────────────────────────── */}
                    {lifestyle.length > 0 && (
                        <>
                            <SectionLabel text="LIFESTYLE" />
                            <LightCard>
                                <View style={styles.lifestyleGrid}>
                                    {lifestyle.map((item, idx) => (
                                        <View key={`lifestyle-${idx}`} style={styles.lifestyleCell}>
                                            <Text style={styles.lifestyleLabel}>{item.label}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(6) }}>
                                                <Ionicons name={item.icon} size={w(14)} color={BLACK} />
                                                <Text style={styles.lifestyleValue}>{item.value}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </LightCard>
                        </>
                    )}

                    {/* ── Matchmaking Deep Dive ────────────────────────── */}
                    {aiBio ? (
                        <>
                            <SectionLabel text="THE DEEP DIVE" />
                            <LightCard style={{ backgroundColor: '#F9F7F2', borderColor: 'rgba(13,13,13,0.03)' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: w(8), marginBottom: h(12) }}>
                                    <View style={{ padding: w(6), backgroundColor: BLACK, borderRadius: 8 }}>
                                        <Zap size={w(12)} color={CREAM} fill={CREAM} />
                                    </View>
                                    <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: f(10), color: BLACK, letterSpacing: 2 }}>MATCHMAKING BIO</Text>
                                </View>
                                <Text style={[styles.bioText, { color: 'rgba(13,13,13,0.7)', fontStyle: 'italic' }]}>"{aiBio}"</Text>
                                <View style={{ marginTop: h(16), paddingTop: h(16), borderTopWidth: 1, borderTopColor: 'rgba(13,13,13,0.05)' }}>
                                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: f(9), color: 'rgba(13,13,13,0.4)', lineHeight: f(14) }}>
                                        This profile summary is generated by the ALIGN engine to highlight deep compatibility factors based on shared values and life goals.
                                    </Text>
                                </View>
                            </LightCard>
                        </>
                    ) : null}
                </View>
            </ScrollView>

            {/* Action buttons removed as per user request */}

            {/* ── Success Sheet ────────────────────────────────────────── */}
            <SuccessSheet
                visible={success}
                onDismiss={() => { setSuccess(false); navigation.goBack(); }}
                profileName={displayName}
                profilePhoto={photos[0] || ''}
            />

            {/* ── AP Send Sheet ────────────────────────────────────────── */}
            <ApSendSheet
                visible={apSheetVisible}
                onDismiss={() => setApSheetVisible(false)}
                onConfirm={handleSendApsConfirm}
                profileName={displayName}
                profilePhoto={photos[0] || ''}
            />

            {/* Context-level Toast */}
            <ToastNotification msg={toastMsg} visible={toastVisible} />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1 },

    // Top back/report bar
    topBar: {
        position: 'absolute',
        left: w(16),
        right: w(16),
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 50,
    },
    iconCircle: {
        width: w(44),
        height: w(44),
        borderRadius: w(22),
        backgroundColor: 'rgba(245,240,235,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Hero carousel
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: HERO_H * 0.55,
        backgroundColor: 'transparent',
    },
    counterPill: {
        position: 'absolute',
        top: h(16),
        alignSelf: 'center',
        backgroundColor: 'rgba(13,13,13,0.45)',
        paddingHorizontal: w(12),
        paddingVertical: h(5),
        borderRadius: 100,
    },
    counterText: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(10),
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    chevron: {
        position: 'absolute',
        top: '50%',
        width: w(38),
        height: w(38),
        borderRadius: w(19),
        backgroundColor: 'rgba(13,13,13,0.38)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -w(19),
    },
    chevronLeft: { left: w(12) },
    chevronRight: { right: w(12) },
    heroTextBlock: {
        position: 'absolute',
        bottom: h(24),
        left: H_PAD,
        right: H_PAD,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(4),
        marginBottom: h(10),
    },
    progressDot: {
        height: h(4),
    },
    heroName: {
        fontFamily: 'Inter_900Black',
        fontSize: Math.round(W * 0.14),
        color: '#FFFFFF',
        letterSpacing: -1.5,
        lineHeight: Math.round(W * 0.135),
    },
    heroLocation: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: 'rgba(255,255,255,0.65)',
        textTransform: 'uppercase',
        letterSpacing: 2.5,
        marginTop: h(6),
    },

    // Content area
    content: {
        paddingHorizontal: H_PAD,
        paddingTop: h(20),
    },

    // Section label
    sectionLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: h(10),
        marginTop: h(22),
    },

    // Light card
    lightCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: w(22),
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.06)',
        padding: w(20),
    },

    // AI card
    aiCard: {
        backgroundColor: BLACK,
        borderRadius: w(28),
        padding: w(24),
        marginBottom: h(2),
    },
    aiTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(8),
        marginBottom: h(4),
    },
    greenDot: {
        width: w(8),
        height: w(8),
        borderRadius: w(4),
        backgroundColor: '#00FF88',
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    aiLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: 'rgba(245,240,235,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 2.5,
    },
    aiPct: {
        fontFamily: 'Inter_900Black',
        fontSize: f(68),
        color: CREAM,
        letterSpacing: -2,
        lineHeight: f(72),
        marginBottom: h(10),
    },
    whyMatchedContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(245,240,235,0.1)',
        paddingTop: h(20),
    },
    whyMatchedLabel: {
        fontFamily: 'Inter_900Black',
        fontSize: f(9),
        color: ORANGE,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: h(10),
    },
    aiReason: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(13),
        color: 'rgba(245,240,235,0.65)',
        lineHeight: f(20),
    },

    // Voice prompt
    voiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(16),
    },
    playBtn: {
        width: w(48),
        height: w(48),
        borderRadius: w(24),
        backgroundColor: BLACK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceQ: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(13),
        color: BLACK,
        marginBottom: h(10),
        fontStyle: 'italic',
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(2),
        height: h(24),
    },
    waveBar: {
        width: w(3),
        borderRadius: w(2),
    },

    // Bio
    bioText: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(14),
        color: BLACK,
        lineHeight: f(22),
    },

    // Prompts
    promptQ: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: 'rgba(13,13,13,0.4)',
        letterSpacing: 1.5,
        marginBottom: h(8),
        textTransform: 'uppercase',
    },
    promptA: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(16),
        color: BLACK,
        lineHeight: f(24),
    },
    promptBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.06)',
        marginBottom: h(16),
        paddingBottom: h(16),
    },

    // Tags
    tagWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: w(8),
    },
    tag: {
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.1)',
        paddingHorizontal: w(14),
        paddingVertical: h(8),
    },
    tagText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: f(12),
        color: BLACK,
    },

    // Identity pills
    identityPill: {
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.08)',
        paddingHorizontal: w(14),
        paddingVertical: h(8),
        alignItems: 'center',
    },
    pillCategory: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(9),
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: h(2),
    },
    pillValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(12),
        color: BLACK,
    },

    // Lifestyle grid
    lifestyleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: w(10),
    },
    lifestyleCell: {
        width: (W - H_PAD * 2 - w(10)) / 2,
        alignItems: 'flex-start',
        gap: h(6),
    },
    lifestyleLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    lifestyleValue: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(15),
        color: BLACK,
    },

    // Background rows
    bgRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: h(13),
    },
    bgRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.07)',
    },
    bgLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    bgValue: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: f(13),
        color: BLACK,
    },

    // Floating action bar
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(10),
        paddingHorizontal: H_PAD,
        paddingTop: h(14),
        backgroundColor: 'rgba(245,240,235,0.97)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -h(6) },
        shadowOpacity: 0.1,
        shadowRadius: h(20),
        elevation: 20,
    },
    passBtn: {
        width: w(56),
        height: w(56),
        borderRadius: w(28),
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtn: {
        height: h(54),
        borderRadius: w(27),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: w(8),
    },
    sendBtnText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(11),
        color: CREAM,
        textTransform: 'uppercase',
        letterSpacing: 2.5,
    },
    apBtn: {
        height: h(54),
        backgroundColor: BLACK,
        borderRadius: w(27),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: w(18),
        gap: w(7),
    },
    apBtnText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: CREAM,
        letterSpacing: 1.5,
    },

    // Success sheet
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(13,13,13,0.65)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: CREAM,
        borderTopLeftRadius: w(44),
        borderTopRightRadius: w(44),
        paddingTop: h(36),
        paddingHorizontal: w(28),
        paddingBottom: h(52),
        alignItems: 'center',
    },
    sheetAvatarRing: {
        width: w(88),
        height: w(88),
        borderRadius: w(44),
        borderWidth: 3,
        borderColor: ORANGE,
        padding: w(4),
        marginBottom: h(24),
        position: 'relative',
    },
    sheetAvatar: {
        flex: 1,
        borderRadius: w(40),
        opacity: 0.75,
    },
    sheetCheck: {
        position: 'absolute',
        bottom: -w(4),
        right: -w(4),
        width: w(28),
        height: w(28),
        borderRadius: w(14),
        backgroundColor: ORANGE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: CREAM,
    },
    sheetTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(52),
        color: BLACK,
        letterSpacing: -2,
        lineHeight: f(50),
        textAlign: 'center',
        marginBottom: h(18),
    },
    sheetTagRow: {
        flexDirection: 'row',
        gap: w(8),
        marginBottom: h(18),
    },
    sheetTag: {
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.18)',
        borderRadius: 100,
        paddingHorizontal: w(14),
        paddingVertical: h(6),
    },
    sheetTagText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    sheetSub: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(13),
        color: 'rgba(13,13,13,0.5)',
        textAlign: 'center',
        lineHeight: f(20),
        marginBottom: h(28),
    },
    sheetBtn: {
        height: h(54),
        backgroundColor: BLACK,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: w(10),
        paddingHorizontal: w(28),
        alignSelf: 'stretch',
    },
    sheetBtnText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(11),
        color: CREAM,
        textTransform: 'uppercase',
        letterSpacing: 2.5,
    },
    stepperBtn: {
        width: w(52),
        height: w(52),
        borderRadius: w(26),
        backgroundColor: 'rgba(13,13,13,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: h(110),
        alignSelf: 'center',
        backgroundColor: BLACK,
        paddingHorizontal: w(20),
        paddingVertical: h(13),
        borderRadius: w(30),
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: h(6) },
        shadowOpacity: 0.2,
        shadowRadius: h(14),
        elevation: 10,
        zIndex: 1000,
    },
    toastText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(11),
        color: CREAM,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    scrollToggle: {
        position: 'absolute',
        right: w(20),
        bottom: h(160),
        backgroundColor: BLACK,
        borderRadius: 100,
        paddingHorizontal: w(16),
        paddingVertical: h(10),
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(6),
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    scrollToggleText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(10),
        color: CREAM,
        letterSpacing: 1,
    },
});
