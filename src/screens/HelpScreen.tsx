import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Svg, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import COLORS from '../constants/colors';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const H_PAD = 24;
const { width } = Dimensions.get('window');

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HelpScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            {/* ── Header ────────────────────────────────────────────────── */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
                    <MaterialIcons name="arrow-back" size={28} color={BLACK} />
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.headerSubtitle}>Support Online</Text>
                </View>
            </View>

            <ScrollView
                style={styles.flex1}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero Title ────────────────────────────────────────────── */}
                <View style={styles.heroBlock}>
                    <Text style={styles.heroTitle} adjustsFontSizeToFit numberOfLines={1}>
                        HELP
                    </Text>
                </View>

                {/* ── Wavy Line SVG ─────────────────────────────────────────── */}
                <View style={styles.svgContainer}>
                    <Svg width="100%" height="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <Path
                            fill="none"
                            stroke={BLACK}
                            strokeWidth="40"
                            d="M0,160L80,176C160,192,320,224,480,213.3C640,203,800,149,960,144C1120,139,1280,181,1360,202.7L1440,224"
                        />
                    </Svg>
                </View>

                {/* ── Action Buttons ────────────────────────────────────────── */}
                <View style={styles.actionsBlock}>
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.88}>
                        <Text style={styles.actionBtnText}>Chat with us</Text>
                        <MaterialIcons name="chat" size={28} color={ORANGE} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.88}>
                        <Text style={styles.actionBtnText}>Help Center</Text>
                        <MaterialIcons name="library-books" size={28} color={ORANGE} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.88}>
                        <Text style={styles.actionBtnText}>Email Support</Text>
                        <MaterialIcons name="email" size={28} color={ORANGE} />
                    </TouchableOpacity>
                </View>

                {/* ── Hotline Section ───────────────────────────────────────── */}
                <View style={styles.hotlineBlock}>
                    <Text style={styles.hotlineLabel}>
                        Direct Hotline
                    </Text>
                    <Text style={styles.hotlineNumber}>
                        +1 800 ALIGN
                    </Text>
                    <View style={styles.hotlineUnderline} />
                </View>

                {/* ── Footer Promo Box ──────────────────────────────────────── */}
                <View style={styles.promoBox}>
                    {/* Abstract shapes mimicking the design */}
                    <View style={styles.promoAbstractCircle} />
                    <View style={styles.promoOutlineBadge}>
                        <Text style={styles.promoText}>
                            ALIGN V2.0
                        </Text>
                    </View>
                </View>

                {/* Safe Area padding at the bottom of the scroll */}
                <View style={{ height: Math.max(insets.bottom, 24) + 60 }} />
            </ScrollView>
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
    },
    flex1: {
        flex: 1,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: H_PAD,
        paddingBottom: 16,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: ORANGE,
        marginRight: 8,
    },
    headerSubtitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    scrollContent: {
        paddingTop: 16,
    },
    heroBlock: {
        paddingHorizontal: H_PAD,
        marginTop: 16,
    },
    heroTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 120, // Huge poster text
        lineHeight: 110,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: -2,
    },

    // ── SVG Decoration ────────────────────────────────────────────────────────
    svgContainer: {
        width: '100%',
        height: 96,
        marginBottom: 48,
    },

    // ── Action Buttons ────────────────────────────────────────────────────────
    actionsBlock: {
        paddingHorizontal: H_PAD,
        gap: 16,
    },
    actionBtn: {
        backgroundColor: BLACK,
        padding: 24,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionBtnText: {
        fontFamily: 'Inter_900Black',
        fontSize: 24,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: -1,
    },

    // ── Hotline Block ─────────────────────────────────────────────────────────
    hotlineBlock: {
        paddingHorizontal: H_PAD,
        marginTop: 48,
        marginBottom: 32,
    },
    hotlineLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: BLACK,
        textTransform: 'uppercase',
        marginBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: BLACK,
        alignSelf: 'flex-start',
        paddingBottom: 4,
        letterSpacing: 1,
    },
    hotlineNumber: {
        fontFamily: 'Inter_900Black',
        fontSize: 48,
        color: BLACK,
        lineHeight: 48, // keeping it tight
        marginTop: 8,
        letterSpacing: -1,
    },
    hotlineUnderline: {
        height: 8,
        backgroundColor: ORANGE,
        width: 192, // width of "48" roughly 
        marginTop: 4,
    },

    // ── Promo Box ─────────────────────────────────────────────────────────────
    promoBox: {
        marginHorizontal: H_PAD,
        height: 192,
        backgroundColor: '#111111',
        borderRadius: 12,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 48,
        borderWidth: 2,
        borderColor: BLACK,
    },
    promoAbstractCircle: {
        position: 'absolute',
        width: 256,
        height: 256,
        borderRadius: 128,
        backgroundColor: ORANGE,
        top: -48,
        left: -48,
        opacity: 0.8,
    },
    promoOutlineBadge: {
        borderWidth: 4,
        borderColor: '#FFFFFF',
        transform: [{ rotate: '-12deg' }],
        paddingHorizontal: 32,
        paddingVertical: 8,
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    promoText: {
        fontFamily: 'Inter_900Black',
        fontSize: 32,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: -1,
    },
});
