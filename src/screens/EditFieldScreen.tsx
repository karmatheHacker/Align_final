import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '../constants/colors';
import { useProfile } from '../context/ProfileContext';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

// ─── Option lists for selection-based fields ─────────────────────────────────
const FIELD_OPTIONS: Record<string, string[]> = {
    gender: ['Man', 'Woman', 'Non-binary', 'Transgender', 'Other'],
    sexuality: ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Queer', 'Asexual', 'Other'],
    religion: ['Agnostic', 'Atheist', 'Buddhist', 'Catholic', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Sikh', 'Spiritual', 'Other'],
    politics: ['Liberal', 'Moderate', 'Conservative', 'Not political', 'Other'],
    drinking: ['Yes', 'Sometimes', 'No'],
    tobacco: ['Yes', 'Sometimes', 'No'],
    drugs: ['Yes', 'Sometimes', 'No'],
    children: ['Want someday', 'Don\'t want', 'Have and want more', 'Have and don\'t want more', 'Not sure yet'],
    relationship_type: ['Monogamy', 'Non-monogamy', 'Figuring out my relationship type'],
    dating_intention: ['Life partner', 'Long-term relationship', 'Long-term, open to short', 'Short-term, open to long', 'Short-term fun', 'Figuring out my dating goals'],
    education: ['High school', 'Trade / Tech school', 'Undergraduate', 'Postgraduate', 'Other'],
};

// Fields that use free-text input
const TEXT_FIELDS = ['name', 'bio', 'hometown', 'workplace', 'school'];

// ─── Label map ──────────────────────────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
    name: 'Name',
    bio: 'About Me',
    gender: 'Gender',
    sexuality: 'Sexuality',
    pronouns: 'Pronouns',
    religion: 'Religion',
    politics: 'Politics',
    drinking: 'Drinking',
    tobacco: 'Smoking',
    drugs: 'Drugs',
    children: 'Children',
    relationship_type: 'Relationship Type',
    dating_intention: 'Dating Intention',
    education: 'Education',
    hometown: 'Location',
    workplace: 'Work',
    school: 'School',
    height: 'Height',
};

// ─── Height Picker Column ───────────────────────────────────────────────────
interface PickerColumnProps {
    options: number[];
    selectedValue: number;
    onSelect: (value: number) => void;
    label?: string;
    itemHeight?: number;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ options, selectedValue, onSelect, label, itemHeight = 64 }) => {
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef<ScrollView>(null);
    const [boxHeight, setBoxHeight] = useState(240);
    const padding = (boxHeight - itemHeight) / 2;

    useEffect(() => {
        const index = options.indexOf(selectedValue);
        if (index !== -1 && boxHeight > 0) {
            scrollRef.current?.scrollTo({ y: index * itemHeight, animated: false });
        }
    }, [options, boxHeight, selectedValue, itemHeight]);

    const onMomentumScrollEnd = (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / itemHeight);
        if (options[index] !== undefined) {
            onSelect(options[index]);
        }
    };

    const onBoxLayout = (event: any) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) setBoxHeight(height);
    };

    return (
        <View style={heightStyles.pickerColumn}>
            {label && <Text style={heightStyles.columnLabel}>{label}</Text>}
            <View style={heightStyles.pickerBox} onLayout={onBoxLayout}>
                <Animated.ScrollView
                    ref={scrollRef as any}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    decelerationRate="fast"
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingVertical: padding }}
                >
                    {options.map((item, index) => {
                        const inputRange = [
                            (index - 1) * itemHeight,
                            index * itemHeight,
                            (index + 1) * itemHeight,
                        ];
                        const opacity = scrollY.interpolate({
                            inputRange,
                            outputRange: [0.15, 1, 0.15],
                            extrapolate: 'clamp',
                        });
                        const scale = scrollY.interpolate({
                            inputRange,
                            outputRange: [0.8, 1.15, 0.8],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[heightStyles.pickerItem, { height: itemHeight, opacity, transform: [{ scale }] }]}
                            >
                                <Text style={heightStyles.pickerText}>{item}</Text>
                            </Animated.View>
                        );
                    })}
                </Animated.ScrollView>
                <View style={[heightStyles.selectionOverlay, { height: itemHeight, marginTop: -itemHeight / 2 }]} pointerEvents="none" />
            </View>
        </View>
    );
};

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function EditFieldScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { updateProfileField } = useProfile();

    const { field, currentValue, userId } = route.params || {};
    const label = FIELD_LABELS[field] || field;
    const options = FIELD_OPTIONS[field];
    const isTextField = TEXT_FIELDS.includes(field);
    const isBio = field === 'bio';
    const isHeight = field === 'height';

    // ── Text / selection state ────────────────────────────────────────────
    const [value, setValue] = useState<string>(
        Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue || '')
    );
    const [isSaving, setIsSaving] = useState(false);

    // ── Height state ─────────────────────────────────────────────────────
    const parseHeight = () => {
        if (!currentValue) return { unit: 'FT' as const, feet: 5, inches: 9, cm: 175 };
        if (typeof currentValue === 'object' && currentValue.value) {
            if (currentValue.unit === 'CM') {
                return { unit: 'CM' as const, feet: 5, inches: 9, cm: currentValue.value };
            }
            return {
                unit: 'FT' as const,
                feet: Math.floor(currentValue.value / 12),
                inches: currentValue.value % 12,
                cm: 175,
            };
        }
        if (typeof currentValue === 'number') {
            return {
                unit: 'FT' as const,
                feet: Math.floor(currentValue / 12),
                inches: currentValue % 12,
                cm: 175,
            };
        }
        return { unit: 'FT' as const, feet: 5, inches: 9, cm: 175 };
    };

    const parsed = parseHeight();
    const [unit, setUnit] = useState<'FT' | 'CM'>(parsed.unit);
    const [feet, setFeet] = useState(parsed.feet);
    const [inches, setInches] = useState(parsed.inches);
    const [cm, setCm] = useState(parsed.cm);

    // ── Handlers ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        setIsSaving(true);
        let saveValue: any = value;

        if (field === 'pronouns') {
            saveValue = value.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        const ok = await updateProfileField(userId, field, saveValue);
        setIsSaving(false);

        if (ok) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Failed to save. Please try again.');
        }
    };

    const handleHeightSave = async () => {
        setIsSaving(true);
        const heightValue = unit === 'FT' ? (feet * 12) + inches : cm;
        const ok = await updateProfileField(userId, 'height', { value: heightValue, unit });
        setIsSaving(false);

        if (ok) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Failed to save. Please try again.');
        }
    };

    const selectOption = async (option: string) => {
        setValue(option);
        setIsSaving(true);
        const ok = await updateProfileField(userId, field, option);
        setIsSaving(false);

        if (ok) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Failed to save. Please try again.');
        }
    };

    const showSaveButton = isTextField || field === 'pronouns' || isHeight;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{label.toUpperCase()}</Text>
                {showSaveButton ? (
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.5 }]}
                        onPress={isHeight ? handleHeightSave : handleSave}
                        disabled={isSaving}
                        activeOpacity={0.8}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={styles.saveBtnText}>SAVE</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Selection-based fields */}
                {options && !isTextField && !isHeight && (
                    <View style={styles.optionsList}>
                        {options.map((opt) => {
                            const isSelected = value === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                                    onPress={() => selectOption(opt)}
                                    activeOpacity={0.7}
                                    disabled={isSaving}
                                >
                                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                        {opt}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={20} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Text input fields */}
                {isTextField && (
                    <View style={styles.textInputContainer}>
                        <TextInput
                            style={[styles.textInput, isBio && styles.textArea]}
                            value={value}
                            onChangeText={setValue}
                            placeholder={`Enter your ${label.toLowerCase()}...`}
                            placeholderTextColor="rgba(13,13,13,0.3)"
                            selectionColor={ORANGE}
                            multiline={isBio}
                            numberOfLines={isBio ? 5 : 1}
                            textAlignVertical={isBio ? 'top' : 'center'}
                            autoFocus
                        />
                    </View>
                )}

                {/* Pronouns (free text with hint) */}
                {field === 'pronouns' && (
                    <View style={styles.textInputContainer}>
                        <Text style={styles.hintText}>
                            Enter your pronouns separated by commas (e.g. she/her, they/them)
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            value={value}
                            onChangeText={setValue}
                            placeholder="e.g. she/her, they/them"
                            placeholderTextColor="rgba(13,13,13,0.3)"
                            selectionColor={ORANGE}
                            autoFocus
                        />
                    </View>
                )}

                {/* Height picker */}
                {isHeight && (
                    <View style={heightStyles.container}>
                        {/* Unit Toggle */}
                        <View style={heightStyles.unitSelector}>
                            <TouchableOpacity
                                onPress={() => setUnit('FT')}
                                activeOpacity={0.7}
                                style={[heightStyles.unitCard, unit === 'FT' && heightStyles.unitCardSelected]}
                            >
                                <Text style={[heightStyles.unitLabel, unit === 'FT' && heightStyles.unitLabelSelected]}>FT / IN</Text>
                                <View style={[heightStyles.radioRing, unit === 'FT' && heightStyles.radioRingSelected]}>
                                    {unit === 'FT' && <View style={heightStyles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setUnit('CM')}
                                activeOpacity={0.7}
                                style={[heightStyles.unitCard, unit === 'CM' && heightStyles.unitCardSelected]}
                            >
                                <Text style={[heightStyles.unitLabel, unit === 'CM' && heightStyles.unitLabelSelected]}>CM</Text>
                                <View style={[heightStyles.radioRing, unit === 'CM' && heightStyles.radioRingSelected]}>
                                    {unit === 'CM' && <View style={heightStyles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Picker */}
                        <View style={heightStyles.pickerMatrix}>
                            {unit === 'FT' ? (
                                <>
                                    <PickerColumn
                                        label="FEET"
                                        options={[4, 5, 6, 7]}
                                        selectedValue={feet}
                                        onSelect={setFeet}
                                    />
                                    <PickerColumn
                                        label="INCHES"
                                        options={Array.from({ length: 12 }, (_, i) => i)}
                                        selectedValue={inches}
                                        onSelect={setInches}
                                    />
                                </>
                            ) : (
                                <PickerColumn
                                    label="CENTIMETERS"
                                    options={Array.from({ length: 91 }, (_, i) => i + 120)}
                                    selectedValue={cm}
                                    onSelect={setCm}
                                />
                            )}
                        </View>
                    </View>
                )}

                {/* Unsupported field fallback */}
                {!options && !isTextField && field !== 'pronouns' && !isHeight && (
                    <View style={styles.unsupported}>
                        <Text style={styles.unsupportedText}>
                            This field cannot be edited here.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: CREAM,
    },
    header: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(13,13,13,0.06)',
    },
    headerTitle: {
        fontFamily: 'Inter_900Black',
        fontSize: 12,
        color: BLACK,
        letterSpacing: 3,
    },
    saveBtn: {
        backgroundColor: BLACK,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    saveBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    content: {
        paddingTop: 24,
        paddingHorizontal: 24,
    },

    // Options list
    optionsList: {
        gap: 10,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(13,13,13,0.08)',
        backgroundColor: '#FFFFFF',
    },
    optionRowSelected: {
        backgroundColor: BLACK,
        borderColor: BLACK,
    },
    optionText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 15,
        color: BLACK,
    },
    optionTextSelected: {
        color: '#FFFFFF',
    },

    // Text input
    textInputContainer: {
        gap: 12,
    },
    textInput: {
        borderWidth: 2,
        borderColor: BLACK,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: BLACK,
    },
    textArea: {
        height: 160,
        lineHeight: 24,
        textAlignVertical: 'top',
    },
    hintText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: 'rgba(13,13,13,0.5)',
        lineHeight: 20,
    },

    // Unsupported
    unsupported: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    unsupportedText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: 'rgba(13,13,13,0.4)',
    },
});

// ─── Height-specific styles ─────────────────────────────────────────────────
const heightStyles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 20,
    },
    unitSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    unitCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: BLACK,
        backgroundColor: 'transparent',
    },
    unitCardSelected: {
        backgroundColor: BLACK,
    },
    unitLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 12,
        color: BLACK,
        letterSpacing: 1,
    },
    unitLabelSelected: {
        color: CREAM,
    },
    radioRing: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: BLACK,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioRingSelected: {
        borderColor: CREAM,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: CREAM,
    },
    pickerMatrix: {
        flexDirection: 'row',
        gap: 16,
        height: 280,
    },
    pickerColumn: {
        flex: 1,
        alignItems: 'stretch',
    },
    columnLabel: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 10,
        color: COLORS.gray,
        letterSpacing: 1.5,
        marginBottom: 4,
        textAlign: 'center',
    },
    pickerBox: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderWidth: 2,
        borderColor: BLACK,
        overflow: 'hidden',
    },
    pickerItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 32,
        color: BLACK,
    },
    selectionOverlay: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: BLACK,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
});
