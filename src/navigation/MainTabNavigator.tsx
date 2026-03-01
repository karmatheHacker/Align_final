import React from 'react';
import { View, Animated, Easing, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Home, Triangle, Heart, MessageSquare, User } from 'lucide-react-native';
import COLORS from '../constants/colors';
import { useProfile } from '../context/ProfileContext';
import { w, h } from '../utils/responsive';
import {
    HomeNavigator,
    MatchmakerNavigator,
    LikesNavigator,
    ChatNavigator,
    ProfileNavigator,
} from './StackNavigators';

const Tab = createBottomTabNavigator();

const ICON_COLOR = COLORS.black;
const ICON_SIZE = w(22);
const ICON_WEIGHT = 1.5;

// ---------------------------------------------------------------------------
// Animated icon wrapper — opacity + scale + orange active dot
// ---------------------------------------------------------------------------
interface TabIconProps {
    focused: boolean;
    children: React.ReactNode;
}

const TabIconWrapper = ({ focused, children }: TabIconProps) => {
    const opacityAnim = React.useRef(new Animated.Value(focused ? 1 : 0.35)).current;
    const scaleAnim = React.useRef(new Animated.Value(focused ? 1 : 0.85)).current;
    const dotScale = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: focused ? 1 : 0.35,
                duration: 320,
                easing: Easing.bezier(0.22, 1, 0.36, 1),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: focused ? 1 : 0.85,
                friction: 7,
                tension: 140,
                useNativeDriver: true,
            }),
            Animated.spring(dotScale, {
                toValue: focused ? 1 : 0,
                friction: 6,
                tension: 180,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused]);

    return (
        // FIX: fixed 44×44 hit target; no padding that inflates unevenly across tabs
        <View style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
                {children}
            </Animated.View>
            {/* Active dot — sits 6px below the icon, centred on x-axis */}
            <Animated.View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: COLORS.primary,
                    transform: [{ scale: dotScale }],
                }}
            />
        </View>
    );
};

// ---------------------------------------------------------------------------
// Per-tab slide/fade transition wrapper
// ---------------------------------------------------------------------------
const TabTransitionWrapper = ({ children }: { children: React.ReactNode }) => {
    const isFocused = useIsFocused();
    const animValue = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(animValue, {
            toValue: isFocused ? 1 : 0,
            duration: 560,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
        }).start();
    }, [isFocused]);

    const translateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

    return (
        <Animated.View style={{ flex: 1, opacity: animValue, transform: [{ translateY }] }}>
            {children}
        </Animated.View>
    );
};

// Wrapped tab screens
const WrappedHome = () => <TabTransitionWrapper><HomeNavigator /></TabTransitionWrapper>;
const WrappedMatchmaker = () => <TabTransitionWrapper><MatchmakerNavigator /></TabTransitionWrapper>;
const WrappedLikes = () => <TabTransitionWrapper><LikesNavigator /></TabTransitionWrapper>;
const WrappedChat = () => <TabTransitionWrapper><ChatNavigator /></TabTransitionWrapper>;
const WrappedProfile = () => <TabTransitionWrapper><ProfileNavigator /></TabTransitionWrapper>;

// ---------------------------------------------------------------------------
// Profile tab icon — shows user photo or fallback icon
// ---------------------------------------------------------------------------
const ProfileTabIcon = ({ focused }: { focused: boolean }) => {
    const { profile } = useProfile();
    const photoUrl = profile?.photo_urls?.[0];

    return (
        <TabIconWrapper focused={focused}>
            {photoUrl ? (
                <Image
                    source={{ uri: photoUrl }}
                    style={{
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                        borderRadius: ICON_SIZE / 2,
                    }}
                />
            ) : (
                <User size={ICON_SIZE} color={ICON_COLOR} strokeWidth={ICON_WEIGHT} />
            )}
        </TabIconWrapper>
    );
};

// ---------------------------------------------------------------------------
// Main Tab Navigator
// ---------------------------------------------------------------------------
export default function MainTabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            detachInactiveScreens={false}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: COLORS.surface,
                    borderTopWidth: 0,
                    height: h(54) + Math.max(insets.bottom, h(14)),
                    paddingTop: h(6),
                    paddingBottom: Math.max(insets.bottom, h(14)),
                    paddingHorizontal: w(8),
                    elevation: 0,
                    shadowOpacity: 0,
                },
            }}
        >
            <Tab.Screen
                name="TabHome"
                component={WrappedHome}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIconWrapper focused={focused}>
                            <Home size={ICON_SIZE} color={ICON_COLOR} strokeWidth={ICON_WEIGHT} />
                        </TabIconWrapper>
                    ),
                }}
            />
            <Tab.Screen
                name="TabMatchmaker"
                component={WrappedMatchmaker}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIconWrapper focused={focused}>
                            <Triangle size={ICON_SIZE} color={ICON_COLOR} strokeWidth={ICON_WEIGHT} />
                        </TabIconWrapper>
                    ),
                }}
            />
            <Tab.Screen
                name="TabLikes"
                component={WrappedLikes}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIconWrapper focused={focused}>
                            <Heart size={ICON_SIZE} color={ICON_COLOR} strokeWidth={ICON_WEIGHT} />
                        </TabIconWrapper>
                    ),
                }}
            />
            <Tab.Screen
                name="TabChat"
                component={WrappedChat}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIconWrapper focused={focused}>
                            <MessageSquare size={ICON_SIZE} color={ICON_COLOR} strokeWidth={ICON_WEIGHT} />
                        </TabIconWrapper>
                    ),
                }}
            />
            <Tab.Screen
                name="TabProfile"
                component={WrappedProfile}
                options={{
                    tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
}
