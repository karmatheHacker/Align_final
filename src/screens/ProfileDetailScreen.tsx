import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
    StyleSheet,
    Modal,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Platform,
    Easing,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Zap } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { getAuthenticatedSupabase } from '../config/supabase';
import { BLACK, CREAM, ORANGE } from '../constants/colors';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H * 0.58;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
    clerk_id: string;
    name: string;
    birthday: string | null;
    bio: string | null;
    hometown: string | null;
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
    if (p.pronouns && p.pronouns.length > 0) pills.push({ category: 'PRONOUNS', value: p.pronouns.join(' / ') });
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
function PhotoCarousel({ photos, name, age, location }: { photos: string[]; name: string; age: number | null; location: string }) {
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
                    <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            )}
            {index < photos.length - 1 && (
                <TouchableOpacity style={[styles.chevron, styles.chevronRight]} onPress={() => goTo(1)} activeOpacity={0.8}>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {/* Name / Age / Location overlay */}
            <View style={styles.heroTextBlock}>
                <View style={styles.progressRow}>
                    {photos.map((_, i) => (
                        <CarouselDot key={i} active={i === index} />
                    ))}
                </View>
                <Text style={styles.heroName} allowFontScaling={false}>{name}{age ? `, ${age}` : ''}</Text>
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
            <Zap size={14} color={ORANGE} fill={ORANGE} />
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
                    <TouchableOpacity style={{ position: 'absolute', top: 24, right: 24, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }} onPress={onDismiss} activeOpacity={0.8}>
                        <Ionicons name="close" size={20} color="rgba(13,13,13,0.4)" />
                    </TouchableOpacity>

                    {/* Header: Photo and Name */}
                    {profilePhoto ? <Image source={{ uri: profilePhoto }} style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 16 }} /> : null}
                    <Text style={{ fontSize: 24, fontWeight: '900', color: BLACK, textTransform: 'uppercase', marginBottom: 4, letterSpacing: -1 }}>{profileName}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(13,13,13,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 32 }}>SEND ALIGNPOINTS</Text>

                    {/* Stepper */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32, marginBottom: 40 }}>
                        <TouchableOpacity style={styles.stepperBtn} onPress={() => setApCount(Math.max(1, apCount - 1))} activeOpacity={0.7}>
                            <Ionicons name="remove" size={24} color={BLACK} />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 48, fontWeight: '900', color: BLACK, minWidth: 60, textAlign: 'center' }}>{apCount}</Text>

                        <TouchableOpacity style={styles.stepperBtn} onPress={() => setApCount(apCount + 1)} activeOpacity={0.7}>
                            <Ionicons name="add" size={24} color={BLACK} />
                        </TouchableOpacity>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.sheetBtn} onPress={() => onConfirm(apCount)} activeOpacity={0.85}>
                        <Zap size={16} color={CREAM} fill={CREAM} />
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
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
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

                    <Animated.View style={{ width: '100%', opacity: btnOpacity, marginTop: 12 }}>
                        <TouchableOpacity style={styles.sheetBtn} onPress={onDismiss} activeOpacity={0.85}>
                            <Text style={styles.sheetBtnText}>CONTINUE BROWSING</Text>
                            <Ionicons name="arrow-forward" size={16} color={CREAM} />
                        </TouchableOpacity>
                    </Animated.View>

                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileDetailScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { getToken } = useAuth();
    const { user } = useUser();
    const targetClerkId = route.params?.clerk_id;
    const initialScore: number = route.params?.compatibility_score ?? 0;

    // ── Real Data State ──────────────────────────────────────────────────
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const [prompts, setPrompts] = useState<ProfilePromptData[]>([]);
    const [compatScore, setCompatScore] = useState<number>(initialScore);

    const [voicePrompt, setVoicePrompt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [success, setSuccess] = useState(false);
    const [apSheetVisible, setApSheetVisible] = useState(false);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    // ── Fetch Real Profile Data ──────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            if (!targetClerkId) { setIsLoading(false); return; }
            try {
                const token = await getToken({ template: 'supabase' });
                if (!token) { setIsLoading(false); return; }
                const client = getAuthenticatedSupabase(token);

                // Parallel fetch all data
                const [profileRes, photosRes, promptsRes, aimRes, voiceRes] = await Promise.all([
                    client.from('profiles').select('*').eq('clerk_id', targetClerkId).single(),
                    client.from('photos').select('photo_url').eq('clerk_id', targetClerkId).order('position', { ascending: true }),
                    client.from('profile_prompts').select('*').eq('clerk_id', targetClerkId),
                    client.rpc('get_home_aim_matches', { p_limit: 50 }),
                    client.from('voice_profiles').select('prompt_text').eq('clerk_id', targetClerkId).maybeSingle(),
                ]);

                if (profileRes.data) {
                    setProfileData(profileRes.data as ProfileData);
                    // Photos: prefer photos table, fall back to profile.photo_urls array
                    if (photosRes.data && photosRes.data.length > 0) {
                        setPhotos(photosRes.data.map((p: any) => p.photo_url).filter(Boolean));
                    } else if (profileRes.data.photo_urls && profileRes.data.photo_urls.length > 0) {
                        setPhotos((profileRes.data.photo_urls as string[]).filter(Boolean));
                    }
                }
                if (promptsRes.data) setPrompts(promptsRes.data as ProfilePromptData[]);
                if (voiceRes.data) setVoicePrompt(voiceRes.data.prompt_text);

                // Compatibility score: only query if not already provided via nav params
                if (initialScore === 0) {
                    let scoreFound = false;
                    // 1) Check AIM matches first (fast, already fetched)
                    if (aimRes.data) {
                        const aimMatch = (aimRes.data as any[]).find((m: any) => m.clerk_id === targetClerkId);
                        if (aimMatch) {
                            setCompatScore(Math.round(aimMatch.compatibility_score ?? 0));
                            scoreFound = true;
                        }
                    }
                    // 2) Fallback: query compatibility_predictions table for this pair
                    if (!scoreFound && user?.id) {
                        const [pred1, pred2] = await Promise.all([
                            client.from('compatibility_predictions')
                                .select('predicted_success_score')
                                .eq('user1_clerk_id', user.id)
                                .eq('user2_clerk_id', targetClerkId)
                                .maybeSingle(),
                            client.from('compatibility_predictions')
                                .select('predicted_success_score')
                                .eq('user1_clerk_id', targetClerkId)
                                .eq('user2_clerk_id', user.id)
                                .maybeSingle(),
                        ]);
                        const score = pred1.data?.predicted_success_score ?? pred2.data?.predicted_success_score;
                        if (score != null) setCompatScore(Math.round(score));
                    }
                }
            } catch (err) {
                console.warn('Profile fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [targetClerkId, getToken]);

    // ── Derived Data ─────────────────────────────────────────────────────
    const displayName = (profileData?.name || 'UNKNOWN').toUpperCase();
    const age = calculateAge(profileData?.birthday || null);
    const location = (profileData?.hometown || '').toUpperCase();
    const identity = profileData ? buildIdentityPills(profileData) : [];
    const lifestyle = profileData ? buildLifestyle(profileData) : [];
    const background = profileData ? buildBackground(profileData) : [];
    const bio = profileData?.bio || '';
    const aiReason = compatScore > 0
        ? `${displayName} scores ${compatScore}% based on AI personality vector analysis, behavioral compatibility modeling, and shared value alignment.`
        : 'Compatibility is still being calculated by the ALIGN engine.';

    const handleSendApsConfirm = async (count: number) => {
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const client = getAuthenticatedSupabase(token);
            const { error } = await client.rpc('send_alignpoints', {
                p_receiver_id: targetClerkId,
                p_amount: count,
            });
            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setApSheetVisible(false);
                setToastMsg(`${count} APS SENT TO ${displayName}`);
                setToastVisible(true);
                setTimeout(() => setToastVisible(false), 3000);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send APs');
        }
    };

    const handleSendRequest = async () => {
        try {
            const token = await getToken({ template: 'supabase' });
            if (!token) return;
            const client = getAuthenticatedSupabase(token);
            const { error } = await client.rpc('swipe_right', { p_receiver_id: targetClerkId });
            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to send request');
        }
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
            <View style={[styles.topBar, { top: insets.top + 8 }]}>
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <Ionicons name="chevron-down" size={24} color={BLACK} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Report', { clerk_id: targetClerkId })} activeOpacity={0.8}>
                    <Ionicons name="flag-outline" size={18} color={BLACK} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
                bounces={true}
                nestedScrollEnabled={true}
            >
                {/* ── Hero ──────────────────────────────────────────────── */}
                {photos.length > 0 ? (
                    <PhotoCarousel photos={photos} name={displayName} age={age} location={location} />
                ) : (
                    <View style={{ height: HERO_H, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={80} color="rgba(255,255,255,0.2)" />
                        <View style={[styles.heroTextBlock, { position: 'absolute', bottom: 20 }]}>
                            <Text style={styles.heroName} allowFontScaling={false}>{displayName}{age ? `, ${age}` : ''}</Text>
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
                        <Text style={styles.aiReason}>{aiReason}</Text>
                    </View>

                    {/* ── Voice Prompt ──────────────────────────────────── */}
                    {voicePrompt && (
                        <>
                            <SectionLabel text="VOICE PROMPT" />
                            <LightCard>
                                <View style={styles.voiceRow}>
                                    <TouchableOpacity style={styles.playBtn} activeOpacity={0.8}>
                                        <Ionicons name="play" size={18} color={CREAM} />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.voiceQ}>"{voicePrompt}"</Text>
                                        <View style={styles.waveform}>
                                            {Array.from({ length: 28 }).map((_, i) => (
                                                <View
                                                    key={i}
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
                                {prompts.map((prompt: ProfilePromptData, index: number) => (
                                    <View
                                        key={prompt.id}
                                        style={index < prompts.length - 1 ? styles.promptBorder : undefined}
                                    >
                                        <Text style={styles.promptQ}>{prompt.prompt_question}</Text>
                                        <Text style={styles.promptA}>{prompt.prompt_answer}</Text>
                                    </View>
                                ))}
                            </LightCard>
                        </>
                    )}

                    {/* ── Identity Pills ────────────────────────────────── */}
                    {identity.length > 0 && (
                        <>
                            <SectionLabel text="IDENTITY" />
                            <View style={styles.tagWrap}>
                                {identity.map((item) => (
                                    <View key={item.category} style={styles.identityPill}>
                                        <Text style={styles.pillCategory}>{item.category}</Text>
                                        <Text style={styles.pillValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* ── Lifestyle Grid ────────────────────────────────── */}
                    {lifestyle.length > 0 && (
                        <>
                            <SectionLabel text="LIFESTYLE" />
                            <View style={styles.lifestyleGrid}>
                                {lifestyle.map((item) => (
                                    <LightCard key={item.label} style={styles.lifestyleCell}>
                                        <Ionicons name={item.icon} size={20} color="rgba(13,13,13,0.4)" />
                                        <Text style={styles.lifestyleLabel}>{item.label}</Text>
                                        <Text style={styles.lifestyleValue}>{item.value}</Text>
                                    </LightCard>
                                ))}
                            </View>
                        </>
                    )}

                    {/* ── Background Rows ───────────────────────────────── */}
                    {background.length > 0 && (
                        <>
                            <SectionLabel text="BACKGROUND" />
                            <LightCard>
                                {background.map((item, i: number) => (
                                    <View
                                        key={item.label}
                                        style={[
                                            styles.bgRow,
                                            i < background.length - 1 && styles.bgRowBorder,
                                        ]}
                                    >
                                        <Text style={styles.bgLabel}>{item.label}</Text>
                                        <Text style={styles.bgValue}>{item.value}</Text>
                                    </View>
                                ))}
                            </LightCard>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* ── Floating Action Bar ──────────────────────────────────── */}
            <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
                {/* Pass button */}
                <TouchableOpacity style={styles.passBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={BLACK} />
                </TouchableOpacity>

                {/* Send APs */}
                <TouchableOpacity
                    style={styles.apBtn}
                    activeOpacity={0.8}
                    onPress={() => setApSheetVisible(true)}
                >
                    <Zap size={14} color={CREAM} fill={CREAM} />
                    <Text style={styles.apBtnText}>SEND APS</Text>
                </TouchableOpacity>

                {/* Send Request */}
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.85}
                    onPress={handleSendRequest}
                >
                    <View style={[styles.sendBtn, { backgroundColor: BLACK }]}>
                        <Text style={styles.sendBtnText}>SEND REQUEST</Text>
                        <Ionicons name="arrow-forward" size={16} color={CREAM} />
                    </View>
                </TouchableOpacity>
            </View>

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
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 50,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(245,240,235,0.9)',
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
        top: 16,
        alignSelf: 'center',
        backgroundColor: 'rgba(13,13,13,0.45)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 100,
    },
    counterText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    chevron: {
        position: 'absolute',
        top: '50%',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(13,13,13,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -18,
    },
    chevronLeft: { left: 12 },
    chevronRight: { right: 12 },
    heroTextBlock: {
        position: 'absolute',
        bottom: 20,
        left: 24,
        right: 24,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    progressDot: {
        height: 4,
    },
    heroName: {
        fontSize: Math.round(W * 0.16),
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -2,
        lineHeight: Math.round(W * 0.155),
    },
    heroLocation: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2.5,
        marginTop: 6,
    },

    // Content area
    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
    },

    // Section label
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginBottom: 10,
        marginTop: 24,
    },

    // Light card
    lightCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.07)',
        padding: 20,
    },

    // AI card
    aiCard: {
        backgroundColor: BLACK,
        borderRadius: 32,
        padding: 28,
        marginBottom: 4,
    },
    aiTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF88',
        shadowColor: '#00FF88',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },
    aiLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(245,240,235,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 2.5,
    },
    aiPct: {
        fontSize: 80,
        fontWeight: '900',
        color: CREAM,
        letterSpacing: -3,
        lineHeight: 80,
        marginBottom: 12,
    },
    aiReason: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(245,240,235,0.7)',
        lineHeight: 20,
    },

    // Voice prompt
    voiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    playBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: BLACK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voiceQ: {
        fontSize: 13,
        fontWeight: '700',
        color: BLACK,
        marginBottom: 10,
        fontStyle: 'italic',
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        height: 24,
    },
    waveBar: {
        width: 3,
        borderRadius: 2,
    },

    // Bio
    bioText: {
        fontSize: 14,
        fontWeight: '500',
        color: BLACK,
        lineHeight: 22,
    },

    // Prompts
    promptQ: {
        fontSize: 11,
        fontWeight: '800',
        color: 'rgba(13,13,13,0.4)',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    promptA: {
        fontSize: 16,
        fontWeight: '500',
        color: BLACK,
        lineHeight: 24,
    },
    promptBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.06)',
        marginBottom: 16,
        paddingBottom: 16,
    },

    // Tags
    tagWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: BLACK,
    },

    // Identity pills
    identityPill: {
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.08)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignItems: 'center',
    },
    pillCategory: {
        fontSize: 9,
        fontWeight: '800',
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 2,
    },
    pillValue: {
        fontSize: 12,
        fontWeight: '700',
        color: BLACK,
    },

    // Lifestyle grid
    lifestyleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    lifestyleCell: {
        width: (W - 48 - 10) / 2,
        alignItems: 'flex-start',
        gap: 6,
    },
    lifestyleLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    lifestyleValue: {
        fontSize: 15,
        fontWeight: '700',
        color: BLACK,
    },

    // Background rows
    bgRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    bgRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.07)',
    },
    bgLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(13,13,13,0.38)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    bgValue: {
        fontSize: 13,
        fontWeight: '600',
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
        gap: 12,
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: 'rgba(245,240,235,0.95)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 20,
    },
    passBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtn: {
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    sendBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: CREAM,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    apBtn: {
        height: 60,
        backgroundColor: BLACK,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 8,
    },
    apBtnText: {
        fontSize: 10,
        fontWeight: '800',
        color: CREAM,
        letterSpacing: 1.5,
    },

    // Success sheet
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(13,13,13,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: CREAM,
        borderTopLeftRadius: 48,
        borderTopRightRadius: 48,
        paddingTop: 40,
        paddingHorizontal: 32,
        paddingBottom: 52,
        alignItems: 'center',
    },
    sheetAvatarRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: ORANGE,
        padding: 4,
        marginBottom: 28,
        position: 'relative',
    },
    sheetAvatar: {
        flex: 1,
        borderRadius: 44,
        opacity: 0.7,
    },
    sheetCheck: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: ORANGE,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: CREAM,
    },
    sheetTitle: {
        fontSize: 64,
        fontWeight: '900',
        color: BLACK,
        letterSpacing: -2,
        lineHeight: 60,
        textAlign: 'center',
        marginBottom: 20,
    },
    sheetTagRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    sheetTag: {
        borderWidth: 1,
        borderColor: 'rgba(13,13,13,0.2)',
        borderRadius: 100,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    sheetTagText: {
        fontSize: 10,
        fontWeight: '800',
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    sheetSub: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(13,13,13,0.55)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    sheetBtn: {
        height: 56,
        backgroundColor: BLACK,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 32,
        alignSelf: 'stretch',
    },
    sheetBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: CREAM,
        textTransform: 'uppercase',
        letterSpacing: 3,
    },
    stepperBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(13,13,13,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: 110,
        alignSelf: 'center',
        backgroundColor: BLACK,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
        zIndex: 1000,
    },
    toastText: {
        fontSize: 11,
        fontWeight: '800',
        color: CREAM,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});
