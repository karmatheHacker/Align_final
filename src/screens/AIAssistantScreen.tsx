import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Animated,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import COLORS from '../constants/colors';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const H_PAD = 24;

export default function AIAssistantScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // ─── Animation Values ─────────────────────────────────────────────────────
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const cardsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(cardsOpacity, { toValue: 1, duration: 500, useNativeDriver: true })
        ]).start();
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="dark" />

            <View style={{ paddingTop: insets.top, flex: 1 }}>
                {/* ── Header ────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.openDrawer?.()} activeOpacity={0.8}>
                        <MaterialIcons name="menu" size={28} color={BLACK} />
                    </TouchableOpacity>

                    {/* Logo Mark */}
                    <View style={styles.logoOuter}>
                        <View style={styles.logoInner}>
                            <View style={styles.logoDot} />
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
                        <MaterialIcons name="account-circle" size={28} color={BLACK} />
                    </TouchableOpacity>
                </View>

                {/* ── Scrollable Content ────────────────────────────────────── */}
                <ScrollView
                    style={styles.flex1}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <Animated.View style={[styles.titleContainer, { opacity: titleOpacity }]}>
                        <Text style={styles.heroTitle}>
                            Who is my{'\n'}
                            <Text style={styles.heroTitleSub}>best match</Text>{'\n'}
                            today?
                        </Text>
                    </Animated.View>

                    {/* Cards */}
                    <Animated.View style={[{ opacity: cardsOpacity }]}>

                        {/* Status Indicator */}
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: '#FFCC00' }]} />
                            <View style={[styles.statusDot, { backgroundColor: '#FF3B30' }]} />
                            <View style={[styles.statusDot, { backgroundColor: '#4CD964' }]} />
                            <Text style={styles.statusText}>Align is finding...</Text>
                        </View>

                        {/* Top Card */}
                        <TouchableOpacity
                            style={[styles.card, styles.cardTop]}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('ActiveChat', { matchName: 'ALEX' })}
                        >
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.cardTag}>Top Alignment</Text>
                                    <Text style={styles.cardName}>ALEX</Text>
                                </View>
                                <Text style={styles.cardScore}>98%</Text>
                            </View>

                            <View style={styles.cardFooter}>
                                <View style={styles.avatarGroup}>
                                    <View style={styles.avatarPlaceholder} />
                                </View>
                                <View style={styles.viewProfileBtn}>
                                    <Text style={styles.viewProfileText}>View Profile</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Runner Up Card */}
                        <TouchableOpacity
                            style={[styles.card, styles.cardRunnerUp]}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.cardTag, { color: 'rgba(255,255,255,0.4)' }]}>Runner Up</Text>
                                    <Text style={[styles.cardName, { color: 'rgba(255,255,255,0.9)' }]}>JORDAN</Text>
                                </View>
                                <Text style={[styles.cardScore, { color: 'rgba(255,255,255,0.6)' }]}>84%</Text>
                            </View>
                            <Text style={styles.cardSubtext}>
                                Shared interests in Architecture and Minimalism.
                            </Text>
                        </TouchableOpacity>

                    </Animated.View>
                </ScrollView>
            </View>

            {/* ── Bottom Input Area ────────────────────────────────────────── */}
            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <View style={styles.inputInnerWrapper}>
                    <View style={styles.textInputBox}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ask Align anything..."
                            placeholderTextColor="rgba(0,0,0,0.4)"
                            selectionColor={ORANGE}
                        />
                        <TouchableOpacity activeOpacity={0.8} style={styles.sendBtn}>
                            <MaterialIcons name="arrow-upward" size={24} color={ORANGE} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} style={styles.micBtn}>
                        <MaterialIcons name="mic" size={24} color="#1A1AFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
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
        paddingVertical: 16,
    },
    logoOuter: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BLACK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: BLACK,
    },
    // ── Content ───────────────────────────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: H_PAD,
        paddingTop: 16,
    },
    titleContainer: {
        marginTop: 32,
        marginBottom: 32,
    },
    heroTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 48,
        color: BLACK,
        lineHeight: 52,
        textTransform: 'uppercase',
        letterSpacing: -1,
    },
    heroTitleSub: {
        color: 'rgba(0,0,0,0.4)',
    },
    // ── Status Line ───────────────────────────────────────────────────────────
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingLeft: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: 'rgba(0,0,0,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4,
    },
    // ── Cards ─────────────────────────────────────────────────────────────────
    card: {
        backgroundColor: BLACK,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    cardTop: {
        minHeight: 220,
    },
    cardRunnerUp: {
        minHeight: 180,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#111111',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTag: {
        fontFamily: 'Inter_700Bold',
        fontSize: 12,
        color: ORANGE,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    cardName: {
        fontFamily: 'Inter_900Black',
        fontSize: 56,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        lineHeight: 56,
        letterSpacing: -1,
    },
    cardScore: {
        fontFamily: 'Inter_900Black',
        fontSize: 40,
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    cardFooter: {
        marginTop: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    avatarGroup: {
        flexDirection: 'row',
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: BLACK,
        backgroundColor: '#333333',
    },
    viewProfileBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    viewProfileText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 12,
        color: BLACK,
        textTransform: 'uppercase',
    },
    cardSubtext: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 16,
        lineHeight: 20,
    },
    // ── Bottom Input ──────────────────────────────────────────────────────────
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: CREAM,
        paddingHorizontal: H_PAD,
        paddingTop: 16,
    },
    inputInnerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // Native gap
    },
    textInputBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CREAM,
        borderWidth: 2,
        borderColor: BLACK,
        borderRadius: 16,
        paddingHorizontal: 16,
        minHeight: 56,
    },
    textInput: {
        flex: 1,
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
        color: BLACK,
        paddingVertical: 12,
    },
    sendBtn: {
        marginLeft: 12,
    },
    micBtn: {
        width: 56,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
});
