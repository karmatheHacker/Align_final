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
    Image,
    KeyboardAvoidingView,
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface AboutYouScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const AboutYouScreen: React.FC<AboutYouScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [title, setTitle] = useState(state.title || '');
    const [publicBio, setPublicBio] = useState(state.publicBio || '');
    const [imageUri, setImageUri] = useState<string | null>(state.photos?.[0] || null);
    const [isUploading, setIsUploading] = useState(false);

    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveProfilePhoto = useMutation(api.files.saveProfilePhoto);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedUri = result.assets[0].uri;
            setImageUri(selectedUri);

            // Upload to Convex
            try {
                setIsUploading(true);
                const uploadUrl = await generateUploadUrl();
                const response = await fetch(selectedUri);
                const blob = await response.blob();

                const uploadResult = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": "image/jpeg" },
                    body: blob,
                });

                const { storageId } = await uploadResult.json();
                await saveProfilePhoto({ storageId });

                dispatch({ type: 'SET_FIELD', field: 'photos', value: [selectedUri] });
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleContinue = () => {
        if (title.length < 4 || publicBio.length < 100) return;

        saveField({ title, publicBio }).catch(() => undefined);
        dispatch({ type: 'SET_FIELD', field: 'title', value: title });
        dispatch({ type: 'SET_FIELD', field: 'publicBio', value: publicBio });
        onNext();
    };

    const isValid = title.length >= 4 && publicBio.length >= 100;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusBarPlaceholder} />

            {/* Top Nav Bar */}
            <View style={styles.navBar}>
                <View style={styles.navIconContainer}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <Text style={styles.navTitle} numberOfLines={1}>Create Your Profile</Text>
                <View style={styles.navIconContainer}>
                    <Text style={{ fontSize: 20, color: '#fff' }}>⋮</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.headerTitle}>Next, fill out your profile</Text>
                    <Text style={styles.headerDesc}>
                        Highlight what you're good at and how you can help clients. What you share here will be visible to them.
                    </Text>

                    <Text style={styles.sectionTitle}>About you</Text>

                    <View style={styles.photoContainer}>
                        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.profileCircle}>
                            {imageUri ? (
                                <Image source={{ uri: imageUri }} style={styles.profileImage} />
                            ) : (
                                <Text style={styles.initials}>
                                    {state.name ? state.name.substring(0, 2).toUpperCase() : 'RC'}
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePickImage}>
                            <Text style={styles.addPhotoBtn}>
                                {isUploading ? 'Uploading...' : imageUri ? 'Change your photo' : 'Add your photo'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Title *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Example: Data Science & Analytics"
                            placeholderTextColor="#888"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <Text style={[styles.charCount, title.length >= 4 && { color: '#1dbf73' }]}>
                            {title.length < 4 ? 'At least 4 characters' : '✓'}
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Introduction *</Text>
                        <TextInput
                            style={styles.textareaInput}
                            placeholder="Enter your top skills, experiences, and interests. This is one of the first things clients will see on your profile."
                            placeholderTextColor="#888"
                            multiline
                            textAlignVertical="top"
                            value={publicBio}
                            onChangeText={setPublicBio}
                        />
                        <View style={styles.charCountRow}>
                            <Text style={[styles.charCount, publicBio.length >= 100 && { color: '#1dbf73' }]}>
                                {publicBio.length < 100 ? `At least 100 characters (${publicBio.length}/100)` : '✓'}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1dbf73" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        isValid && styles.nextBtnActive
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!isValid}
                >
                    <Text style={styles.nextBtnText}>Next</Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 20,
        color: '#ffffff',
        marginBottom: 24,
    },
    photoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    profileCircle: {
        width: 100,
        height: 100,
        backgroundColor: '#ccc',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    initials: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 32,
        color: '#777',
    },
    addPhotoBtn: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#1dbf73',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#ffffff',
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 16,
        color: '#ffffff',
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
    },
    textareaInput: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 16,
        color: '#ffffff',
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
        height: 140,
    },
    charCountRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    charCount: {
        textAlign: 'right',
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#e0e0e0',
        marginTop: 8,
        opacity: 0.7,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: '#0f1012',
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
        backgroundColor: '#333333',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    nextBtnActive: {
        backgroundColor: '#1dbf73',
    },
    nextBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 16,
        color: '#ffffff',
    }
});

export default AboutYouScreen;
