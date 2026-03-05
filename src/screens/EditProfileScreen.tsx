import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import COLORS from '../constants/colors';
import { useProfile, ProfilePhoto } from '../context/ProfileContext';
import { w, h, f, SP, H_PAD, SCREEN_W } from '../utils/responsive';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

// ─── Photo Grid ──────────────────────────────────────────────────────────────
const GRID_W = SCREEN_W - H_PAD * 2;
const PHOTO_GAP = w(7);
const PHOTO_SIZE = (GRID_W - PHOTO_GAP * 2) / 3;

// ─── Visibility label helper ─────────────────────────────────────────────────
function visibilityLabel(vis: 'visible' | 'hidden' | 'always_visible'): string {
    switch (vis) {
        case 'visible': return 'Visible';
        case 'hidden': return 'Hidden';
        case 'always_visible': return 'Always Visible';
        default: return 'Visible';
    }
}

function visibilityColor(vis: 'visible' | 'hidden' | 'always_visible'): string {
    switch (vis) {
        case 'visible': return 'rgba(13,13,13,0.4)';
        case 'hidden': return COLORS.error;
        case 'always_visible': return ORANGE;
        default: return 'rgba(13,13,13,0.4)';
    }
}

// ─── Height formatting helper ────────────────────────────────────────────────
function formatHeight(val: any): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.value) {
        if (val.unit === 'CM') return `${val.value} cm`;
        const feet = Math.floor(val.value / 12);
        const inches = val.value % 12;
        return `${feet}'${inches}"`;
    }
    if (typeof val === 'number') {
        const feet = Math.floor(val / 12);
        const inches = val % 12;
        return `${feet}'${inches}"`;
    }
    return '';
}

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
);

// ─── Profile Field Row (with visibility) ─────────────────────────────────────
interface FieldRowProps {
    label: string;
    value: string;
    onPress: () => void;
    visibilityState?: 'visible' | 'hidden' | 'always_visible';
    onToggleVisibility?: () => void;
    showChevron?: boolean;
}

const FieldRow = ({ label, value, onPress, visibilityState, onToggleVisibility, showChevron = true }: FieldRowProps) => {
    const hasValue = !!value && value !== '';

    return (
        <TouchableOpacity
            style={styles.fieldRow}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.fieldLeft}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={[styles.fieldValue, !hasValue && styles.fieldValueEmpty]}>
                    {hasValue ? value : 'Not answered yet'}
                </Text>
            </View>
            <View style={styles.fieldRight}>
                {visibilityState && onToggleVisibility && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation?.();
                            onToggleVisibility();
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.6}
                    >
                        <Text style={[styles.visibilityLabel, { color: visibilityColor(visibilityState) }]}>
                            {visibilityLabel(visibilityState)}
                        </Text>
                    </TouchableOpacity>
                )}
                {showChevron && (
                    <Feather name="chevron-right" size={18} color="rgba(13,13,13,0.3)" />
                )}
            </View>
        </TouchableOpacity>
    );
};

// ─── Photo Slot ──────────────────────────────────────────────────────────────
const PhotoSlot = ({ uri, onRemove, onAdd }: { uri?: string; onRemove?: () => void; onAdd?: () => void }) => (
    <TouchableOpacity
        style={[styles.photoSlot, uri ? styles.photoSlotFilled : styles.photoSlotEmpty]}
        activeOpacity={uri ? 1 : 0.7}
        onPress={!uri && onAdd ? onAdd : undefined}
        disabled={!!uri}
    >
        {uri ? (
            <>
                <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
                {onRemove && (
                    <TouchableOpacity style={styles.photoRemoveBtn} onPress={onRemove} activeOpacity={0.8}>
                        <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                )}
            </>
        ) : (
            <Feather name="plus" size={28} color="rgba(13,13,13,0.2)" />
        )}
    </TouchableOpacity>
);

const PromptCard = ({ question, answer, onPress }: { question: string; answer: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.promptCard} activeOpacity={0.7} onPress={onPress}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={[styles.promptQuestion, { flex: 1, marginRight: 8 }]}>{question}</Text>
            <Feather name="edit-2" size={16} color={ORANGE} />
        </View>
        <Text style={[styles.promptAnswer, !answer && styles.fieldValueEmpty]}>
            {answer || 'Tap to answer...'}
        </Text>
    </TouchableOpacity>
);

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const {
        profile, photos, prompts: localPrompts,
        loadFullProfile,
        addPhoto, removePhoto,
        getFieldVisibility, setFieldVisibility,
    } = useProfile();
    const [isSaving, setIsSaving] = useState(false);

    const convexUser = useQuery(api.users.getCurrentUser);
    const prompts = convexUser?.prompts || [];

    const userId = profile?.id || '';

    // Load full profile data on mount
    useEffect(() => {
        if (userId) {
            loadFullProfile(userId);
        }
    }, [userId]);

    // ── Convenience getters ─────────────────────────────────────────────────
    const val = (field: string): string => {
        if (!convexUser) return '';
        let key = field;
        if (field === 'bio') key = 'publicBio';
        else if (field === 'dating_intention') key = 'datingIntention';
        else if (field === 'relationship_type') key = 'relationshipType';
        else if (field === 'distance_preference') key = 'distancePreference';

        const v = (convexUser as any)[key];
        if (v == null) return '';
        if (Array.isArray(v)) return v.join(', ');
        return String(v);
    };

    // ── Toggle visibility cycle: visible → hidden → always_visible → visible
    const cycleVisibility = (fieldName: string) => {
        const current = getFieldVisibility(fieldName);
        const next = current === 'visible' ? 'hidden'
            : current === 'hidden' ? 'always_visible'
                : 'visible';
        setFieldVisibility(userId, fieldName, next);
    };

    // ── Navigate to edit sub-screen ──────────────────────────────────────────
    const editField = (field: string, currentValue: any) => {
        navigation.navigate('EditField', { field, currentValue, userId });
    };

    // ── Calculate age from birthday ─────────────────────────────────────────
    const getAge = (): string => {
        const bday = convexUser?.birthday;
        if (!bday) return '';
        const birth = new Date(bday);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
        return String(age);
    };

    // ── Add photo via image picker ───────────────────────────────────────────
    const handleAddPhoto = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [3, 4],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setIsSaving(true);
            const ok = await addPhoto(userId, result.assets[0].uri, photos.length);
            setIsSaving(false);
            if (!ok) {
                Alert.alert('Error', 'Failed to add photo.');
            }
        }
    };

    // ── Remove photo ─────────────────────────────────────────────────────────
    const handleRemovePhoto = (photo: ProfilePhoto) => {
        Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setIsSaving(true);
                    await removePhoto(userId, photo.id);
                    setIsSaving(false);
                },
            },
        ]);
    };

    return (
        <View style={styles.root}>
            <StatusBar style="dark" />

            <View style={[styles.contentWrapper, { paddingTop: insets.top }]}>
                {/* ── Header ──────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={BLACK} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>EDIT PROFILE</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* ── Loading indicator ───────────────────────────────────── */}
                {isSaving && (
                    <View style={styles.savingBar}>
                        <ActivityIndicator size="small" color={ORANGE} />
                        <Text style={styles.savingText}>Saving...</Text>
                    </View>
                )}

                {/* ── Scrollable Content ─────────────────────────────────── */}
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 32) + 40 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ═══════════════════════════════════════════════════════
                       IDENTITY
                       ═══════════════════════════════════════════════════════ */}
                    <SectionHeader title="IDENTITY" />
                    <FieldRow
                        label="Pronouns"
                        value={val('pronouns')}
                        onPress={() => editField('pronouns', profile?.pronouns)}
                        visibilityState={getFieldVisibility('pronouns')}
                        onToggleVisibility={() => cycleVisibility('pronouns')}
                    />
                    <FieldRow
                        label="Gender"
                        value={val('gender')}
                        onPress={() => editField('gender', val('gender'))}
                        visibilityState={getFieldVisibility('gender')}
                        onToggleVisibility={() => cycleVisibility('gender')}
                    />
                    <FieldRow
                        label="Sexuality"
                        value={val('sexuality')}
                        onPress={() => editField('sexuality', val('sexuality'))}
                        visibilityState={getFieldVisibility('sexuality')}
                        onToggleVisibility={() => cycleVisibility('sexuality')}
                    />

                    {/* ═══════════════════════════════════════════════════════
                       MY VITALS
                       ═══════════════════════════════════════════════════════ */}
                    <SectionHeader title="MY VITALS" />
                    <FieldRow
                        label="Name"
                        value={val('firstName')}
                        onPress={() => editField('firstName', val('firstName'))}
                    />
                    <FieldRow
                        label="Age"
                        value={getAge()}
                        onPress={() => { }}
                        showChevron={false}
                    />
                    <FieldRow
                        label="Height"
                        value={formatHeight(convexUser?.height)}
                        onPress={() =>
                            editField('height', convexUser?.height)
                        }
                        visibilityState={getFieldVisibility('height')}
                        onToggleVisibility={() => cycleVisibility('height')}
                    />
                    <FieldRow
                        label="Location"
                        value={val('location')}
                        onPress={() => { }}
                        showChevron={false}
                    />
                    <FieldRow
                        label="Hometown"
                        value={val('hometown')}
                        onPress={() => editField('hometown', val('hometown'))}
                        visibilityState={getFieldVisibility('hometown')}
                        onToggleVisibility={() => cycleVisibility('hometown')}
                    />

                    {/* ═══════════════════════════════════════════════════════
                       MY VIRTUES
                       ═══════════════════════════════════════════════════════ */}
                    <SectionHeader title="MY VIRTUES" />
                    <FieldRow
                        label="Work"
                        value={val('workplace')}
                        onPress={() => editField('workplace', val('workplace'))}
                        visibilityState={getFieldVisibility('workplace')}
                        onToggleVisibility={() => cycleVisibility('workplace')}
                    />
                    <FieldRow
                        label="Education"
                        value={val('education')}
                        onPress={() => editField('education', val('education'))}
                        visibilityState={getFieldVisibility('education')}
                        onToggleVisibility={() => cycleVisibility('education')}
                    />
                    <FieldRow
                        label="Institution"
                        value={val('school')}
                        onPress={() => editField('school', val('school'))}
                        visibilityState={getFieldVisibility('school')}
                        onToggleVisibility={() => cycleVisibility('school')}
                    />
                    <FieldRow
                        label="Religion"
                        value={val('religion')}
                        onPress={() => editField('religion', val('religion'))}
                        visibilityState={getFieldVisibility('religion')}
                        onToggleVisibility={() => cycleVisibility('religion')}
                    />
                    <FieldRow
                        label="Politics"
                        value={val('politics')}
                        onPress={() => editField('politics', val('politics'))}
                        visibilityState={getFieldVisibility('politics')}
                        onToggleVisibility={() => cycleVisibility('politics')}
                    />

                    {/* ═══════════════════════════════════════════════════════
                       MY VICES
                       ═══════════════════════════════════════════════════════ */}
                    <SectionHeader title="MY VICES" />
                    <FieldRow
                        label="Drinking"
                        value={val('drinking')}
                        onPress={() => editField('drinking', val('drinking'))}
                        visibilityState={getFieldVisibility('drinking')}
                        onToggleVisibility={() => cycleVisibility('drinking')}
                    />
                    <FieldRow
                        label="Smoking"
                        value={val('tobacco')}
                        onPress={() => editField('tobacco', val('tobacco'))}
                        visibilityState={getFieldVisibility('tobacco')}
                        onToggleVisibility={() => cycleVisibility('tobacco')}
                    />
                    <FieldRow
                        label="Drugs"
                        value={val('drugs')}
                        onPress={() => editField('drugs', val('drugs'))}
                        visibilityState={getFieldVisibility('drugs')}
                        onToggleVisibility={() => cycleVisibility('drugs')}
                    />

                    {/* ═══════════════════════════════════════════════════════
                       MEDIA
                       ═══════════════════════════════════════════════════════ */}
                    <SectionHeader title="MEDIA" />

                    {/* Photos */}
                    <View style={styles.mediaSubHeader}>
                        <Text style={styles.mediaSubHeaderText}>Photos</Text>
                    </View>
                    <View style={styles.photoGrid}>
                        {[0, 1, 2, 3, 4, 5].map((i) => {
                            const photo = photos[i];
                            return (
                                <PhotoSlot
                                    key={i}
                                    uri={photo?.photo_url}
                                    onRemove={photo ? () => handleRemovePhoto(photo) : undefined}
                                    onAdd={!photo ? handleAddPhoto : undefined}
                                />
                            );
                        })}
                    </View>

                    {/* Prompts */}
                    <View style={styles.mediaSubHeader}>
                        <Text style={styles.mediaSubHeaderText}>Prompts</Text>
                    </View>
                    {prompts && prompts.length > 0 ? (
                        prompts.map((p: any, i: number) => (
                            <PromptCard
                                key={p.id || i}
                                question={p.question}
                                answer={p.answer}
                                onPress={() => navigation.navigate('EditPrompt', {
                                    promptId: p.id || String(i),
                                    question: p.question,
                                    answer: p.answer,
                                    userId,
                                })}
                            />
                        ))
                    ) : (
                        <TouchableOpacity
                            style={styles.addPromptBtn}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('EditPrompt', { userId })}
                        >
                            <Feather name="plus" size={16} color={ORANGE} />
                            <Text style={styles.addPromptText}>Add prompt</Text>
                        </TouchableOpacity>
                    )}

                    {/* Bio */}
                    <View style={styles.mediaSubHeader}>
                        <Text style={styles.mediaSubHeaderText}>Bio</Text>
                    </View>
                    <FieldRow
                        label="About me"
                        value={val('bio')}
                        onPress={() => editField('bio', val('bio'))}
                        visibilityState={getFieldVisibility('bio')}
                        onToggleVisibility={() => cycleVisibility('bio')}
                    />

                    {/* ═══════════════════════════════════════════════════════
                       RELATIONSHIP
                       ═══════════════════════════════════════════════════════ */}
                    <SectionHeader title="RELATIONSHIP" />
                    <FieldRow
                        label="Relationship type"
                        value={val('relationship_type')}
                        onPress={() => editField('relationship_type', val('relationship_type'))}
                        visibilityState={getFieldVisibility('relationship_type')}
                        onToggleVisibility={() => cycleVisibility('relationship_type')}
                    />
                    <FieldRow
                        label="Dating intention"
                        value={val('dating_intention')}
                        onPress={() => editField('dating_intention', val('dating_intention'))}
                        visibilityState={getFieldVisibility('dating_intention')}
                        onToggleVisibility={() => cycleVisibility('dating_intention')}
                    />
                    <FieldRow
                        label="Children"
                        value={val('children')}
                        onPress={() => editField('children', val('children'))}
                        visibilityState={getFieldVisibility('children')}
                        onToggleVisibility={() => cycleVisibility('children')}
                    />
                </ScrollView>
            </View>
        </View>
    );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: CREAM },
    contentWrapper: { flex: 1 },

    header: {
        paddingHorizontal: H_PAD, paddingVertical: SP.md,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,13,0.06)', backgroundColor: CREAM,
    },
    headerTitle: { fontFamily: 'Inter_900Black', fontSize: f(11), color: BLACK, letterSpacing: 3, textTransform: 'uppercase' },

    savingBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SP.sm, gap: SP.sm, backgroundColor: 'rgba(255,92,0,0.08)' },
    savingText: { fontFamily: 'Inter_600SemiBold', fontSize: f(10), color: ORANGE, letterSpacing: 1, textTransform: 'uppercase' },

    scrollContent: { paddingTop: SP.sm },

    sectionHeader: { paddingHorizontal: H_PAD, paddingTop: SP.xxl, paddingBottom: SP.sm },
    sectionHeaderText: { fontFamily: 'Inter_900Black', fontSize: f(9), color: ORANGE, letterSpacing: 3, textTransform: 'uppercase' },

    mediaSubHeader: { paddingHorizontal: H_PAD, paddingTop: SP.lg, paddingBottom: SP.sm },
    mediaSubHeaderText: { fontFamily: 'Inter_700Bold', fontSize: f(11), color: BLACK, letterSpacing: 1, textTransform: 'uppercase' },

    fieldRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: H_PAD, paddingVertical: SP.md,
        borderBottomWidth: 1, borderBottomColor: 'rgba(13,13,13,0.05)',
    },
    fieldLeft: { flex: 1, marginRight: SP.md },
    fieldRight: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
    fieldLabel: { fontFamily: 'Inter_700Bold', fontSize: f(11), color: BLACK, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SP.xs },
    fieldValue: { fontFamily: 'Inter_500Medium', fontSize: f(14), color: BLACK, lineHeight: f(19) },
    fieldValueEmpty: { color: 'rgba(13,13,13,0.35)', fontStyle: 'italic' },
    visibilityLabel: { fontFamily: 'Inter_600SemiBold', fontSize: f(9), letterSpacing: 0.5, textTransform: 'uppercase' },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GAP, paddingHorizontal: H_PAD, paddingTop: SP.sm },
    photoSlot: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: w(14), overflow: 'visible', position: 'relative' },
    photoSlotFilled: { borderWidth: 2, borderColor: BLACK },
    photoSlotEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(13,13,13,0.15)', backgroundColor: 'rgba(13,13,13,0.03)', alignItems: 'center', justifyContent: 'center' },
    photoImage: { width: '100%', height: '100%', borderRadius: w(12) },
    photoRemoveBtn: { position: 'absolute', top: -w(7), right: -w(7), width: w(22), height: w(22), backgroundColor: BLACK, borderRadius: w(11), alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CREAM, zIndex: 10 },
    photoRemoveText: { fontFamily: 'Inter_700Bold', fontSize: f(9), color: '#FFFFFF' },

    promptCard: { marginHorizontal: H_PAD, marginBottom: SP.md, backgroundColor: '#FFFFFF', borderRadius: w(16), padding: w(16), borderWidth: 1, borderColor: 'rgba(13,13,13,0.06)' },
    promptQuestion: { fontFamily: 'Inter_700Bold', fontSize: f(10), color: ORANGE, letterSpacing: 1, textTransform: 'uppercase', marginBottom: SP.sm },
    promptAnswer: { fontFamily: 'Inter_500Medium', fontSize: f(14), color: BLACK, lineHeight: f(20) },
    addPromptBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginHorizontal: H_PAD, paddingVertical: SP.md },
    addPromptText: { fontFamily: 'Inter_700Bold', fontSize: f(12), color: ORANGE, letterSpacing: 0.5, textTransform: 'uppercase' },
});
