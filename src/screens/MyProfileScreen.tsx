import React, { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import COLORS from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { w, h, f, SP, H_PAD, SCREEN_W } from '../utils/responsive';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

// ─── Menu items ───────────────────────────────────────────────────────────────
const MENU_ITEMS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; route?: string; action?: string }[] = [
    { icon: 'card-outline', label: 'SUBSCRIPTION & BILLING', route: 'Subscription' },
    { icon: 'settings-outline', label: 'ACCOUNT SETTINGS', route: 'Settings' },
    { icon: 'shield-outline', label: 'PRIVACY & SAFETY' },
    { icon: 'log-out-outline', label: 'SIGN OUT', action: 'signout' },
];

// ─── Animated Menu Row ────────────────────────────────────────────────────────
function MenuItem({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress?: () => void }) {
    const anim = useRef(new Animated.Value(0)).current;
    const handleIn = () => Animated.timing(anim, { toValue: 1, duration: 160, useNativeDriver: false }).start();
    const handleOut = () => Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

    const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#FFFFFF', BLACK] });
    const contentOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
    const invertedOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

    return (
        <TouchableOpacity activeOpacity={1} onPressIn={handleIn} onPressOut={handleOut} onPress={onPress}>
            <Animated.View style={[styles.menuItem, { backgroundColor: bgColor }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, styles.menuInner, { opacity: contentOpacity }]}>
                    <Ionicons name={icon} size={w(18)} color="rgba(13,13,13,0.4)" />
                    <Text style={styles.menuLabel}>{label}</Text>
                    <Ionicons name="arrow-forward" size={w(14)} color={ORANGE} />
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { signOut } = useAuth();
    const { profile, photos, apBalance } = useProfile();

    const displayName = profile?.name?.toUpperCase() || 'YOU';
    const photoUrl = photos?.[0]?.photo_url || profile?.photo_urls?.[0];

    const handleMenu = (route?: string, action?: string) => {
        if (action === 'signout') {
            signOut();
            return;
        }
        if (route) navigation.navigate(route);
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
                    </View>
                    <Text style={styles.apFootnote}>
                        Points reset monthly. Upgrade to Premium for unlimited boosts and priority matching.
                    </Text>
                    <TouchableOpacity style={styles.buyBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Subscription')}>
                        <Text style={styles.buyBtnText}>BUY MORE</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu */}
                <View style={styles.menuList}>
                    {MENU_ITEMS.map((item) => (
                        <MenuItem key={item.label} icon={item.icon} label={item.label} onPress={() => handleMenu(item.route, item.action)} />
                    ))}
                </View>
            </ScrollView>
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
        fontSize: Math.round(SCREEN_W * 0.13),
        color: BLACK, textTransform: 'uppercase', letterSpacing: -3,
        lineHeight: Math.round(SCREEN_W * 0.125), flex: 1,
    },
    avatarRing: { width: w(68), height: w(68), borderRadius: w(34), borderWidth: 2, borderColor: BLACK, padding: 3, overflow: 'hidden', marginLeft: SP.md, marginTop: SP.xs },
    avatarImg: { flex: 1, borderRadius: w(34), opacity: 0.85 },
    avatarPlaceholder: { backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },

    apCard: {
        position: 'relative', borderRadius: w(20), padding: w(18), marginBottom: SP.lg,
        backgroundColor: BLACK, shadowColor: '#000', shadowOffset: { width: 0, height: h(6) }, shadowOpacity: 0.15, shadowRadius: h(12), elevation: 8,
    },
    apTopRow: { marginBottom: SP.md },
    apBalanceContainer: { paddingRight: w(90) },
    apLabel: { fontFamily: 'Inter_900Black', fontSize: f(9), color: ORANGE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: SP.xs },
    apBalance: { fontFamily: 'Inter_900Black', fontSize: f(48), lineHeight: f(52), color: '#FFFFFF', letterSpacing: -2 },
    buyBtn: { position: 'absolute', top: w(18), right: w(18), backgroundColor: CREAM, borderRadius: 100, paddingHorizontal: w(16), paddingVertical: h(10) },
    buyBtnText: { fontFamily: 'Inter_900Black', color: BLACK, fontSize: f(9), textTransform: 'uppercase', letterSpacing: 2 },
    apFootnote: { fontFamily: 'Inter_500Medium', fontSize: f(11), color: 'rgba(255,255,255,0.6)', lineHeight: f(16) },

    menuList: { gap: SP.sm },
    menuItem: { borderRadius: w(20), borderWidth: 1, borderColor: 'rgba(13,13,13,0.07)', height: h(60), overflow: 'hidden' },
    menuInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: w(18), gap: SP.md, borderRadius: w(20) },
    menuLabel: { fontFamily: 'Inter_700Bold', flex: 1, fontSize: f(10), color: BLACK, textTransform: 'uppercase', letterSpacing: 2 },
});
