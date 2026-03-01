import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import COLORS from '../constants/colors';
import { w, h, f, SP, H_PAD } from '../utils/responsive';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const SECTIONS = [
    {
        title: 'Account',
        items: [
            { label: 'Profile Information', icon: 'person' as IconName, sub: 'Name, bio, photos' },
            { label: 'Email Preferences', icon: 'mail-outline' as IconName, sub: 'Notifications & updates' },
        ],
    },
    {
        title: 'Privacy',
        items: [
            { label: 'Visibility Settings', icon: 'visibility' as IconName, sub: 'Who can see your profile' },
            { label: 'Blocked Users', icon: 'block' as IconName, sub: 'Manage blocked accounts' },
        ],
    },
    {
        title: 'Support',
        items: [
            { label: 'Help Center', icon: 'help-outline' as IconName, sub: 'FAQs & guides', route: 'Help' },
            { label: 'Contact Us', icon: 'chat-bubble-outline' as IconName, sub: 'Reach our team' },
            { label: 'About', icon: 'info-outline' as IconName, sub: 'Version, legal & licenses', route: 'About' },
        ],
    },
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { signOut } = useAuth();

    const titleY = useRef(new Animated.Value(30)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(titleY, { toValue: 0, duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
            Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(180),
                Animated.parallel([
                    Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(contentY, { toValue: 0, duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
                ]),
            ]),
        ]).start();
    }, []);

    const handlePressItem = (route?: string) => {
        if (route) navigation.navigate(route);
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            <View style={styles.watermarkContainer} pointerEvents="none">
                <Text style={styles.watermarkText} numberOfLines={1}>SETTINGS</Text>
            </View>
            <View style={styles.orangeAccent} />

            <View style={{ flex: 1, paddingTop: insets.top }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
                        <MaterialIcons name="arrow-back" size={w(20)} color={BLACK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>YOUR ACCOUNT</Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, SP.xxl) + h(50) }]}
                >
                    {/* Hero */}
                    <Animated.View style={[styles.titleAnimContainer, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                        <Text style={styles.heroTitle}>SETTINGS.</Text>
                        <Text style={styles.heroSub}>Your account. Your rules.</Text>
                    </Animated.View>

                    <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}>
                        {/* Premium Banner */}
                        <TouchableOpacity onPress={() => navigation.navigate('Subscription')} activeOpacity={0.88} style={styles.premiumBanner}>
                            <View style={styles.premiumTextContainer}>
                                <Text style={styles.premiumLabel}>Align Premium</Text>
                                <Text style={styles.premiumMainTitle}>Upgrade Your Plan</Text>
                                <Text style={styles.premiumSub}>Unlimited AI, extended radius & more</Text>
                            </View>
                            <View style={styles.premiumIconBox}>
                                <MaterialIcons name="arrow-forward" size={w(18)} color={CREAM} />
                            </View>
                        </TouchableOpacity>

                        {/* Sections */}
                        {SECTIONS.map((section) => (
                            <View key={section.title} style={styles.sectionContainer}>
                                <Text style={styles.sectionTitle}>{section.title}</Text>
                                <View style={styles.sectionBlock}>
                                    {section.items.map((item, idx) => (
                                        <TouchableOpacity
                                            key={item.label} activeOpacity={0.75}
                                            onPress={() => handlePressItem(item.route)}
                                            style={[styles.itemRow, idx < section.items.length - 1 && styles.itemBorder]}
                                        >
                                            <View style={styles.itemIconBox}>
                                                <MaterialIcons name={item.icon} size={w(16)} color={BLACK} />
                                            </View>
                                            <View style={styles.itemTextContainer}>
                                                <Text style={styles.itemTitle}>{item.label}</Text>
                                                <Text style={styles.itemSub}>{item.sub}</Text>
                                            </View>
                                            <MaterialIcons name="chevron-right" size={w(18)} color="rgba(0,0,0,0.25)" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}

                        {/* Danger Zone */}
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Danger Zone</Text>
                            <View style={styles.sectionBlock}>
                                <TouchableOpacity activeOpacity={0.75} style={styles.itemRow} onPress={() => console.log('Delete account pressed')}>
                                    <View style={[styles.itemIconBox, { backgroundColor: 'rgba(224,58,47,0.08)' }]}>
                                        <MaterialIcons name="delete-outline" size={w(16)} color="#E03A2F" />
                                    </View>
                                    <View style={styles.itemTextContainer}>
                                        <Text style={[styles.itemTitle, { color: '#E03A2F' }]}>Delete Account</Text>
                                        <Text style={[styles.itemSub, { color: 'rgba(224,58,47,0.5)' }]}>This cannot be undone</Text>
                                    </View>
                                    <MaterialIcons name="chevron-right" size={w(18)} color="rgba(224,58,47,0.3)" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sign Out */}
                        <TouchableOpacity activeOpacity={0.85} style={styles.signOutBtn} onPress={() => signOut()}>
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>

                        <Text style={styles.versionText}>Align v1.0.0 · 2024</Text>
                    </Animated.View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM, overflow: 'hidden' },

    watermarkContainer: { position: 'absolute', top: h(24), left: w(-14), opacity: 0.035 },
    watermarkText: { fontFamily: 'Inter_900Black', fontSize: f(90), color: BLACK, letterSpacing: -4 },
    orangeAccent: { position: 'absolute', top: h(-32), right: w(-32), width: w(120), height: w(120), borderRadius: w(60), backgroundColor: ORANGE, opacity: 0.12 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: H_PAD, paddingVertical: SP.md },
    backButton: { width: w(36), height: w(36), borderRadius: w(18), backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: 'Inter_900Black', fontSize: f(9), color: 'rgba(0,0,0,0.4)', letterSpacing: 2, textTransform: 'uppercase' },

    scrollContent: { paddingHorizontal: H_PAD },
    titleAnimContainer: { marginBottom: SP.xxl, marginTop: SP.sm },
    heroTitle: { fontFamily: 'Inter_900Black', fontSize: f(38), color: BLACK, letterSpacing: -2, lineHeight: f(38), textTransform: 'uppercase' },
    heroSub: { fontFamily: 'Inter_500Medium', fontSize: f(12), color: 'rgba(0,0,0,0.45)', marginTop: SP.sm },

    premiumBanner: { backgroundColor: BLACK, borderRadius: w(18), padding: w(16), marginBottom: SP.xxl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    premiumTextContainer: { flex: 1 },
    premiumLabel: { fontFamily: 'Inter_700Bold', fontSize: f(9), color: ORANGE, letterSpacing: 2, textTransform: 'uppercase', marginBottom: SP.xs },
    premiumMainTitle: { fontFamily: 'Inter_900Black', fontSize: f(14), color: CREAM, letterSpacing: -0.5, textTransform: 'uppercase' },
    premiumSub: { fontFamily: 'Inter_500Medium', fontSize: f(10), color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    premiumIconBox: { width: w(36), height: w(36), borderRadius: w(18), backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },

    sectionContainer: { marginBottom: SP.xl },
    sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: f(9), color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: SP.sm },
    sectionBlock: { borderRadius: w(18), overflow: 'hidden', backgroundColor: '#FFFFFF' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SP.md, paddingHorizontal: w(14) },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
    itemIconBox: { width: w(32), height: w(32), borderRadius: w(9), backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: w(12) },
    itemTextContainer: { flex: 1 },
    itemTitle: { fontFamily: 'Inter_700Bold', fontSize: f(13), color: BLACK, letterSpacing: 0.2 },
    itemSub: { fontFamily: 'Inter_500Medium', fontSize: f(10), color: 'rgba(0,0,0,0.4)', marginTop: 1 },

    signOutBtn: { backgroundColor: BLACK, borderRadius: w(28), paddingVertical: h(16), alignItems: 'center', marginBottom: SP.xl },
    signOutText: { fontFamily: 'Inter_900Black', fontSize: f(13), color: CREAM, letterSpacing: 2, textTransform: 'uppercase' },
    versionText: { textAlign: 'center', fontFamily: 'Inter_700Bold', fontSize: f(9), color: 'rgba(0,0,0,0.25)', letterSpacing: 1, textTransform: 'uppercase' },
});
