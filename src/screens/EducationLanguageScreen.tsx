import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    SafeAreaView,
    ScrollView,
    TextInput,
    Modal,
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import { Feather, MaterialIcons } from '@expo/vector-icons';

interface EducationLanguageScreenProps {
    onNext: () => void;
    onBack?: () => void;
}

const PROFICIENCY_LEVELS = [
    'Basic',
    'Conversational',
    'Fluent',
    'Native or Bilingual'
];

const EducationLanguageScreen: React.FC<EducationLanguageScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [education, setEducation] = useState(state.education || '');
    const [languages, setLanguages] = useState(state.languages || [{ language: 'English', proficiency: 'Fluent' }]);

    const [showEducationModal, setShowEducationModal] = useState(false);
    const [tempEducation, setTempEducation] = useState('');

    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState('Fluent');

    const handleAddEducation = () => {
        if (tempEducation.trim()) {
            setEducation(tempEducation.trim());
            setShowEducationModal(false);
            setTempEducation('');
        }
    };

    const handleContinue = () => {
        saveField({ education, languages }).catch(() => undefined);
        dispatch({ type: 'SET_FIELD', field: 'education', value: education });
        dispatch({ type: 'SET_FIELD', field: 'languages', value: languages });
        onNext();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusBarPlaceholder} />

            {/* Top Nav Bar */}
            <View style={styles.navBar}>
                <View style={styles.navIconContainer}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <Text style={styles.navTitle} numberOfLines={1}>Create Your Pro...</Text>
                <View style={styles.navIconContainer}>
                    <Text style={{ fontSize: 20, color: '#fff' }}>⋮</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Education</Text>
                    <TouchableOpacity style={styles.addBtnCircle} onPress={() => setShowEducationModal(true)}>
                        <Text style={styles.addBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.description}>
                    This doesn't just have to be a degree. Adding any relevant education helps clients understand your expertise.
                </Text>

                {education ? (
                    <View style={styles.entryItem}>
                        <Feather name="book-open" size={18} color="#1dbf73" />
                        <Text style={styles.entryText}>{education}</Text>
                        <TouchableOpacity onPress={() => setEducation('')}>
                            <Feather name="x" size={18} color="#888" />
                        </TouchableOpacity>
                    </View>
                ) : null}

                <View style={styles.divider} />

                <View style={{ marginTop: 24 }} />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Language</Text>
                    <TouchableOpacity style={styles.addBtnCircle}>
                        <Text style={styles.addBtnText}>+</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.description}>
                    Help clients connect with you more easily. English is required, but any level is welcome.
                </Text>

                <View style={styles.languageGrid}>
                    <View style={styles.langColumn}>
                        <Text style={styles.inputLabel}>Language</Text>
                        <View style={styles.staticInput}>
                            <Text style={styles.staticInputText}>English (required)</Text>
                        </View>
                    </View>
                    <View style={styles.langColumn}>
                        <Text style={styles.inputLabel}>Proficiency</Text>
                        <TouchableOpacity
                            style={styles.dropdownSelect}
                            onPress={() => setShowLanguageModal(true)}
                        >
                            <Text style={styles.dropdownText}>{languages[0]?.proficiency || 'My level is...'}</Text>
                            <Feather name="chevron-down" size={16} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1dbf73" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextBtn, !education && styles.btnDisabled]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!education}
                >
                    <Text style={styles.nextBtnText}>Next</Text>
                </TouchableOpacity>
            </View>

            {/* Education Modal */}
            <Modal visible={showEducationModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Education</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="University, Degree or Course"
                            placeholderTextColor="#888"
                            value={tempEducation}
                            onChangeText={setTempEducation}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setShowEducationModal(false)}>
                                <Text style={styles.modalCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddEducation}>
                                <Text style={styles.modalAdd}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Language Modal */}
            <Modal visible={showLanguageModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.modalTitle}>English Proficiency</Text>
                        {PROFICIENCY_LEVELS.map((level) => (
                            <TouchableOpacity
                                key={level}
                                style={styles.pickerItem}
                                onPress={() => {
                                    const newLangs = [...languages];
                                    newLangs[0] = { ...newLangs[0], proficiency: level };
                                    setLanguages(newLangs);
                                    setShowLanguageModal(false);
                                }}
                            >
                                <Text style={[styles.pickerItemText, languages[0]?.proficiency === level && { color: '#1dbf73' }]}>
                                    {level}
                                </Text>
                                {languages[0]?.proficiency === level && <Feather name="check" size={18} color="#1dbf73" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f1012',
    },
    statusBarPlaceholder: {
        height: Platform.OS === 'android' ? 24 : 0,
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
        justifyContent: 'space-between',
    },
    navTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#ffffff',
        flex: 1,
        paddingHorizontal: 10,
    },
    navIconContainer: {
        width: 30,
        alignItems: 'center'
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: '#ffffff',
    },
    addBtnCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1dbf73',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        color: '#ffffff',
        fontSize: 24,
        lineHeight: 28,
        fontWeight: '300',
    },
    description: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        lineHeight: 22,
        color: '#e0e0e0',
        opacity: 0.8,
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#222',
        marginVertical: 32,
    },
    languageGrid: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 10,
    },
    langColumn: {
        flex: 1,
    },
    inputLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 8,
    },
    staticInput: {
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
    },
    staticInputText: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    dropdownSelect: {
        backgroundColor: '#1c1c1c',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: '#0f1012',
        borderTopWidth: 1,
        borderTopColor: '#222',
        flexDirection: 'row',
        gap: 12,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#444',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    nextBtn: {
        flex: 1,
        backgroundColor: '#1dbf73',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    btnDisabled: {
        opacity: 0.5,
        backgroundColor: '#333',
    },
    nextBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#ffffff',
    },
    entryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c1c1c',
        padding: 12,
        borderRadius: 8,
        gap: 12,
        marginBottom: 8,
    },
    entryText: {
        flex: 1,
        color: '#ffffff',
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#1c1c1c',
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: '#ffffff',
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: '#252525',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 12,
        color: '#ffffff',
        fontSize: 16,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 20,
    },
    modalCancel: {
        color: '#888',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    modalAdd: {
        color: '#1dbf73',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    pickerContainer: {
        width: '100%',
        backgroundColor: '#1c1c1c',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        position: 'absolute',
        bottom: 0,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#ffffff',
        fontFamily: 'Inter_500Medium',
    }
});

export default EducationLanguageScreen;
