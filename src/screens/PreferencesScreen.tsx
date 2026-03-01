import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../constants/colors';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const { width } = Dimensions.get('window');
const H_PAD = 24;
const GRID_CONTAINER_WIDTH = width - (H_PAD * 2);

// ─── Subcomponents ────────────────────────────────────────────────────────────

// 2 columns, tightly packed
const FILTER_BOX_GAP = 8;
const FILTER_BOX_WIDTH = (GRID_CONTAINER_WIDTH - FILTER_BOX_GAP) / 2;

const FilterBox = ({ label, isSelected = false, onPress }: { label: string; isSelected?: boolean, onPress?: () => void }) => (
    <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.filterBox, isSelected ? styles.filterBoxSelected : styles.filterBoxUnselected]}
    >
        <Text style={[styles.filterBoxText, isSelected ? styles.filterBoxTextSelected : styles.filterBoxTextUnselected]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const BauhausRange = ({ label, value, range = false }: { label: string; value: string; range?: boolean }) => (
    <View style={styles.rangeContainer}>
        <View style={styles.rangeHeader}>
            <Text style={styles.rangeLabel}>{label}</Text>
            <Text style={styles.rangeValue}>{value}</Text>
        </View>

        {/* Track Line */}
        <View style={styles.rangeTrackWrapper}>
            <View style={styles.rangeTrackBase} />
            {range && <View style={[styles.rangeTrackActive, { left: '20%', right: '40%' }]} />}

            {/* Thumbs */}
            <View style={[styles.rangeThumb, { left: range ? '20%' : '45%' }]} />
            {range && (
                <View style={[styles.rangeThumb, { left: '60%' }]}>
                    <View style={styles.rangeThumbIndicator} />
                </View>
            )}
        </View>
    </View>
);

const CompatibilityButton = ({ label, isSelected = false, onPress }: { label: string; isSelected?: boolean, onPress?: () => void }) => (
    <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.compButton, isSelected ? styles.compButtonSelected : styles.compButtonUnselected]}
    >
        <Text style={[styles.compButtonText, isSelected ? styles.compTextSelected : styles.compTextUnselected]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const DealBreakerChip = ({ label, isSelected = false, onPress }: { label: string; isSelected?: boolean, onPress?: () => void }) => (
    <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
    >
        <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : styles.chipTextUnselected]}>
            {label}
        </Text>
    </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PreferencesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [lookingFor, setLookingFor] = useState('MEN');
    const [compatibility, setCompatibility] = useState('75%+');
    const [dealBreakers, setDealBreakers] = useState<Record<string, boolean>>({
        'SMOKING': true,
        'KIDS': false,
        'DRINKS': true,
        'PETS': false,
        'RELIGION': false,
        'POLITICS': false,
    });

    const toggleDealBreaker = (key: string) => {
        setDealBreakers(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            {/* ── Background Watermark ────────────────────────────────────── */}
            <View style={styles.watermarkContainer} pointerEvents="none">
                <Text style={styles.watermarkText}>
                    {"FILTERS · PREFERENCE · MATCH · ALIGN · FIND · ".repeat(30)}
                </Text>
            </View>

            <View style={[styles.contentWrapper, { paddingTop: insets.top }]}>

                {/* ── Scrollable Content ──────────────────────────────────── */}
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 48) }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={BLACK} />
                        </TouchableOpacity>

                        <TouchableOpacity activeOpacity={0.8} style={styles.saveBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.saveBtnText}>SAVE</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <View style={styles.heroBlock}>
                        <Text style={styles.heroText}>
                            YOUR{'\n'}FILTERS.
                        </Text>
                        <Text style={styles.heroSubtext}>
                            We find who fits these. You decide the rest.
                        </Text>
                    </View>

                    {/* Looking For */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>LOOKING FOR</Text>
                        <View style={styles.filterBoxContainer}>
                            {['WOMEN', 'MEN', 'NON-BINARY', 'EVERYONE'].map((label) => (
                                <FilterBox
                                    key={label}
                                    label={label}
                                    isSelected={lookingFor === label}
                                    onPress={() => setLookingFor(label)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Sliders */}
                    <View style={styles.section}>
                        <BauhausRange label="AGE RANGE" value="24 — 32" range />
                        <BauhausRange label="DISTANCE" value="25km" />
                    </View>

                    {/* Compatibility */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>COMPATIBILITY</Text>
                        <View style={styles.compContainer}>
                            {['60%+', '75%+', '85%+'].map((label) => (
                                <CompatibilityButton
                                    key={label}
                                    label={label}
                                    isSelected={compatibility === label}
                                    onPress={() => setCompatibility(label)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Deal Breakers */}
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>DEAL BREAKERS</Text>
                        <View style={styles.chipContainer}>
                            {Object.keys(dealBreakers).map((label) => (
                                <DealBreakerChip
                                    key={label}
                                    label={label}
                                    isSelected={dealBreakers[label]}
                                    onPress={() => toggleDealBreaker(label)}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Footer Apply Button */}
                    <View style={styles.footerApplyBlock}>
                        <TouchableOpacity activeOpacity={0.9} style={styles.applyBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </View>
        </View>
    );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
    },

    // ── Watermark ─────────────────────────────────────────────────────────────
    watermarkContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.05,
        padding: 16,
        overflow: 'hidden',
    },
    watermarkText: {
        fontFamily: 'Inter_900Black',
        fontSize: 64,
        color: BLACK,
        textTransform: 'uppercase',
        lineHeight: 56,
        letterSpacing: -1,
    },

    // ── Content ───────────────────────────────────────────────────────────────
    contentWrapper: {
        flex: 1,
        zIndex: 10,
    },

    scrollContent: {
        paddingHorizontal: H_PAD,
        paddingTop: 16,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    saveBtn: {
        borderWidth: 2,
        borderColor: BLACK,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 4, // Sharp slight pill
    },
    saveBtnText: {
        fontFamily: 'Inter_900Black',
        fontSize: 12,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // ── Title ─────────────────────────────────────────────────────────────────
    heroBlock: {
        marginBottom: 48,
    },
    heroText: {
        fontFamily: 'Inter_900Black',
        fontSize: 64, // Maps to 6xl
        color: BLACK,
        lineHeight: 60,
        textTransform: 'uppercase',
        letterSpacing: -2,
        marginBottom: 16,
    },
    heroSubtext: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: BLACK,
        letterSpacing: 0.5,
        maxWidth: 240,
        lineHeight: 20,
    },

    // ── Section ───────────────────────────────────────────────────────────────
    section: {
        marginBottom: 40,
    },
    sectionLabel: {
        fontFamily: 'Inter_900Black',
        fontSize: 11,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 16,
    },

    // ── Looking For ───────────────────────────────────────────────────────────
    filterBoxContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: FILTER_BOX_GAP,
    },
    filterBox: {
        width: FILTER_BOX_WIDTH,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: BLACK,
        borderRadius: 12,
    },
    filterBoxSelected: {
        backgroundColor: BLACK,
    },
    filterBoxUnselected: {
        backgroundColor: 'transparent',
    },
    filterBoxText: {
        fontFamily: 'Inter_900Black',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    filterBoxTextSelected: {
        color: '#FFFFFF',
    },
    filterBoxTextUnselected: {
        color: BLACK,
    },

    // ── Bauhaus Sliders ───────────────────────────────────────────────────────
    rangeContainer: {
        marginBottom: 32,
    },
    rangeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    rangeLabel: {
        fontFamily: 'Inter_900Black',
        fontSize: 11,
        color: BLACK,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    rangeValue: {
        fontFamily: 'Inter_900Black',
        fontSize: 20,
        color: BLACK,
    },
    rangeTrackWrapper: {
        height: 24, // Touch target height
        justifyContent: 'center',
        position: 'relative',
    },
    rangeTrackBase: {
        height: 2,
        backgroundColor: BLACK,
        width: '100%',
        position: 'absolute',
    },
    rangeTrackActive: {
        height: 2,
        backgroundColor: ORANGE,
        position: 'absolute',
    },
    rangeThumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        backgroundColor: BLACK,
        top: '50%',
        marginTop: -8,
        marginLeft: -8,
        borderRadius: 8,
    },
    rangeThumbIndicator: {
        position: 'absolute',
        width: 6,
        height: 6,
        backgroundColor: ORANGE,
        borderRadius: 3,
        top: -12, // Hovers just above the thumb
        left: '50%',
        marginLeft: -3,
    },

    // ── Compatibility ─────────────────────────────────────────────────────────
    compContainer: {
        flexDirection: 'row',
        gap: 12, // Native gap
    },
    compButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: BLACK,
        borderRadius: 12,
    },
    compButtonSelected: {
        backgroundColor: BLACK,
    },
    compButtonUnselected: {
        backgroundColor: 'transparent',
    },
    compButtonText: {
        fontFamily: 'Inter_900Black',
        fontSize: 14,
    },
    compTextSelected: {
        color: '#FFFFFF',
    },
    compTextUnselected: {
        color: BLACK,
    },

    // ── Deal Breakers ─────────────────────────────────────────────────────────
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 2,
        borderColor: BLACK,
        borderRadius: 20,
    },
    chipSelected: {
        backgroundColor: BLACK,
    },
    chipUnselected: {
        backgroundColor: 'transparent',
    },
    chipText: {
        fontFamily: 'Inter_900Black',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    chipTextUnselected: {
        color: BLACK,
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    footerApplyBlock: {
        marginTop: 16,
    },
    applyBtn: {
        width: '100%',
        backgroundColor: BLACK,
        paddingVertical: 18,
        alignItems: 'center',
        borderRadius: 30, // pill
    },
    applyBtnText: {
        fontFamily: 'Inter_900Black',
        fontSize: 16,
        color: '#FFFFFF', // Inverted text color since bg is black
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
