import React, { useState, useEffect } from 'react';
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

interface HourlyRateScreenProps {
    onNext: () => void;
    onBack?: () => void;
}

const FEE_PERCENTAGE = 0.10; // 10% Service Fee

const HourlyRateScreen: React.FC<HourlyRateScreenProps> = ({ onNext, onBack }) => {
    const { dispatch, state } = useOnboarding();
    const insets = useSafeAreaInsets();
    const saveField = useUpdateOnboarding();

    const [hourlyRate, setHourlyRate] = useState<string>(state.hourlyRate?.toString() || '');
    const [serviceFee, setServiceFee] = useState<string>('0.00');
    const [totalEarnings, setTotalEarnings] = useState<string>('0.00');
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (hourlyRate) {
            calculateFromHourly(hourlyRate);
        }
    }, []);

    const calculateFromHourly = (val: string) => {
        const rate = parseFloat(val) || 0;
        const fee = rate * FEE_PERCENTAGE;
        const total = rate - fee;

        setServiceFee(fee.toFixed(2));
        setTotalEarnings(total.toFixed(2));
        validate(rate);
    };

    const calculateFromTotal = (val: string) => {
        const total = parseFloat(val) || 0;
        const rate = total / (1 - FEE_PERCENTAGE);
        const fee = rate - total;

        setHourlyRate(rate.toFixed(2));
        setServiceFee(fee.toFixed(2));
        validate(rate);
    };

    const validate = (rate: number) => {
        if (rate > 0 && (rate < 3 || rate > 999)) {
            setError(true);
        } else {
            setError(false);
        }
    };

    const handleContinue = () => {
        const rate = parseFloat(hourlyRate);
        if (rate >= 3 && rate <= 999) {
            saveField({ hourlyRate: rate }).catch(() => undefined);
            dispatch({ type: 'SET_FIELD', field: 'hourlyRate', value: rate });
            onNext();
        }
    };

    const isRateValid = parseFloat(hourlyRate) >= 3 && parseFloat(hourlyRate) <= 999;

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
                    <Text style={styles.headerTitle}>Hourly rate</Text>
                    <Text style={styles.headerDesc}>
                        Clients will see your rate on your profile and in search results. You can adjust it for each job.{' '}
                        <Text style={styles.linkText}>Service fees</Text> vary and will always be shown before you accept a contract.
                    </Text>

                    <View style={styles.rateRow}>
                        <Text style={styles.rateLabel}>Hourly rate</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.rateInput}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#888"
                                value={hourlyRate}
                                onChangeText={(text) => {
                                    setHourlyRate(text);
                                    calculateFromHourly(text);
                                }}
                            />
                            <Text style={styles.currencySymbol}>/hr</Text>
                        </View>
                    </View>

                    <Text style={styles.dividerIcon}>—</Text>

                    <View style={styles.rateRow}>
                        <Text style={styles.rateLabel}>Service fee (10%)</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.rateInput, styles.inputDisabled]}
                                value={serviceFee}
                                editable={false}
                            />
                            <Text style={styles.currencySymbol}>/hr</Text>
                        </View>
                    </View>

                    <Text style={styles.dividerIcon}>＝</Text>

                    <View style={styles.rateRow}>
                        <Text style={styles.rateLabel}>Total earnings</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.rateInput}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor="#888"
                                value={totalEarnings}
                                onChangeText={(text) => {
                                    setTotalEarnings(text);
                                    calculateFromTotal(text);
                                }}
                            />
                            <Text style={styles.currencySymbol}>/hr</Text>
                        </View>

                        {error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorIcon}>⚠</Text>
                                <Text style={styles.errorText}>Enter a rate between $3.00 and $999.00</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                {onBack && (
                    <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                        <Feather name="arrow-left" size={20} color="#1dbf73" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        isRateValid && styles.nextBtnActive,
                        !onBack && { marginLeft: 0 }
                    ]}
                    onPress={handleContinue}
                    activeOpacity={0.8}
                    disabled={!isRateValid}
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
        fontSize: 14,
        lineHeight: 22,
        color: '#e0e0e0',
        opacity: 0.8,
        marginBottom: 32,
    },
    linkText: {
        color: '#1dbf73',
        textDecorationLine: 'underline',
    },
    rateRow: {
        marginBottom: 24,
    },
    rateLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#ffffff',
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    rateInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 16,
        paddingRight: 50,
        color: '#ffffff',
        fontSize: 18,
        fontFamily: 'Inter_400Regular',
        textAlign: 'right',
    },
    inputDisabled: {
        backgroundColor: '#2a2a2a',
        color: '#888',
    },
    currencySymbol: {
        position: 'absolute',
        right: 16,
        fontSize: 16,
        color: '#e0e0e0',
        fontFamily: 'Inter_400Regular',
    },
    dividerIcon: {
        textAlign: 'center',
        fontSize: 24,
        color: '#e0e0e0',
        marginVertical: 10,
        opacity: 0.6,
    },
    errorBox: {
        backgroundColor: 'rgba(255, 77, 77, 0.1)',
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    errorIcon: {
        color: '#ff4d4d',
        fontSize: 16,
        marginRight: 8,
    },
    errorText: {
        color: '#ff4d4d',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#0f1012',
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

export default HourlyRateScreen;
