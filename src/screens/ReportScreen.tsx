import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Animated,
    Easing,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import COLORS from '../constants/colors';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const H_PAD = 24;

const REASONS = [
    { id: 'fake', label: 'Fake Profile', icon: 'person-off' },
    { id: 'harassment', label: 'Harassment', icon: 'warning' },
    { id: 'inappropriate', label: 'Inappropriate Content', icon: 'block' },
    { id: 'spam', label: 'Spam', icon: 'mark-email-unread' },
    { id: 'other', label: 'Other', icon: 'more-horiz' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();

    // Parameter handling
    const reportedUser = route.params?.username || '@ALEX_VANCE_92';

    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [note, setNote] = useState('');

    // Animations
    const titleY = useRef(new Animated.Value(30)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(titleY, { toValue: 0, duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
            Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.sequence([
                Animated.delay(200),
                Animated.parallel([
                    Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(contentY, { toValue: 0, duration: 500, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }),
                ]),
            ]),
        ]).start();
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="dark" />

            {/* ── Watermark ─────────────────────────────────────────────────── */}
            <View style={styles.watermarkContainer} pointerEvents="none">
                <Text style={styles.watermarkText} numberOfLines={1}>REPORT</Text>
            </View>

            {/* ── Red Accent Dot ────────────────────────────────────────────── */}
            <View style={styles.accentDot} />

            <View style={{ flex: 1, paddingTop: Math.max(insets.top, 16) }}>
                {/* ── Header ────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="arrow-back" size={22} color={BLACK} />
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <Text style={styles.headerLabel}>Reporting</Text>
                        <Text style={styles.headerUsername}>{reportedUser}</Text>
                    </View>
                </View>

                {/* ── Scroll Content ────────────────────────────────────────── */}
                <ScrollView
                    style={styles.flex1}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 40) }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <Animated.View style={[styles.titleContainer, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
                        <Text style={styles.heroTitle}>
                            REPORT{'\n'}USER.
                        </Text>
                        <Text style={styles.heroSub}>
                            Help us keep Align safe. Select the reason that best describes the issue.
                        </Text>
                    </Animated.View>

                    {/* Content */}
                    <Animated.View style={[{ opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
                        <View style={styles.reasonsList}>
                            {REASONS.map((reason) => {
                                const isSelected = selectedReason === reason.id;
                                return (
                                    <TouchableOpacity
                                        key={reason.id}
                                        onPress={() => setSelectedReason(reason.id)}
                                        activeOpacity={0.85}
                                        style={[
                                            styles.reasonCard,
                                            isSelected && styles.reasonCardSelected
                                        ]}
                                    >
                                        <View style={styles.reasonCardLeft}>
                                            <View style={[
                                                styles.reasonIconBox,
                                                isSelected && styles.reasonIconBoxSelected
                                            ]}>
                                                <MaterialIcons
                                                    name={reason.icon as any}
                                                    size={18}
                                                    color={isSelected ? CREAM : 'rgba(0,0,0,0.5)'}
                                                />
                                            </View>
                                            <Text style={[
                                                styles.reasonLabel,
                                                isSelected && styles.reasonLabelSelected
                                            ]}>
                                                {reason.label}
                                            </Text>
                                        </View>
                                        <View style={[
                                            styles.reasonRadio,
                                            isSelected && styles.reasonRadioSelected
                                        ]}>
                                            {isSelected && <MaterialIcons name="check" size={13} color="#E03A2F" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Optional Note */}
                        <View style={styles.noteContainer}>
                            <Text style={styles.noteLabel}>
                                ADDITIONAL NOTES (OPTIONAL)
                            </Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Describe what happened..."
                                placeholderTextColor="rgba(0,0,0,0.25)"
                                multiline
                                maxLength={300}
                                style={styles.noteInput}
                            />
                            <Text style={styles.noteCounter}>{note.length}/300</Text>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={() => navigation.goBack()} // Triggers the submission logic functionally
                            disabled={!selectedReason}
                            activeOpacity={0.85}
                            style={[
                                styles.submitBtn,
                                !selectedReason && styles.submitBtnDisabled
                            ]}
                        >
                            <Text style={[
                                styles.submitBtnText,
                                !selectedReason && styles.submitBtnTextDisabled
                            ]}>
                                Submit Report
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.footerDisclaimer}>
                            Reports are reviewed within 24 hours.{'\n'}We take every report seriously.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
        overflow: 'hidden',
    },
    flex1: {
        flex: 1,
    },

    // ── Watermark & Decoration ────────────────────────────────────────────────
    watermarkContainer: {
        position: 'absolute',
        top: 40,
        left: -16,
        opacity: 0.04,
    },
    watermarkText: {
        fontFamily: 'Inter_900Black',
        fontSize: 130, // massive
        color: BLACK,
        letterSpacing: -4,
    },
    accentDot: {
        position: 'absolute',
        top: 80,
        right: 24,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E03A2F', // Danger red
        zIndex: 5,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: H_PAD,
        paddingBottom: 16,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    headerLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 9,
        color: 'rgba(0,0,0,0.4)',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    headerUsername: {
        fontFamily: 'Inter_900Black',
        fontSize: 11,
        color: BLACK,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 2,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: H_PAD,
    },
    titleContainer: {
        marginBottom: 32,
        marginTop: 8,
    },
    heroTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 64,
        color: BLACK,
        letterSpacing: -2,
        lineHeight: 60,
        textTransform: 'uppercase',
    },
    heroSub: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: 'rgba(0,0,0,0.45)',
        marginTop: 12,
        lineHeight: 20,
    },

    // ── Reasons ───────────────────────────────────────────────────────────────
    reasonsList: {
        gap: 10,
    },
    reasonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        backgroundColor: '#FFFFFF',
    },
    reasonCardSelected: {
        borderColor: '#E03A2F',
        backgroundColor: '#E03A2F',
    },
    reasonCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    reasonIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonIconBoxSelected: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    reasonLabel: {
        fontFamily: 'Inter_700Bold',
        fontSize: 14, // Adjusted from 15 to fit systematic scale
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reasonLabelSelected: {
        color: CREAM,
    },
    reasonRadio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.2)',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonRadioSelected: {
        borderColor: CREAM,
        backgroundColor: CREAM,
    },

    // ── Additional Notes ──────────────────────────────────────────────────────
    noteContainer: {
        marginTop: 16,
    },
    noteLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 10,
        color: 'rgba(0,0,0,0.35)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    noteInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.08)',
        padding: 18,
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: BLACK,
        minHeight: 100,
        textAlignVertical: 'top', // Needed for Android multiline
    },
    noteCounter: {
        textAlign: 'right',
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: 'rgba(0,0,0,0.2)',
        marginTop: 6,
    },

    // ── Submit Button ─────────────────────────────────────────────────────────
    submitBtn: {
        marginTop: 16,
        backgroundColor: BLACK,
        borderRadius: 32,
        paddingVertical: 18,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    submitBtnText: {
        fontFamily: 'Inter_900Black',
        fontSize: 14,
        color: CREAM,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    submitBtnTextDisabled: {
        color: 'rgba(0,0,0,0.3)',
    },

    // ── Disclaimer ────────────────────────────────────────────────────────────
    footerDisclaimer: {
        textAlign: 'center',
        fontFamily: 'Inter_500Medium',
        fontSize: 10,
        color: 'rgba(0,0,0,0.4)',
        marginTop: 20,
        lineHeight: 16,
    },
});
