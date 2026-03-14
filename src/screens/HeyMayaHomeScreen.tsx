import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    TextInput,
    Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HeyMayaHomeScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useUser();
    const insets = useSafeAreaInsets();
    const sendMessage = useAction(api.ai.chat.sendMessage);

    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isSending) {
            navigation.navigate('HeyMayaChat');
            return;
        }

        navigation.navigate('HeyMayaChat', { initialMessage: inputText });
        setInputText('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 20 : 0 }]}>
                <TouchableOpacity style={styles.iconBox}>
                    <Feather name="grid" size={24} color="#1d1d1f" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBox, styles.notificationBadge]}>
                    <Feather name="bell" size={24} color="#1d1d1f" />
                    <View style={styles.badgeCount}>
                        <Text style={styles.badgeText}>5</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.userGreeting}>
                            Hey <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
                        </Text>
                    </View>
                    <View style={styles.mainHeadline}>
                        <View style={styles.avatarCircle}>
                            <LinearGradient
                                colors={['#6e8efb', '#a777e3']}
                                style={styles.aiIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <MaterialCommunityIcons name="robot" size={32} color="white" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.headlineText}>How can I help you today?</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.chatContainer}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('HeyMayaChat')}
                >
                    <TextInput
                        style={styles.chatInputArea}
                        placeholder='Try "I need a video editor for a 2-minute YouTube video"'
                        placeholderTextColor="#6e6e73"
                        multiline
                        value={inputText}
                        onChangeText={setInputText}
                        editable={true}
                    />
                    <View style={styles.chatControls}>
                        <TouchableOpacity style={styles.plusCircle}>
                            <Feather name="plus" size={20} color="#8e8e93" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.upCircle, !inputText.trim() && { opacity: 0.5 }]}
                            onPress={handleSendMessage}
                        >
                            <Feather name="arrow-up" size={20} color="#c4a484" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {aiResponse && (
                    <View style={styles.aiResponseBox}>
                        <View style={styles.aiHeader}>
                            <MaterialCommunityIcons name="robot" size={16} color="#1d1d1f" />
                            <Text style={styles.aiResponseLabel}>HeyMaya</Text>
                        </View>
                        <Text style={styles.aiResponseText}>{aiResponse}</Text>
                    </View>
                )}

                <View style={styles.actionList}>
                    <TouchableOpacity
                        style={[styles.actionItem, styles.propozeItem]}
                        onPress={() => navigation.navigate('PropozeChat')}
                    >
                        <View style={styles.actionLeft}>
                            <LinearGradient
                                colors={['#6e8efb', '#a777e3']}
                                style={styles.propozeGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <MaterialCommunityIcons name="file-document-outline" size={18} color="white" />
                            </LinearGradient>
                            <View>
                                <Text style={styles.propozeTitle}>Propoze Intelligence</Text>
                                <Text style={styles.propozeSubtitle}>Analyze project documents with citations</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color="#6e8efb" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <View style={styles.actionLeft}>
                            <Text style={styles.plusIcon}>+</Text>
                            <Text style={styles.actionText}>I am a freelancer</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#c7c7cc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionItem}>
                        <View style={styles.actionLeft}>
                            <Text style={styles.plusIcon}>+</Text>
                            <Text style={styles.actionText}>I am a client looking for freelancer</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#c7c7cc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionItem, styles.statsItem]}>
                        <View style={styles.actionLeft}>
                            <Feather name="activity" size={20} color="#1d1d1f" style={{ marginRight: 12 }} />
                            <Text style={styles.actionText}>Check on my active projects</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#c7c7cc" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f7f2',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    iconBox: {
        width: 40,
        height: 40,
        backgroundColor: 'white',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    notificationBadge: {
        position: 'relative',
    },
    badgeCount: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#e67e22',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'white',
        minWidth: 18,
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    hero: {
        marginBottom: 30,
    },
    greetingContainer: {
        marginBottom: 8,
    },
    userGreeting: {
        fontSize: 20,
        color: '#6e6e73',
    },
    userName: {
        fontStyle: 'italic',
        color: '#1d1d1f',
        fontWeight: '500',
    },
    mainHeadline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#d1d1d6',
    },
    aiIcon: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6e8efb', // Simplified gradient placeholder
    },
    headlineText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1d1d1f',
        flex: 1,
        lineHeight: 34,
    },
    chatContainer: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    chatInputArea: {
        fontSize: 16,
        color: '#1d1d1f',
        minHeight: 40,
        textAlignVertical: 'top',
        padding: 8,
    },
    chatControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    plusCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f2f2f7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    upCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0e2d3',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiResponseBox: {
        backgroundColor: '#f2f2f7',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    aiResponseLabel: {
        fontWeight: '700',
        color: '#1d1d1f',
    },
    aiResponseText: {
        color: '#1d1d1f',
        lineHeight: 22,
    },
    actionList: {
        gap: 12,
    },
    actionItem: {
        backgroundColor: '#f2f2f7',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plusIcon: {
        fontSize: 20,
        fontWeight: '500',
        color: '#1d1d1f',
        marginRight: 12,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1d1d1f',
    },
    statsItem: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#e5e5ea',
    },
    propozeItem: {
        backgroundColor: 'white',
        paddingVertical: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#6e8efb',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    propozeGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    propozeTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1d1d1f',
    },
    propozeSubtitle: {
        fontSize: 12,
        color: '#6e6e73',
        marginTop: 2,
    },
});

export default HeyMayaHomeScreen;
