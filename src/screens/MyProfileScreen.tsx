import React, { useRef, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Image, Animated,
    StyleSheet, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import COLORS from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { w, h, f, SP, H_PAD } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;
const RED = COLORS.error;

// ─── Menu items ───────────────────────────────────────────────────────────────
const MENU_ITEMS: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    route?: string;
    action?: string;
    danger?: boolean;
}[] = [
        { icon: 'card-outline', label: 'SUBSCRIPTION & BILLING', route: 'Subscription' },
        { icon: 'settings-outline', label: 'ACCOUNT SETTINGS', route: 'Settings' },
        { icon: 'shield-outline', label: 'PRIVACY & SAFETY' },
        { icon: 'log-out-outline', label: 'SIGN OUT', action: 'signout' },
        { icon: 'trash-outline', label: 'DELETE ACCOUNT', action: 'delete', danger: true },
    ];

// ─── Animated Menu Row ────────────────────────────────────────────────────────
function MenuItem({
    icon, label, onPress, danger,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    onPress?: () => void;
    danger?: boolean;
}) {
    const anim = useRef(new Animated.Value(0)).current;
    const handleIn = () => Animated.timing(anim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
    const handleOut = () => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

    const normalFill = danger ? 'rgba(239,68,68,0.06)' : '#FFFFFF';
    const pressedFill = danger ? RED : BLACK;

    const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [normalFill, pressedFill] });
    const contentOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const invertedOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    const iconColor = danger ? RED : 'rgba(13,13,13,0.4)';
    const labelColor = danger ? RED : BLACK;
    const arrowColor = danger ? RED : ORANGE;
    const borderColor = danger ? 'rgba(239,68,68,0.18)' : 'rgba(13,13,13,0.07)';

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handleIn} onPressOut={handleOut} onPress={onPress}>
            <Animated.View style={[styles.menuItem, { backgroundColor: bgColor, borderColor }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, styles.menuInner, { opacity: contentOpacity }]}>
                    <Ionicons name={icon} size={w(18)} color={iconColor} />
                    <Text style={[styles.menuLabel, { color: labelColor }]}>{label}</Text>
                    <Ionicons name="arrow-forward" size={w(14)} color={arrowColor} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFillObject, styles.menuInner, { opacity: invertedOpacity }]}>
                    <Ionicons name={icon} size={w(18)} color={CREAM} />
                    <Text style={[styles.menuLabel, { color: CREAM }]}>{label}</Text>
                    <Ionicons name="arrow-forward" size={w(14)} color={CREAM} />
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── Delete Account Modal ─────────────────────────────────────────────────────
function DeleteAccountModal({
    visible, onCancel, onConfirm, isDeleting,
}: {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}) {
    const insets = useSafeAreaInsets();

    const WHAT_GETS_DELETED = [
        'Your profile & photos',
        'All messages & conversations',
        'AlignPoints balance',
        'Matches & connections',
        'Subscription benefits',
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            {/* Backdrop */}
            <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={isDeleting ? undefined : onCancel}
            />

            {/* Bottom Sheet */}
            <View style={[styles.modalCard, { paddingBottom: insets.bottom + h(24) }]}>
                {/* Handle */}
                <View style={styles.modalHandle} />

                {/* Icon */}
                <View style={styles.modalIconWrap}>
                    <Ionicons name="trash" size={w(28)} color={RED} />
                </View>

                {/* Heading */}
                <Text style={styles.modalTitle}>DELETE ACCOUNT</Text>
                <Text style={styles.modalSubtitle}>
                    This action is{' '}
                    <Text style={{ color: RED }}>permanent and irreversible.</Text>
                    {'\n'}Everything will be erased immediately.
                </Text>

                {/* What gets deleted */}
                <View style={styles.modalList}>
                    {WHAT_GETS_DELETED.map((item) => (
                        <View key={item} style={styles.modalListRow}>
                            <Ionicons name="close-circle" size={w(14)} color={RED} />
                            <Text style={styles.modalListText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Buttons */}
                <TouchableOpacity
                    style={styles.deleteBtn}
                    activeOpacity={0.85}
                    onPress={onConfirm}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.deleteBtnText}>YES, DELETE MY ACCOUNT</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelBtn}
                    activeOpacity={0.7}
                    onPress={onCancel}
                    disabled={isDeleting}
                >
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { profile, photos, apBalance, setProfile } = useProfile();
    const { signOut } = useAuth();
    const deleteAccountMutation = useMutation(api.users.deleteCurrentAccount);

    const profileReview = useQuery(api.ai.profileReview.getMyProfileReview);
    const weeklyInsight = useQuery(api.ai.weeklyInsights.getMyLatestWeeklyInsight);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const displayName = profile?.name?.toUpperCase() || 'YOU';
    const photoUrl = photos?.[0]?.photo_url || profile?.photo_urls?.[0];

    const handleMenu = async (route?: string, action?: string) => {
        if (action === 'signout') {
            await signOut();
            setProfile(null);
            return;
        }
        if (action === 'delete') { setShowDeleteModal(true); return; }
        if (route) navigation.navigate(route);
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await deleteAccountMutation();
            await signOut();
            // Clear local profile state
            setProfile(null);
            setShowDeleteModal(false);
        } catch {
            Alert.alert('Error', 'Could not delete your account. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />
            <View style={{ paddingTop: insets.top }} />

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + h(100) }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('EditProfile')} style={styles.header}>
                    <Text style={styles.headline} allowFontScaling={false}>{displayName}.</Text>
                    <View style={styles.avatarRing}>
                        {photoUrl ? (
                            <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
                        ) : (
                            <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={w(28)} color="rgba(13,13,13,0.3)" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* AlignPoints Card */}
                <View style={styles.apCard}>
                    <View style={styles.apTopRow}>
                        <View style={styles.apBalanceContainer}>
                            <Text style={styles.apLabel}>AlignPoints</Text>
                            <Text style={styles.apBalance} numberOfLines={1} adjustsFontSizeToFit>
                                {apBalance?.balance?.toLocaleString('en-IN') ?? '0'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.buyBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Subscription')}>
                            <Text style={styles.buyBtnText}>BUY MORE</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.apFootnote}>
                        Points reset monthly. Upgrade to Premium for unlimited boosts and priority matching.
                    </Text>
                </View>

                {/* AI Profile Review Card */}
                {profileReview ? (
                    <View style={styles.aiCard}>
                        <View style={styles.aiCardHeader}>
                            <Ionicons name="sparkles" size={w(13)} color={ORANGE} />
                            <Text style={styles.aiCardTitle}>AI PROFILE INSIGHTS</Text>
                        </View>
                        <View style={styles.aiSection}>
                            <Text style={styles.aiSectionLabel}>WHAT'S WORKING</Text>
                            <Text style={styles.aiSectionText}>{profileReview.whatsWorking}</Text>
                        </View>
                        <View style={styles.aiDivider} />
                        <View style={styles.aiSection}>
                            <Text style={[styles.aiSectionLabel, { color: RED }]}>QUICK FIXES</Text>
                            <Text style={styles.aiSectionText}>{profileReview.fixes}</Text>
                        </View>
                        <View style={styles.aiDivider} />
                        <View style={styles.aiSection}>
                            <Text style={[styles.aiSectionLabel, { color: ORANGE }]}>YOUR STANDOUT</Text>
                            <Text style={styles.aiSectionText}>{profileReview.standout}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.aiCard, { alignItems: 'center', paddingVertical: h(28) }]}>
                        <Ionicons name="sparkles-outline" size={w(22)} color="rgba(0,0,0,0.2)" />
                        <Text style={styles.aiEmptyLabel}>AI PROFILE INSIGHTS</Text>
                        <Text style={styles.aiEmptyText}>Complete your profile to unlock AI-powered review and tips.</Text>
                    </View>
                )}

                {/* Weekly Insights Card */}
                {weeklyInsight ? (
                    <View style={[styles.aiCard, { marginBottom: SP.lg }]}>
                        <View style={styles.aiCardHeader}>
                            <Ionicons name="bar-chart" size={w(13)} color={ORANGE} />
                            <Text style={styles.aiCardTitle}>THIS WEEK</Text>
                        </View>
                        <View style={styles.weekRow}>
                            <View style={styles.weekStat}>
                                <Text style={styles.weekStatNum}>{weeklyInsight.profileViews}</Text>
                                <Text style={styles.weekStatLabel}>VIEWS</Text>
                            </View>
                            <View style={styles.weekStatDivider} />
                            <View style={styles.weekStat}>
                                <Text style={styles.weekStatNum}>{weeklyInsight.likesReceived}</Text>
                                <Text style={styles.weekStatLabel}>LIKES</Text>
                            </View>
                            <View style={styles.weekStatDivider} />
                            <View style={styles.weekStat}>
                                <Text style={styles.weekStatNum}>{weeklyInsight.matchesMade}</Text>
                                <Text style={styles.weekStatLabel}>MATCHES</Text>
                            </View>
                        </View>
                        <View style={styles.aiDivider} />
                        <View style={styles.aiSection}>
                            <Text style={styles.aiSectionLabel}>WHAT'S WORKING</Text>
                            <Text style={styles.aiSectionText}>{weeklyInsight.whatsWorking}</Text>
                        </View>
                        <View style={styles.aiDivider} />
                        <View style={styles.aiSection}>
                            <Text style={[styles.aiSectionLabel, { color: ORANGE }]}>ALIGN'S RECOMMENDATION</Text>
                            <Text style={styles.aiSectionText}>{weeklyInsight.recommendation}</Text>
                        </View>
                        {weeklyInsight.aimQualityNote ? (
                            <>
                                <View style={styles.aiDivider} />
                                <View style={styles.aiSection}>
                                    <Text style={styles.aiSectionLabel}>AIM QUALITY NOTE</Text>
                                    <Text style={styles.aiSectionText}>{weeklyInsight.aimQualityNote}</Text>
                                </View>
                            </>
                        ) : null}
                    </View>
                ) : null}

                {/* Menu */}
                <View style={styles.menuList}>
                    {MENU_ITEMS.map((item) => (
                        <MenuItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            danger={item.danger}
                            onPress={() => handleMenu(item.route, item.action)}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* Delete Account Modal */}
            <DeleteAccountModal
                visible={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                isDeleting={isDeleting}
            />
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    flex1: { flex: 1 },
    scrollContent: { paddingHorizontal: H_PAD, paddingTop: SP.sm },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.lg },
    headline: {
        fontFamily: 'Inter_900Black',
        fontSize: f(44),
        color: BLACK, textTransform: 'uppercase', letterSpacing: -2,
        lineHeight: f(42), flex: 1,
    },
    avatarRing: { width: w(64), height: w(64), borderRadius: w(32), borderWidth: 2, borderColor: BLACK, padding: 3, overflow: 'hidden', marginLeft: SP.md, marginTop: SP.xs },
    avatarImg: { flex: 1, borderRadius: w(32), opacity: 0.9 },
    avatarPlaceholder: { backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },

    apCard: {
        position: 'relative', borderRadius: w(24), padding: w(20), marginBottom: SP.lg,
        backgroundColor: BLACK, shadowColor: '#000', shadowOffset: { width: 0, height: h(8) }, shadowOpacity: 0.18, shadowRadius: h(16), elevation: 8,
    },
    apTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SP.sm },
    apBalanceContainer: { flex: 1 },
    apLabel: { fontFamily: 'Inter_800ExtraBold', fontSize: f(9), color: ORANGE, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: SP.xs },
    apBalance: { fontFamily: 'Inter_900Black', fontSize: f(44), lineHeight: f(48), color: '#FFFFFF', letterSpacing: -2 },
    buyBtn: { backgroundColor: CREAM, borderRadius: 100, paddingHorizontal: w(16), paddingVertical: h(9), marginTop: h(4) },
    buyBtnText: { fontFamily: 'Inter_900Black', color: BLACK, fontSize: f(9), textTransform: 'uppercase', letterSpacing: 2 },
    apFootnote: { fontFamily: 'Inter_500Medium', fontSize: f(12), color: 'rgba(255,255,255,0.55)', lineHeight: f(18), marginTop: SP.xs },

    aiCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: w(24),
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.07)',
        padding: w(20),
        marginBottom: SP.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: h(2) },
        shadowOpacity: 0.04,
        shadowRadius: h(8),
        elevation: 2,
    },
    aiCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(6),
        marginBottom: h(16),
    },
    aiCardTitle: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(9),
        color: 'rgba(0,0,0,0.45)',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    aiSection: { paddingVertical: h(4) },
    aiSectionLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(8),
        color: 'rgba(0,0,0,0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: h(5),
    },
    aiSectionText: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(13),
        color: 'rgba(0,0,0,0.75)',
        lineHeight: f(20),
    },
    aiDivider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: h(10),
    },
    aiEmptyLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(9),
        color: 'rgba(0,0,0,0.3)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: h(8),
        marginBottom: h(6),
    },
    aiEmptyText: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(12),
        color: 'rgba(0,0,0,0.35)',
        textAlign: 'center',
        lineHeight: f(18),
        maxWidth: '80%',
    },
    weekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: h(12),
    },
    weekStat: { alignItems: 'center', flex: 1 },
    weekStatNum: {
        fontFamily: 'Inter_900Black',
        fontSize: f(28),
        color: BLACK,
        letterSpacing: -1,
        lineHeight: f(32),
    },
    weekStatLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: f(8),
        color: 'rgba(0,0,0,0.35)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: h(2),
    },
    weekStatDivider: {
        width: 1,
        height: h(40),
        backgroundColor: 'rgba(0,0,0,0.08)',
    },

    menuList: { gap: SP.sm },
    menuItem: { borderRadius: w(20), borderWidth: 1, borderColor: 'rgba(13,13,13,0.07)', height: h(58), overflow: 'hidden' },
    menuInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: w(18), gap: SP.md, borderRadius: w(20) },
    menuLabel: { fontFamily: 'Inter_700Bold', flex: 1, fontSize: f(10), color: BLACK, textTransform: 'uppercase', letterSpacing: 1.8 },

    // ── Delete Modal ──────────────────────────────────────────────────────────
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    modalCard: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: CREAM,
        borderTopLeftRadius: w(32),
        borderTopRightRadius: w(32),
        paddingHorizontal: H_PAD,
        paddingTop: h(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -h(8) },
        shadowOpacity: 0.12,
        shadowRadius: h(24),
        elevation: 20,
    },
    modalHandle: {
        width: w(40), height: h(4),
        borderRadius: 99,
        backgroundColor: 'rgba(0,0,0,0.12)',
        alignSelf: 'center',
        marginBottom: h(28),
    },
    modalIconWrap: {
        width: w(64), height: w(64),
        borderRadius: w(32),
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(239,68,68,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: h(20),
    },
    modalTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: f(26),
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: -1,
        textAlign: 'center',
        marginBottom: h(10),
    },
    modalSubtitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(14),
        color: 'rgba(0,0,0,0.55)',
        lineHeight: f(22),
        textAlign: 'center',
        marginBottom: h(24),
    },
    modalList: {
        backgroundColor: '#FFFFFF',
        borderRadius: w(18),
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        paddingVertical: h(6),
        paddingHorizontal: w(16),
        marginBottom: h(28),
        gap: h(2),
    },
    modalListRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: w(10),
        paddingVertical: h(9),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.04)',
    },
    modalListText: {
        fontFamily: 'Inter_500Medium',
        fontSize: f(13),
        color: 'rgba(0,0,0,0.6)',
        letterSpacing: 0.1,
    },
    deleteBtn: {
        backgroundColor: RED,
        borderRadius: w(18),
        height: h(56),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: h(12),
        shadowColor: RED,
        shadowOffset: { width: 0, height: h(4) },
        shadowOpacity: 0.3,
        shadowRadius: h(12),
        elevation: 6,
    },
    deleteBtnText: {
        fontFamily: 'Inter_900Black',
        fontSize: f(12),
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cancelBtn: {
        height: h(48),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: f(11),
        color: 'rgba(0,0,0,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
