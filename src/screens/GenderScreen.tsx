import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    SafeAreaView,
    ScrollView,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import Svg, { Path } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ProfileBuildOptionScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const BUILD_OPTIONS = [
    {
        id: 'upload_resume',
        title: 'Upload resume',
        icon: (
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </Svg>
        ),
    },
    {
        id: 'fill_manually',
        title: 'Fill out manually',
        icon: (
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </Svg>
        ),
    },
];

const GenderScreen: React.FC<ProfileBuildOptionScreenProps> = ({ onNext, onBack }) => {
    const { dispatch } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [selected, setSelected] = useState<string | null>(null);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveResume = useMutation(api.files.saveResume);

    const proceedToNext = async (buildOption: string) => {
        saveField({ profileBuildOption: buildOption }).catch(() => undefined);
        dispatch({ type: 'SET_FIELD', field: 'profileBuildOption', value: buildOption });
        onNext();
    };

    const handleContinue = () => {
        if (!selected) return;
        if (selected === 'upload_resume') {
            setModalVisible(true);
        } else {
            proceedToNext('fill_manually');
        }
    };

    const handleFileUpload = async () => {
        setUploadError('');
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }

            const file = result.assets[0];

            // Size validation (Max 5MB)
            if (file.size && file.size > 5 * 1024 * 1024) {
                setUploadError('File exceeds 5MB limit.');
                return;
            }

            setIsUploading(true);
            const uploadUrl = await generateUploadUrl();
            if (!uploadUrl) throw new Error("Could not generate upload URL");

            const response = await fetch(file.uri);
            const blob = await response.blob();

            const uploadResult = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.mimeType || 'application/octet-stream' },
                body: blob,
            });

            if (!uploadResult.ok) throw new Error("Upload to storage failed");
            const { storageId } = await uploadResult.json();

            // Save to convex
            await saveResume({ storageId });

            // Close modal & proceed
            setModalVisible(false);
            proceedToNext('upload_resume');

        } catch (error) {
            console.error(error);
            setUploadError('An error occurred during upload. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusBarPlaceholder} />

            <ScrollView contentContainerStyle={styles.content} bounces={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>How would you like to start building your profile?</Text>
                    <Text style={styles.headerDesc}>
                        A strong, complete profile helps clients find you and increases your chances of getting hired.
                    </Text>
                </View>

                <View style={styles.optionsContainer}>
                    {BUILD_OPTIONS.map((option) => {
                        const isSelected = selected === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.card,
                                    isSelected && styles.cardSelected,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => setSelected(option.id)}
                            >
                                <View style={styles.cardIcon}>
                                    {React.cloneElement(option.icon, { color: isSelected ? '#1dbf73' : '#1dbf73' })}
                                </View>
                                <Text style={styles.cardTitle}>{option.title}</Text>
                                <View style={[
                                    styles.radioIndicator,
                                    isSelected && styles.radioIndicatorSelected
                                ]} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footerSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1dbf73" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        selected && styles.nextBtnActive
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!selected}
                >
                    <Text style={[
                        styles.nextBtnText,
                        selected && styles.nextBtnTextActive
                    ]}>
                        Next
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Sheet Modal for Upload */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => !isUploading && setModalVisible(false)}
                    />
                    <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 32) }]}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setModalVisible(false)}
                            disabled={isUploading}
                        >
                            <Text style={styles.closeBtnText}>×</Text>
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Upload resume</Text>

                        <Text style={styles.fileInfo}>Max file size: 5MB</Text>
                        <Text style={[styles.fileInfo, { marginBottom: 20 }]}>Supported file types: PDF, DOC, DOCX</Text>

                        <TouchableOpacity
                            style={styles.uploadArea}
                            onPress={handleFileUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator color="#1dbf73" size="small" />
                            ) : (
                                <Text style={styles.uploadAreaText}>Choose a file</Text>
                            )}
                        </TouchableOpacity>

                        {uploadError ? (
                            <View style={styles.errorMsg}>
                                <Text style={styles.errorIcon}>⚠️</Text>
                                <Text style={styles.errorText}>{uploadError}</Text>
                            </View>
                        ) : null}
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
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    headerSection: {
        marginTop: 20,
        marginBottom: 32,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        lineHeight: 34,
        color: '#ffffff',
        marginBottom: 12,
    },
    headerDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 15,
        lineHeight: 22,
        color: '#e0e0e0',
        opacity: 0.8,
    },
    optionsContainer: {
        gap: 16,
        marginBottom: 100,
    },
    card: {
        backgroundColor: '#1c1c1c',
        borderRadius: 12,
        padding: 24,
        flexDirection: 'column',
        gap: 12,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#1dbf73',
        backgroundColor: '#252525',
    },
    cardIcon: {
        marginBottom: 4,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#ffffff',
    },
    radioIndicator: {
        position: 'absolute',
        top: 24,
        right: 24,
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#444',
        borderRadius: 10,
    },
    radioIndicatorSelected: {
        borderColor: '#1dbf73',
        backgroundColor: '#1dbf73',
    },
    footerSection: {
        paddingHorizontal: 24,
        paddingTop: 16,
        flexDirection: 'row',
        gap: 12,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    nextBtn: {
        flex: 1,
        backgroundColor: '#333333',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    nextBtnActive: {
        backgroundColor: '#ffffff', // As per the newest HTML styles
    },
    nextBtnText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#888888',
    },
    nextBtnTextActive: {
        color: '#000000',
    },
    /* Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: '#1c1c1c',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 20,
        padding: 4,
    },
    closeBtnText: {
        fontSize: 28,
        color: '#e0e0e0',
        lineHeight: 28,
    },
    modalTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 24,
        color: '#ffffff',
        marginBottom: 24,
    },
    fileInfo: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#e0e0e0',
        marginBottom: 8,
    },
    uploadArea: {
        borderWidth: 1.5,
        borderColor: '#444',
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    uploadAreaText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#1dbf73',
    },
    errorMsg: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 4,
    },
    errorIcon: {
        fontSize: 14,
        color: '#ff4d4d',
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        color: '#ff4d4d',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    }
});

export default GenderScreen;
