import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../constants/colors';
import { Check, ArrowRight } from 'lucide-react-native';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;
const WHITE = '#FFFFFF';

// ── Pricing constants ─────────────────────────────────────────────────────────
const MINI_MONTHLY = 599;
const MAX_MONTHLY = 1199;
const MINI_YEARLY_TOTAL = Math.round(MINI_MONTHLY * 12 * 0.6);    // ₹4,313
const MAX_YEARLY_TOTAL = Math.round(MAX_MONTHLY * 12 * 0.6);      // ₹8,633
const MINI_YEARLY_MO = Math.round(MINI_YEARLY_TOTAL / 12);        // ₹359
const MAX_YEARLY_MO = Math.round(MAX_YEARLY_TOTAL / 12);          // ₹719
const SAVE_PCT = Math.round((1 - MINI_YEARLY_MO / MINI_MONTHLY) * 100); // 40

// ── Plan features ─────────────────────────────────────────────────────────────
const MINI_FEATURES = [
    '7 APs per week',
    'APs stack indefinitely while subscribed',
    'Priority ranking in request queues',
    'AI match insights',
    'Unlimited likes',
    '1 undo per day',
    'Incognito mode',
    'See who liked you',
];

const MAX_FEATURES = [
    '15 APs per week',
    'APs stack indefinitely while subscribed',
    'Highest priority + premium multiplier',
    'Full AI match analysis',
    'Unlimited likes',
    'Unlimited undos',
    'Incognito mode',
    'See who liked you',
    'AI icebreaker suggestions',
    'Profile boost 1× per week',
    'AP undo within 5 min of sending',
];

// ── AP bundles ────────────────────────────────────────────────────────────────
const AP_BUNDLES: { aps: number; price: number; badge: string | null }[] = [
    { aps: 10, price: 99, badge: null },
    { aps: 25, price: 199, badge: null },
    { aps: 60, price: 399, badge: null },
    { aps: 150, price: 799, badge: 'BEST VALUE' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const FeatureRow = ({ text, dark }: { text: string; dark: boolean }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 }}>
        <View style={{
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
            alignItems: 'center', justifyContent: 'center',
            marginTop: 1, flexShrink: 0,
        }}>
            <Check size={10} strokeWidth={3} color={dark ? ORANGE : BLACK} />
        </View>
        <Text style={{
            fontFamily: 'Inter_500Medium', fontSize: 13, flex: 1, lineHeight: 19,
            color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
        }}>{text}</Text>
    </View>
);

const APBundleCard = ({ aps, price, badge }: { aps: number; price: number; badge: string | null }) => (
    <TouchableOpacity
        activeOpacity={0.82}
        style={{
            flex: 1,
            backgroundColor: WHITE,
            borderRadius: 20,
            paddingTop: badge ? 14 : 22,
            paddingBottom: 22,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: badge ? 2 : 1.5,
            borderColor: badge ? ORANGE : 'rgba(0,0,0,0.08)',
        }}
    >
        {badge && (
            <View style={{ backgroundColor: ORANGE, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 10 }}>
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 8, color: CREAM, letterSpacing: 1.5, textTransform: 'uppercase' }}>{badge}</Text>
            </View>
        )}
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 40, color: BLACK, letterSpacing: -2, lineHeight: 42 }}>{aps}</Text>
        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 9, color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2, marginBottom: 10 }}>APs</Text>
        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 17, color: BLACK, letterSpacing: -0.5 }}>₹{price}</Text>
    </TouchableOpacity>
);

// ── Screen ────────────────────────────────────────────────────────────────────
const SubscriptionScreen = () => {
    const navigation = useNavigation<any>();
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    const titleY = useRef(new Animated.Value(40)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(titleY, { toValue: 0, duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
            Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(200),
                Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const miniPrice = billing === 'monthly' ? `₹${MINI_MONTHLY}` : `₹${MINI_YEARLY_MO}`;
    const maxPrice = billing === 'monthly' ? `₹${MAX_MONTHLY}` : `₹${MAX_YEARLY_MO}`;

    return (
        <View style={{ flex: 1, backgroundColor: CREAM, overflow: 'hidden' }}>
            {/* Orange accent */}
            <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: ORANGE, opacity: 0.12 }} />

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 12 }}>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 11, color: ORANGE, letterSpacing: 2, textTransform: 'uppercase' }}>Align Premium</Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="close" size={18} color={BLACK} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>

                    {/* ── Hero ── */}
                    <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 8, marginBottom: 28 }}>
                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 64, color: BLACK, letterSpacing: -2.5, lineHeight: 60, textTransform: 'uppercase' }}>
                            UNLOCK{'\n'}MORE.
                        </Text>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: 'rgba(0,0,0,0.45)', marginTop: 10 }}>
                            More APs. More reach. More control.
                        </Text>
                    </Animated.View>

                    <Animated.View style={{ opacity: contentOpacity }}>

                        {/* ── Current Plan Banner ── */}
                        <View style={{
                            backgroundColor: WHITE, borderRadius: 22, padding: 20, marginBottom: 24,
                            borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)',
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 9, color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 }}>Current Plan</Text>
                                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: BLACK, letterSpacing: -0.5, textTransform: 'uppercase', marginBottom: 6 }}>Free</Text>
                                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: 'rgba(0,0,0,0.4)', lineHeight: 17 }}>
                                    3 APs / week · Resets monthly{'\n'}No priority ranking · Basic AI only
                                </Text>
                            </View>
                            <View style={{ backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', marginLeft: 16 }}>
                                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 32, color: BLACK, letterSpacing: -1, lineHeight: 34 }}>3</Text>
                                <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 9, color: 'rgba(0,0,0,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 }}>AP / wk</Text>
                            </View>
                        </View>

                        {/* ── Billing Toggle ── */}
                        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 100, padding: 3, marginBottom: 22 }}>
                            {(['monthly', 'yearly'] as const).map((b) => (
                                <TouchableOpacity
                                    key={b}
                                    onPress={() => setBilling(b)}
                                    activeOpacity={0.8}
                                    style={{
                                        flex: 1, paddingVertical: 11, borderRadius: 100,
                                        backgroundColor: billing === b ? BLACK : 'transparent',
                                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                                    }}
                                >
                                    <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: billing === b ? CREAM : 'rgba(0,0,0,0.45)' }}>
                                        {b === 'monthly' ? 'Monthly' : 'Yearly'}
                                    </Text>
                                    {b === 'yearly' && (
                                        <View style={{ backgroundColor: ORANGE, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 }}>
                                            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 8, color: CREAM, letterSpacing: 1 }}>SAVE {SAVE_PCT}%</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ── Section label ── */}
                        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 10, color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                            CHOOSE YOUR PLAN
                        </Text>

                        {/* ── MINI Card ── */}
                        <View style={{ backgroundColor: WHITE, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', padding: 24, marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                                <View>
                                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>Align</Text>
                                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 32, color: BLACK, letterSpacing: -1.5, textTransform: 'uppercase', lineHeight: 34 }}>MINI</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 34, color: BLACK, letterSpacing: -1.5, lineHeight: 36 }}>{miniPrice}</Text>
                                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(0,0,0,0.4)', marginBottom: 4 }}>/mo</Text>
                                    </View>
                                    {billing === 'yearly' && (
                                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: 'rgba(0,0,0,0.35)', marginTop: 2 }}>₹{MINI_YEARLY_TOTAL} billed yearly</Text>
                                    )}
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.07)', marginBottom: 16 }} />

                            {MINI_FEATURES.map((f, i) => <FeatureRow key={i} text={f} dark={false} />)}

                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                activeOpacity={0.88}
                                style={{ marginTop: 8, backgroundColor: BLACK, borderRadius: 100, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, color: CREAM, letterSpacing: 2, textTransform: 'uppercase' }}>START MINI</Text>
                                <ArrowRight size={16} strokeWidth={2.5} color={CREAM} />
                            </TouchableOpacity>
                        </View>

                        {/* ── MAX Card — MOST POPULAR badge floats above ── */}
                        <View style={{ marginBottom: 16 }}>
                            <View style={{ alignItems: 'center', marginBottom: -14, zIndex: 1 }}>
                                <View style={{ backgroundColor: ORANGE, paddingHorizontal: 18, paddingVertical: 6, borderRadius: 100, shadowColor: ORANGE, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
                                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 10, color: CREAM, letterSpacing: 2, textTransform: 'uppercase' }}>MOST POPULAR</Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: BLACK, borderRadius: 24, padding: 24, paddingTop: 30 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                                    <View>
                                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Align</Text>
                                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 32, color: CREAM, letterSpacing: -1.5, textTransform: 'uppercase', lineHeight: 34 }}>MAX</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                                            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 34, color: CREAM, letterSpacing: -1.5, lineHeight: 36 }}>{maxPrice}</Text>
                                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>/mo</Text>
                                        </View>
                                        {billing === 'yearly' && (
                                            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>₹{MAX_YEARLY_TOTAL} billed yearly</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />

                                {MAX_FEATURES.map((f, i) => <FeatureRow key={i} text={f} dark={true} />)}

                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    activeOpacity={0.88}
                                    style={{ marginTop: 8, backgroundColor: ORANGE, borderRadius: 100, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, color: CREAM, letterSpacing: 2, textTransform: 'uppercase' }}>GO MAX</Text>
                                    <ArrowRight size={16} strokeWidth={2.5} color={CREAM} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ── AP Disclaimer ── */}
                        <Text style={{ fontFamily: 'Inter_500Medium', textAlign: 'center', fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 8, marginBottom: 28, lineHeight: 20, paddingHorizontal: 12 }}>
                            APs show effort not wealth.{'\n'}Anyone can earn them for free.
                        </Text>

                        {/* ── AP Purchase Center ── */}
                        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 10, color: 'rgba(0,0,0,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                            AP PURCHASE CENTER
                        </Text>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: 'rgba(0,0,0,0.4)', marginBottom: 16, lineHeight: 17 }}>
                            One-off top-ups. Subscribers stack indefinitely; free users reset monthly.
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <APBundleCard {...AP_BUNDLES[0]} />
                            <APBundleCard {...AP_BUNDLES[1]} />
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 36 }}>
                            <APBundleCard {...AP_BUNDLES[2]} />
                            <APBundleCard {...AP_BUNDLES[3]} />
                        </View>

                        {/* ── Fine Print ── */}
                        <Text style={{ fontFamily: 'Inter_500Medium', textAlign: 'center', fontSize: 10, color: 'rgba(0,0,0,0.25)', letterSpacing: 0.5, lineHeight: 16 }}>
                            Cancel anytime. Billed monthly or annually.{'\n'}Prices in INR.
                        </Text>

                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default SubscriptionScreen;
