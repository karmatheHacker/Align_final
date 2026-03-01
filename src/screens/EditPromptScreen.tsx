import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import COLORS from '../constants/colors';
import { useProfile } from '../context/ProfileContext';

const BLACK = COLORS.black;
const CREAM = COLORS.surface;
const ORANGE = COLORS.primary;

const PROMPT_OPTIONS = [
    'A life goal of mine',
    'My simple pleasures',
    'A random fact I love',
    'Unusual skills',
    'My greatest strength',
    'My most irrational fear',
    'My go-to karaoke song',
    'The way to win me over is',
    'I geek out on',
    'All I ask is that you',
    'One thing I\'ll never do again',
    'Best travel story',
    'I\'m convinced that',
    'Together, we could',
    'The hallmark of a good relationship is',
    'I want someone who',
    'Typical Sunday',
    'Dating me is like',
    'Green flags I look for',
    'Two truths and a lie',
];

export default function EditPromptScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { addPrompt, updatePrompt, removePrompt } = useProfile();

    const { promptId, question: existingQuestion, answer: existingAnswer, userId } = route.params || {};
    const isEditing = !!promptId;

    const [selectedQuestion, setSelectedQuestion] = useState<string>(existingQuestion || '');
    const [answer, setAnswer] = useState<string>(existingAnswer || '');
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<'select' | 'answer'>(isEditing ? 'answer' : 'select');

    const handleSelectQuestion = (q: string) => {
        setSelectedQuestion(q);
        setStep('answer');
    };

    const handleSave = async () => {
        if (!selectedQuestion || !answer.trim()) {
            Alert.alert('Missing Info', 'Please select a prompt and write an answer.');
            return;
        }

        setIsSaving(true);
        let ok: boolean;

        if (isEditing) {
            ok = await updatePrompt(userId, promptId, selectedQuestion, answer.trim());
        } else {
            const result = await addPrompt(userId, selectedQuestion, answer.trim());
            ok = !!result;
        }

        setIsSaving(false);

        if (ok) {
            navigation.goBack();
        } else {
            Alert.alert('Error', 'Failed to save prompt. Please try again.');
        }
    };

    const handleDelete = () => {
        if (!isEditing) return;
        Alert.alert('Delete Prompt', 'Are you sure you want to remove this prompt?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setIsSaving(true);
                    const ok = await removePrompt(userId, promptId);
                    setIsSaving(false);
                    if (ok) {
                        navigation.goBack();
                    } else {
                        Alert.alert('Error', 'Failed to delete prompt.');
                    }
                },
            },
        ]);
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (step === 'answer' && !isEditing) {
                            setStep('select');
                        } else {
                            navigation.goBack();
                        }
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="arrow-back" size={24} color={BLACK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {step === 'select' ? 'CHOOSE PROMPT' : 'WRITE ANSWER'}
                </Text>
                {step === 'answer' ? (
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.5 }]}
                        onPress={handleSave}
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
                {step === 'select' && (
                    <View style={styles.optionsList}>
                        {PROMPT_OPTIONS.map((q) => (
                            <TouchableOpacity
                                key={q}
                                style={[styles.optionRow, selectedQuestion === q && styles.optionRowSelected]}
                                onPress={() => handleSelectQuestion(q)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.optionText, selectedQuestion === q && styles.optionTextSelected]}>
                                    {q}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {step === 'answer' && (
                    <View style={styles.answerContainer}>
                        <View style={styles.questionBadge}>
                            <Text style={styles.questionBadgeText}>{selectedQuestion}</Text>
                        </View>
                        <TextInput
                            style={styles.answerInput}
                            value={answer}
                            onChangeText={setAnswer}
                            placeholder="Write your answer..."
                            placeholderTextColor="rgba(13,13,13,0.3)"
                            selectionColor={ORANGE}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            autoFocus
                        />
                        {isEditing && (
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={handleDelete}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                                <Text style={styles.deleteBtnText}>Delete prompt</Text>
                            </TouchableOpacity>
                        )}
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

    // Options
    optionsList: {
        gap: 10,
    },
    optionRow: {
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

    // Answer
    answerContainer: {
        gap: 16,
    },
    questionBadge: {
        backgroundColor: ORANGE,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    questionBadgeText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 13,
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    answerInput: {
        borderWidth: 2,
        borderColor: BLACK,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: BLACK,
        height: 160,
        lineHeight: 24,
        textAlignVertical: 'top',
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        alignSelf: 'center',
    },
    deleteBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 13,
        color: COLORS.error,
    },
});
