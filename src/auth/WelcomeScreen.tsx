import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    useWindowDimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView
} from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

interface WelcomeScreenProps {
    onNext: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);

    const handleSignInWithGoogle = useCallback(async () => {
        try {
            const redirectUrl = Linking.createURL('/', { scheme: 'alignfinal' });
            const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
            }
        } catch {
            // User cancellations and OAuth errors are silently swallowed here
        }
    }, [startOAuthFlow]);

    const renderFeature = (icon: any, text: string) => (
        <View style={styles.featureItem} key={text}>
            <View style={styles.featureIconContainer}>
                <Ionicons name={icon} size={20} color="#6366f1" />
            </View>
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    const leftContent = (
        <View style={[styles.leftPane, isDesktop && styles.leftPaneDesktop, { paddingTop: isDesktop ? 60 : Math.max(insets.top + 40, 60) }]}>
            <View style={styles.logoContainer}>
                <Ionicons name="layers" size={32} color="#6366f1" />
                <Text style={styles.logoText}>Propoze</Text>
            </View>

            <View style={styles.heroContent}>
                <Text style={[styles.headline, isDesktop && { fontSize: 48, lineHeight: 56 }]}>
                    Build Smarter Freelance Proposals with AI
                </Text>
                <Text style={styles.subtext}>
                    Upload project briefs, explore requirements with conversational AI, and submit highly accurate bids.
                </Text>

                <View style={styles.featuresList}>
                    {renderFeature('document-text', 'AI understands project documents instantly')}
                    {renderFeature('chatbubble-ellipses', 'Ask questions about client requirements')}
                    {renderFeature('flash', 'Create precise, context-aware bids')}
                </View>
            </View>
        </View>
    );

    const rightContent = (
        <View style={[
            styles.rightPane,
            isDesktop ? styles.rightPaneDesktop : styles.rightPaneMobile,
            { paddingBottom: Math.max(insets.bottom + 40, 40) }
        ]}>
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Get Started</Text>
                <Text style={styles.formSubtitle}>Enter your details to sign in or create an account</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="name@company.com"
                        placeholderTextColor="#475569"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Primary CTA */}
                <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => { /* Placeholder */ }}>
                    <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or click below</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Secondary CTA: Google */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSignInWithGoogle}
                    activeOpacity={0.8}
                >
                    <Ionicons name="logo-google" size={20} color="#f8fafc" />
                    <Text style={styles.secondaryButtonText}>Sign in with Google</Text>
                </TouchableOpacity>

                {/* Secondary CTA: Email */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => { /* Placeholder */ }}
                    activeOpacity={0.8}
                >
                    <Ionicons name="mail" size={20} color="#f8fafc" />
                    <Text style={styles.secondaryButtonText}>Sign in with Email</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (isDesktop) {
        return (
            <SafeAreaView style={[styles.container, { flexDirection: 'row' }]}>
                {leftContent}
                {rightContent}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    bounces={false}
                >
                    {leftContent}
                    {rightContent}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // Slate 900
    },
    leftPane: {
        paddingHorizontal: 32,
        paddingBottom: 40,
        backgroundColor: '#0f172a',
    },
    leftPaneDesktop: {
        flex: 1.2,
        paddingHorizontal: 60,
        justifyContent: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 60,
    },
    logoText: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 26,
        color: '#f8fafc',
        marginLeft: 12,
        letterSpacing: -0.5,
    },
    heroContent: {
        maxWidth: 540,
    },
    headline: {
        fontFamily: 'Inter_800ExtraBold',
        fontSize: 36,
        lineHeight: 44,
        color: '#f8fafc',
        marginBottom: 24,
        letterSpacing: -1,
    },
    subtext: {
        fontFamily: 'Inter_400Regular',
        fontSize: 18,
        lineHeight: 28,
        color: '#94a3b8',
        marginBottom: 48,
    },
    featuresList: {
        flexDirection: 'column',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    featureIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
    },
    featureText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#e2e8f0',
        flex: 1,
        lineHeight: 24,
    },
    rightPane: {
        backgroundColor: '#1e293b', // Slate 800
        paddingHorizontal: 32,
        paddingTop: 48,
    },
    rightPaneDesktop: {
        width: 440,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: -8, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 12,
        paddingHorizontal: 48,
    },
    rightPaneMobile: {
        flex: 1,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    formContainer: {
        width: '100%',
        maxWidth: 380,
        alignSelf: 'center',
    },
    formTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 28,
        color: '#f8fafc',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    formSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#94a3b8',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 14,
        color: '#cbd5e1',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        height: 52,
        paddingHorizontal: 16,
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#f8fafc',
    },
    primaryButton: {
        backgroundColor: '#6366f1',
        height: 52,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#ffffff',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    dividerText: {
        marginHorizontal: 16,
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        height: 52,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    secondaryButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
        color: '#e2e8f0',
        marginLeft: 12,
    },
});

