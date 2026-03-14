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
    KeyboardAvoidingView,
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import { Feather } from '@expo/vector-icons';

interface PersonalInfoScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const PersonalInfoScreen: React.FC<PersonalInfoScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [birthday, setBirthday] = useState(state.birthday || '');
    const [country, setCountry] = useState(state.country || 'India');
    const [streetAddress, setStreetAddress] = useState(state.streetAddress || '');
    const [aptSuite, setAptSuite] = useState(state.aptSuite || '');
    const [linkedIn, setLinkedIn] = useState(state.linkedIn || '');
    const [github, setGithub] = useState(state.github || '');

    const handleContinue = () => {
        if (!birthday || !country || !streetAddress) return;

        saveField({
            birthday,
            country,
            streetAddress,
            aptSuite,
            linkedIn,
            github
        }).catch(() => undefined);

        dispatch({ type: 'SET_FIELD', field: 'birthday', value: birthday });
        dispatch({ type: 'SET_FIELD', field: 'country', value: country });
        dispatch({ type: 'SET_FIELD', field: 'streetAddress', value: streetAddress });
        dispatch({ type: 'SET_FIELD', field: 'aptSuite', value: aptSuite });
        dispatch({ type: 'SET_FIELD', field: 'linkedIn', value: linkedIn });
        dispatch({ type: 'SET_FIELD', field: 'github', value: github });

        onNext();
    };

    const isValid = birthday.length > 0 && country.length > 0 && streetAddress.length > 0;

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

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={styles.headerTitle}>Next, enter your personal info</Text>
                    <Text style={styles.headerDesc}>
                        Clients won't have access to this info.
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="yyyy-mm-dd"
                                placeholderTextColor="#888"
                                value={birthday}
                                onChangeText={setBirthday}
                            />
                            <View style={styles.inputIcon}>
                                <Text style={{ fontSize: 18 }}>🗓️</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Country *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                value={country}
                                onChangeText={setCountry}
                            />
                            <View style={styles.inputIcon}>
                                <Text style={{ fontSize: 14, color: '#e0e0e0' }}>▼</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Street address *</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter street address"
                            placeholderTextColor="#888"
                            value={streetAddress}
                            onChangeText={setStreetAddress}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Apt/Suite</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Apt/Suite (Optional)"
                            placeholderTextColor="#888"
                            value={aptSuite}
                            onChangeText={setAptSuite}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>LinkedIn Profile URL (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="https://linkedin.com/in/username"
                            placeholderTextColor="#888"
                            value={linkedIn}
                            onChangeText={setLinkedIn}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>GitHub Profile URL (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="https://github.com/username"
                            placeholderTextColor="#888"
                            value={github}
                            onChangeText={setGithub}
                            autoCapitalize="none"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer with 3 buttons */}
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
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#ffffff',
        marginBottom: 12,
    },
    inputContainer: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 14,
        paddingRight: 45,
        color: '#ffffff',
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#222',
        marginVertical: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0f1012',
        borderTopWidth: 1,
        borderTopColor: '#222',
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
        backgroundColor: '#333',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBtnActive: {
        backgroundColor: '#1dbf73',
    },
    nextBtnText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 15,
        color: '#ffffff',
    }
});

export default PersonalInfoScreen;
