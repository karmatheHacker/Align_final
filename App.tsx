import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { ProfileProvider, useProfile } from './src/context/ProfileContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import NameScreen from './src/screens/NameScreen';
import BirthdayScreen from './src/screens/BirthdayScreen';
import GenderScreen from './src/screens/GenderScreen';
import PronounsScreen from './src/screens/PronounsScreen';
import SexualityScreen from './src/screens/SexualityScreen';
import RelationshipTypeScreen from './src/screens/RelationshipTypeScreen';
import DatingIntentionScreen from './src/screens/DatingIntentionScreen';
import HeightScreen from './src/screens/HeightScreen';
import HometownScreen from './src/screens/HometownScreen';
import WorkplaceScreen from './src/screens/WorkplaceScreen';
import EducationScreen from './src/screens/EducationScreen';
import SchoolScreen from './src/screens/SchoolScreen';
import ReligionScreen from './src/screens/ReligionScreen';
import PoliticsScreen from './src/screens/PoliticsScreen';
import ChildrenScreen from './src/screens/ChildrenScreen';
import TobaccoScreen from './src/screens/TobaccoScreen';
import DrinkingScreen from './src/screens/DrinkingScreen';
import DrugsScreen from './src/screens/DrugsScreen';
import DistancePreferenceScreen from './src/screens/DistancePreferenceScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import BioScreen from './src/screens/BioScreen';
import ProfilePromptsScreen from './src/screens/ProfilePromptsScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import VerificationWaitScreen from './src/screens/VerificationWaitScreen';
import SafetyNoticeScreen from './src/screens/SafetyNoticeScreen';
import OnboardingCompleteScreen from './src/screens/OnboardingCompleteScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import ChapterTransition from './src/components/ChapterTransition';
import { CHAPTER_CONFIG, STEP_ORDER } from './src/constants/steps';
import { theme } from './src/theme';
import { ClerkProvider, useAuth, SignedIn, SignedOut } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useSupabaseAuth } from './src/hooks/useSupabaseAuth';

const AuthSynchronizer = () => {
  const { setSupabaseToken } = useSupabaseAuth();
  const { isLoaded, isSignedIn } = useAuth();

  React.useEffect(() => {
    if (isLoaded) {
      setSupabaseToken();
    }
  }, [isLoaded, isSignedIn]);

  return null;
};

const AppOnboardingFlow = ({ step, setStep, renderStep, chapterLabel }: any) => {
  const { userId } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const { loadProfile } = useProfile();

  React.useEffect(() => {
    const checkProfile = async () => {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        const profile = await loadProfile(userId);
        if (profile && profile.onboarding_completed) {
          setStep('dashboard');
        } else if (step === 'welcome') {
          setStep('name');
        }
      } catch (err) {
        console.error('Profile check failed:', err);
        if (step === 'welcome') {
          setStep('name');
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkProfile();
  }, [userId]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      {renderStep()}
      <ChapterTransition chapterLabel={chapterLabel} />
    </>
  );
};

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env');
}

type OnboardingStep = 'welcome' | 'name' | 'birthday' | 'gender' | 'pronouns' | 'sexuality' | 'relationshipType' | 'datingIntention' | 'height' | 'hometown' | 'workplace' | 'education' | 'school' | 'religion' | 'politics' | 'children' | 'tobacco' | 'drinking' | 'drugs' | 'distance' | 'photos' | 'bio' | 'prompts' | 'verification' | 'verificationWait' | 'safety' | 'notifications' | 'complete' | 'dashboard';

export default function App() {
  const [step, setStep] = useState<OnboardingStep>('welcome');

  const currentChapter = CHAPTER_CONFIG.find(chapter =>
    chapter.steps.includes(step)
  );
  const chapterLabel = currentChapter ? currentChapter.label : null;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
    PlayfairDisplay_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />
      </View>
    );
  }

  const handleNextStep = () => {
    const currentIndex = STEP_ORDER.indexOf(step as any);
    if (currentIndex >= 0 && currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1] as OnboardingStep);
    } else {
      setStep('dashboard'); // fallback
    }
  };

  const handlePrevStep = () => {
    const currentIndex = STEP_ORDER.indexOf(step as any);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1] as OnboardingStep);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setStep('name')} />;
      case 'name':
        return (
          <NameScreen
            onBack={() => setStep('welcome')}
            onNext={() => setStep('birthday')}
          />
        );
      case 'birthday':
        return (
          <BirthdayScreen
            onBack={() => setStep('name')}
            onNext={() => setStep('gender')}
          />
        );
      case 'gender':
        return (
          <GenderScreen
            onBack={() => setStep('birthday')}
            onNext={() => setStep('pronouns')}
          />
        );
      case 'pronouns':
        return (
          <PronounsScreen
            onBack={() => setStep('gender')}
            onNext={() => setStep('sexuality')}
          />
        );
      case 'sexuality':
        return (
          <SexualityScreen
            onBack={() => setStep('pronouns')}
            onNext={() => setStep('relationshipType')}
          />
        );
      case 'relationshipType':
        return (
          <RelationshipTypeScreen
            onBack={() => setStep('sexuality')}
            onNext={() => setStep('datingIntention')}
          />
        );
      case 'datingIntention':
        return (
          <DatingIntentionScreen
            onBack={() => setStep('relationshipType')}
            onNext={() => setStep('height')}
          />
        );
      case 'height':
        return (
          <HeightScreen
            onBack={() => setStep('datingIntention')}
            onNext={() => setStep('hometown')}
          />
        );
      case 'hometown':
        return (
          <HometownScreen
            onBack={() => setStep('height')}
            onNext={() => setStep('education')}
          />
        );
      case 'education':
        return (
          <EducationScreen
            onBack={() => setStep('hometown')}
            onNext={() => setStep('school')}
          />
        );
      case 'workplace':
        return (
          <WorkplaceScreen
            onBack={() => setStep('school')}
            onNext={() => setStep('religion')}
          />
        );
      case 'school':
        return (
          <SchoolScreen
            onBack={() => setStep('education')}
            onNext={() => setStep('workplace')}
          />
        );
      case 'religion':
        return (
          <ReligionScreen
            onBack={() => setStep('workplace')}
            onNext={() => setStep('politics')}
          />
        );
      case 'politics':
        return (
          <PoliticsScreen
            onBack={() => setStep('religion')}
            onNext={() => setStep('children')}
          />
        );
      case 'children':
        return (
          <ChildrenScreen
            onBack={() => setStep('religion')}
            onNext={() => setStep('tobacco')}
          />
        );
      case 'tobacco':
        return (
          <TobaccoScreen
            onBack={() => setStep('children')}
            onNext={() => setStep('drinking')}
          />
        );
      case 'drinking':
        return (
          <DrinkingScreen
            onBack={() => setStep('tobacco')}
            onNext={() => setStep('drugs')}
          />
        );
      case 'drugs':
        return (
          <DrugsScreen
            onBack={() => setStep('drinking')}
            onNext={() => setStep('distance')}
          />
        );
      case 'distance':
        return (
          <DistancePreferenceScreen
            onBack={() => setStep('drugs')}
            onNext={() => setStep('photos')}
          />
        );
      case 'photos':
        return (
          <PhotosScreen
            onBack={() => setStep('drinking')}
            onNext={() => setStep('bio')}
          />
        );
      case 'bio':
        return (
          <BioScreen
            onBack={() => setStep('photos')}
            onNext={() => setStep('prompts')}
          />
        );
      case 'prompts':
        return (
          <ProfilePromptsScreen
            onBack={() => setStep('bio')}
            onNext={() => setStep('verification')}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            onBack={() => setStep('prompts')}
            onNext={() => setStep('verificationWait')}
          />
        );
      case 'verificationWait':
        return (
          <VerificationWaitScreen
            onNext={() => setStep('safety')}
          />
        );
      case 'safety':
        return (
          <SafetyNoticeScreen
            onBack={() => setStep('verification')}
            onNext={() => setStep('complete')}
          />
        );
      case 'complete':
        return (
          <OnboardingCompleteScreen
            onNext={() => setStep('dashboard')}
          />
        );
      case 'dashboard':
        return <MainTabNavigator />;
      default:
        return <WelcomeScreen onNext={() => setStep('name')} />;
    }
  };

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <AuthSynchronizer />
      <NavigationContainer>
        <ProfileProvider>
          <NotificationProvider>
            <ChatProvider>
              <OnboardingProvider>
                <SafeAreaProvider>
                  <View style={styles.container}>
                    <StatusBar style="dark" />

                    <SignedIn>
                      <AppOnboardingFlow step={step} setStep={setStep} renderStep={renderStep} chapterLabel={chapterLabel} />
                    </SignedIn>

                    <SignedOut>
                      <WelcomeScreen onNext={() => setStep('name')} />
                    </SignedOut>

                  </View>
                </SafeAreaProvider>
              </OnboardingProvider>
            </ChatProvider>
          </NotificationProvider>
        </ProfileProvider>
      </NavigationContainer>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
