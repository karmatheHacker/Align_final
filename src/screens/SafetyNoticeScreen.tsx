import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import StepIndicator from '../components/StepIndicator';
import { STEP_ORDER } from '../constants/steps';
import { FooterFadeIn } from '../components/OnboardingAnimations';

interface SafetyNoticeScreenProps {
    onNext: () => void;
    onBack: () => void;
}

const SafetyNoticeScreen: React.FC<SafetyNoticeScreenProps> = ({ onNext, onBack }) => {
    const insets = useSafeAreaInsets();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const currentIndex = STEP_ORDER.indexOf('safety');
    const totalSteps = STEP_ORDER.length;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleAgree = () => {
        onNext();
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StepIndicator
                    currentIndex={currentIndex}
                    totalSteps={totalSteps}
                    onBack={onBack}
                />

                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="security" size={32} color="white" />
                    </View>

                    <Text style={styles.title}>
                        Community{'\n'}First.
                    </Text>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.rulesContainer}>
                            <View style={styles.ruleItem}>
                                <Text style={styles.ruleTitle}>BE KIND</Text>
                                <Text style={styles.ruleDescription}>
                                    Align is a community of respect. Harassment, hate speech, and bullying are not tolerated.
                                </Text>
                            </View>

                            <View style={styles.ruleItem}>
                                <Text style={styles.ruleTitle}>BE AUTHENTIC</Text>
                                <Text style={styles.ruleDescription}>
                                    Upload only your own photos and represent yourself honestly.
                                </Text>
                            </View>

                            <View style={styles.ruleItem}>
                                <Text style={styles.ruleTitle}>STAY SAFE</Text>
                                <Text style={styles.ruleDescription}>
                                    Never share financial information. Report any suspicious activity immediately.
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </Animated.View>

                {/* Footer Action */}
                <FooterFadeIn
                    delay={100}
                    style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}
                >
                    <TouchableOpacity
                        style={styles.btnAgree}
                        onPress={handleAgree}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnText}>I Agree</Text>
                        <Feather name="arrow-right" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                </FooterFadeIn>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface, // bg-cream
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    iconContainer: {
        width: 64,
        height: 64,
        backgroundColor: COLORS.black,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontFamily: 'Inter_900Black',
        fontSize: 48,
        lineHeight: 52,
        color: COLORS.text,
        marginBottom: SPACING.xxl,
        letterSpacing: -1,
    },
    scrollContent: {
        paddingBottom: SPACING.xl,
    },
    rulesContainer: {
        gap: SPACING.xl,
    },
    ruleItem: {
        marginBottom: SPACING.lg,
    },
    ruleTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: COLORS.text,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    ruleDescription: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: COLORS.gray,
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    btnAgree: {
        width: '100%',
        backgroundColor: COLORS.black,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    btnText: {
        fontFamily: 'Inter_900Black',
        color: COLORS.white,
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginRight: SPACING.sm,
    },
});

export default SafetyNoticeScreen;
