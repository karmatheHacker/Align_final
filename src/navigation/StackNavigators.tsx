import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import AlignAIScreen from '../screens/AlignAIScreen';
import LikesScreen from '../screens/LikesScreen';
import ChatListScreen from '../screens/ChatListScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditFieldScreen from '../screens/EditFieldScreen';
import EditPromptScreen from '../screens/EditPromptScreen';
import MatchmakerScreen from '../screens/MatchmakerScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ActiveChatScreen from '../screens/ActiveChatScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import HelpScreen from '../screens/HelpScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import ProfileDetailScreen from '../screens/ProfileDetailScreen';
import ReportScreen from '../screens/ReportScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';

// ---------------------------------------------------------------------------
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';

const PlaceholderScreen = ({ title }: { title: string }) => (
    <View style={placeholder.root}>
        <Text style={placeholder.text}>{title}</Text>
    </View>
);
const placeholder = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
    text: { fontFamily: 'Inter_700Bold', fontSize: 18, color: COLORS.text, letterSpacing: 1, textTransform: 'uppercase' },
});

// ---------------------------------------------------------------------------
// Individual Stack Navigators (one per tab)
// ---------------------------------------------------------------------------

const HomeStack = createStackNavigator();
const MatchmakerStack = createStackNavigator();
const LikesStack = createStackNavigator();
const ChatStack = createStackNavigator();
const ProfileStack = createStackNavigator();

export const HomeNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="Home" component={HomeScreen} />
        <HomeStack.Screen
            name="AlignAI"
            component={AlignAIScreen}
            options={{
                cardStyleInterpolator: ({ current, next, layouts }) => ({
                    cardStyle: {
                        opacity: current.progress,
                        transform: [{
                            translateY: current.progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [layouts.screen.height * 0.06, 0],
                            }),
                        }],
                    },
                }),
                gestureEnabled: true,
                gestureDirection: 'vertical',
            }}
        />
        <HomeStack.Screen name="AIAssistant" component={AIAssistantScreen} />
        <HomeStack.Screen
            name="ProfileDetail"
            component={ProfileDetailScreen}
            options={{
                presentation: 'transparentModal',
                cardOverlayEnabled: true,
                cardStyle: { backgroundColor: 'transparent' },
                gestureEnabled: true,
            }}
        />
        <HomeStack.Screen name="Report" component={ReportScreen} />
        <HomeStack.Screen name="Preferences" component={PreferencesScreen} />
        <HomeStack.Screen name="Subscription" component={SubscriptionScreen} options={{ presentation: 'modal' }} />
    </HomeStack.Navigator>
);

export const MatchmakerNavigator = () => (
    <MatchmakerStack.Navigator screenOptions={{ headerShown: false }}>
        <MatchmakerStack.Screen name="Matchmaker" component={MatchmakerScreen} />
        <MatchmakerStack.Screen
            name="AlignAI"
            component={AlignAIScreen}
            options={{
                cardStyleInterpolator: ({ current, next, layouts }) => ({
                    cardStyle: {
                        opacity: current.progress,
                        transform: [{
                            translateY: current.progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [layouts.screen.height * 0.06, 0],
                            }),
                        }],
                    },
                }),
                gestureEnabled: true,
                gestureDirection: 'vertical',
            }}
        />
        <MatchmakerStack.Screen
            name="ProfileDetail"
            component={ProfileDetailScreen}
            options={{
                presentation: 'transparentModal',
                cardOverlayEnabled: true,
                cardStyle: { backgroundColor: 'transparent' },
                gestureEnabled: true,
            }}
        />
        <MatchmakerStack.Screen name="Report" component={ReportScreen} />
        <MatchmakerStack.Screen name="Preferences" component={PreferencesScreen} />
        <MatchmakerStack.Screen name="Subscription" component={SubscriptionScreen} options={{ presentation: 'modal' }} />
    </MatchmakerStack.Navigator>
);

export const LikesNavigator = () => (
    <LikesStack.Navigator screenOptions={{ headerShown: false }}>
        <LikesStack.Screen name="Likes" component={LikesScreen} />
    </LikesStack.Navigator>
);

export const ChatNavigator = () => (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
        <ChatStack.Screen name="Chat" component={ChatListScreen} />
        <ChatStack.Screen
            name="ActiveChat"
            component={ActiveChatScreen}
            options={{
                presentation: 'transparentModal',
                cardOverlayEnabled: true,
                cardStyle: { backgroundColor: 'transparent' },
                gestureEnabled: true,
                gestureDirection: 'horizontal'
            }}
        />
    </ChatStack.Navigator>
);

export const ProfileNavigator = () => (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
        <ProfileStack.Screen name="Profile" component={MyProfileScreen} />
        <ProfileStack.Screen name="Settings" component={SettingsScreen} />
        <ProfileStack.Screen name="About" component={AboutScreen} />
        <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
        <ProfileStack.Screen name="EditField" component={EditFieldScreen} />
        <ProfileStack.Screen name="EditPrompt" component={EditPromptScreen} />
        <ProfileStack.Screen name="Help" component={HelpScreen} />
        <ProfileStack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <ProfileStack.Screen name="Subscription" component={SubscriptionScreen} options={{ presentation: 'modal' }} />
    </ProfileStack.Navigator>
);
