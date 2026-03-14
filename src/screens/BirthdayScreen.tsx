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
import Svg, { Circle, Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';

interface FreelancerTypeScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const FREELANCER_OPTIONS = [
    {
        id: 'side_hustle',
        title: 'A side hustle',
        icon: (
            <Svg viewBox="0 0 100 100" width={70} height={70} fill="none">
                <Circle cx="50" cy="65" r="22" fill="#14a800" />
                <Path d="M42,80 L42,40 C42,35 46,30 46,30 C46,30 49,35 49,40 L49,50" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M52,50 L52,25 C52,20 57,18 57,25 L57,55" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M42,65 C35,65 35,75 42,75 L60,75 L60,55 C65,50 65,65 65,65 L65,80 L42,80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M42,80 L42,95 L65,95 L65,80" fill="#ffffff" stroke="#ffffff" strokeWidth="3" />
            </Svg>
        ),
    },
    {
        id: 'solo_freelancer',
        title: 'Solo\nfreelancer',
        icon: (
            <Svg viewBox="0 0 100 100" width={70} height={70} fill="none">
                <Circle cx="50" cy="65" r="22" fill="#14a800" />
                <Path d="M60,20 L65,25 L75,50 L70,55 Z" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
                <Path d="M60,20 L55,15 L65,25" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
                <Path d="M75,50 L78,60 L70,55" fill="#14a800" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
                <Path d="M40,95 L40,70 C40,60 45,45 50,45 C55,45 55,55 55,55 C60,50 65,55 60,65 C65,65 65,75 55,80 L55,95 Z" fill="#ffffff" />
                <Path d="M45,45 C55,30 65,40 65,50" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </Svg>
        ),
    },
    {
        id: 'agency_employee',
        title: 'Agency\nemployee',
        icon: (
            <Svg viewBox="0 0 100 100" width={70} height={70} fill="none">
                <Circle cx="30" cy="40" r="14" fill="#14a800" />
                <Circle cx="70" cy="70" r="18" fill="#14a800" />
                <Path d="M20,30 L45,55 L55,50 L40,30 M20,30 L35,20 L50,45" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M60,60 C55,50 65,45 70,50 L80,70 L60,70 Z" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M60,95 L60,80 L80,80 L80,95 Z" fill="#ffffff" />
                <Path d="M50,35 L55,40 M60,30 L55,25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </Svg>
        ),
    },
    {
        id: 'agency_owner',
        title: 'Agency\nowner',
        icon: (
            <Svg viewBox="0 0 100 100" width={70} height={70} fill="none">
                <Circle cx="50" cy="75" r="18" fill="#14a800" />
                <Path d="M35,45 L40,25 L50,35 L60,25 L65,45 Z" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
                <Circle cx="50" cy="15" r="2" fill="#ffffff" />
                <Path d="M30,70 C40,65 60,65 70,60 C75,55 80,60 75,65 C60,70 50,75 50,85 L30,85 Z" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M30,95 L30,75 L50,85 L50,95 Z" fill="#ffffff" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
            </Svg>
        ),
    },
];

const BirthdayScreen: React.FC<FreelancerTypeScreenProps> = ({ onNext, onBack }) => {
    const { dispatch } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();
    const [selected, setSelected] = React.useState<string | null>(null);

    const handleContinue = () => {
        if (!selected) return;
        saveField({ freelancerType: selected }).catch(() => undefined);
        dispatch({ type: 'SET_FIELD', field: 'freelancerType', value: selected });
        onNext();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusBarPlaceholder} />

            <ScrollView contentContainerStyle={styles.content} bounces={false}>
                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>What type of freelancer are you?</Text>
                    <Text style={styles.headerDesc}>
                        Whatever your style, we'll make it work.
                    </Text>
                </View>

                <View style={styles.gridContainer}>
                    {FREELANCER_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.card,
                                selected === option.id && styles.cardSelected,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setSelected(option.id)}
                        >
                            <View style={styles.cardIconContainer}>
                                {option.icon}
                            </View>
                            <Text style={styles.cardTitle}>{option.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={[styles.footerSection, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={20} color="#1dbf73" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.continueButton, !selected && styles.btnDisabled]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!selected}
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
        backgroundColor: '#0f1012',
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
        marginTop: 40,
        marginBottom: 32,
    },
    headerTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 32,
        lineHeight: 38,
        color: '#ffffff',
        marginBottom: 12,
    },
    headerDesc: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        lineHeight: 22,
        color: '#e0e0e0',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 100,
    },
    card: {
        width: '47%',
        backgroundColor: '#1c1c1c',
        borderRadius: 12,
        padding: 20,
        aspectRatio: 0.85,
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#14a800',
    },
    cardIconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        lineHeight: 21,
        color: '#ffffff',
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
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
    },
    btnDisabled: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    continueButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#000000',
    },
});

export default BirthdayScreen;
