import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUpdateOnboarding } from '../hooks/useUpdateOnboarding';
import Svg, { Rect, Path, Circle, Line } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';

interface NameScreenProps {
    onNext: (role?: string) => void;
    onBack: () => void;
}

const NameScreen: React.FC<NameScreenProps> = ({ onNext, onBack }) => {
    const { dispatch } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [selectedRole, setSelectedRole] = React.useState<string | null>(null);

    // Using role
    const handleSelect = (role: string) => {
        setSelectedRole(role);
    };

    const handleContinue = () => {
        if (!selectedRole) return;
        saveField({ role: selectedRole }).catch(() => undefined);
        dispatch({ type: 'SET_FIELD', field: 'role', value: selectedRole });
        onNext(selectedRole);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusBarPlaceholder} />

            <ScrollView contentContainerStyle={styles.content} bounces={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>What brings you to Propoze?</Text>
                    <Text style={styles.headerDesc}>
                        We want to tailor your experience so you'll feel right at home.
                    </Text>
                </View>

                <View style={styles.cardsSection}>
                    <TouchableOpacity
                        style={[styles.card, selectedRole === 'buyer' && styles.cardSelected]}
                        activeOpacity={0.8}
                        onPress={() => handleSelect('buyer')}
                    >
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Buying freelance services</Text>
                            <Text style={styles.cardDesc}>I'm looking for talented people to work with.</Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Svg fill="none" height="48" viewBox="0 0 48 48" width="48">
                                <Rect height="32" rx="4" stroke="white" strokeWidth="2" width="44" x="2" y="10" />
                                <Circle cx="24" cy="24" r="6" stroke="#1dbf73" strokeWidth="2" />
                                <Line stroke="#1dbf73" strokeLinecap="round" strokeWidth="2" x1="28.5" x2="33" y1="28.5" y2="33" />
                                <Circle cx="10" cy="38" fill="white" r="1.5" />
                            </Svg>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.card, selectedRole === 'freelancer' && styles.cardSelected]}
                        activeOpacity={0.8}
                        onPress={() => handleSelect('freelancer')}
                    >
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Selling freelance services</Text>
                            <Text style={styles.cardDesc}>I'd like to offer my services.</Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <Svg fill="none" height="48" viewBox="0 0 48 48" width="48">
                                <Rect height="32" rx="4" stroke="white" strokeWidth="2" width="44" x="2" y="10" />
                                <Path d="M28 20L31 17L34 20L31 23L28 20Z" stroke="#1dbf73" strokeWidth="2" />
                                <Path d="M22 26L28 20M22 26L20 28M22 26L24 24" stroke="#1dbf73" strokeWidth="2" />
                                <Circle cx="10" cy="38" fill="white" r="1.5" />
                            </Svg>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <View style={[styles.footerSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1dbf73" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.continueButton, !selectedRole && styles.btnDisabled]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!selectedRole}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    statusBarPlaceholder: {
        height: Platform.OS === 'android' ? 24 : 0,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
    },
    headerSection: {
        marginBottom: 40,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 30,
        lineHeight: 36,
        color: '#ffffff',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    headerDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 18,
        lineHeight: 28,
        color: '#9ca3af',
    },
    cardsSection: {
        width: '100%',
    },
    card: {
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333333',
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    cardSelected: {
        borderColor: '#1dbf73',
        backgroundColor: 'rgba(29, 191, 115, 0.05)',
    },
    cardTextContainer: {
        flex: 1,
        paddingRight: 16,
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 18,
        color: '#ffffff',
        marginBottom: 4,
    },
    cardDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: '#9ca3af',
    },
    iconContainer: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8,
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
    continueButton: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    btnDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    continueButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: '#000000',
    },
});

export default NameScreen;
