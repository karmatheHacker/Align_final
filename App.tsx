import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from './src/context/OnboardingContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { ChatProvider } from './src/context/ChatContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ClerkProviderWrapper } from './src/providers/ClerkProviderWrapper';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from './convex/_generated/api';
import { WelcomeScreen } from './src/auth/WelcomeScreen';
import NameScreen from './src/screens/NameScreen';
import BirthdayScreen from './src/screens/BirthdayScreen';
import GenderScreen from './src/screens/GenderScreen';
import AboutYouScreen from './src/screens/AboutYouScreen';
import HourlyRateScreen from './src/screens/HourlyRateScreen';
import EducationLanguageScreen from './src/screens/EducationLanguageScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import CategoryScreen from './src/screens/CategoryScreen';
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

type OnboardingStep = 'welcome' | 'name' | 'freelancerType' | 'profileBuildOption' | 'category' | 'aboutYou' | 'educationLanguage' | 'personalInfo' | 'hometown' | 'workplace' | 'education' | 'school' | 'religion' | 'politics' | 'children' | 'tobacco' | 'drinking' | 'drugs' | 'distance' | 'photos' | 'bio' | 'prompts' | 'verification' | 'verificationWait' | 'safety' | 'notifications' | 'complete' | 'dashboard';

function InnerApp() {
  const [step, setStep] = React.useState<OnboardingStep>('welcome');

  const currentChapter = CHAPTER_CONFIG.find(chapter =>
    chapter.steps.includes(step)
  );
  const chapterLabel = currentChapter ? currentChapter.label : null;

  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Only query Convex if user is signed in
  const convexUser = useQuery(api.users.getCurrentUser, isSignedIn ? undefined : "skip");
  const createUser = useMutation(api.users.createUserIfNotExists);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
    PlayfairDisplay_700Bold,
  });

  // Effect to automatically route based on sign-in and onboarding status
  React.useEffect(() => {
    if (isLoaded && isSignedIn && convexUser !== undefined) {
      const handleRouting = async () => {
        // If we are on welcome screen or just started, determine where to go
        if (step === 'welcome') {
          if (convexUser === null && user) {
            // New user signing up, create user in Convex
            await createUser({
              clerkId: user.id,
              name: user.fullName || '',
              email: user.primaryEmailAddress?.emailAddress || '',
              imageUrl: user.imageUrl || '',
            }).catch(err => console.error("Error creating user:", err));
            setStep('name'); // Start onboarding
          } else if (convexUser?.onboardingCompleted) {
            setStep('dashboard');
          } else if (convexUser) {
            setStep('name'); // Continue onboarding if not completed
          }
        }
      };
      handleRouting();
    } else if (isLoaded && !isSignedIn && step !== 'welcome') {
      setStep('welcome'); // route back to sign in
    }
  }, [isLoaded, isSignedIn, convexUser, step, user, createUser]);

  // Show nothing (or a loading view) while determining authentication status and pulling data
  // We ALSO wait if isSignedIn is true but we haven't redirected away from 'welcome' yet
  const isDeterminingRoute = isSignedIn && (convexUser === undefined || step === 'welcome');

  if (!fontsLoaded || !isLoaded || isDeterminingRoute) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="dark" />
      </View>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setStep('name')} />;
      case 'name':
        return (
          <NameScreen
            onBack={() => setStep('welcome')}
            onNext={(role) => {
              if (role === 'buyer') {
                if (user) {
                  completeOnboarding({ clerkId: user.id });
                }
                setStep('dashboard');
              } else {
                setStep('freelancerType');
              }
            }}
          />
        );
      case 'freelancerType':
        return (
          <BirthdayScreen
            onBack={() => setStep('name')}
            onNext={() => setStep('profileBuildOption')}
          />
        );
      case 'profileBuildOption':
        return (
          <GenderScreen
            onBack={() => setStep('freelancerType')}
            onNext={() => setStep('category')}
          />
        );
      case 'category':
        return (
          <CategoryScreen
            onBack={() => setStep('profileBuildOption')}
            onNext={() => setStep('aboutYou')}
          />
        );
      case 'aboutYou':
        return (
          <AboutYouScreen
            onBack={() => setStep('category')}
            onNext={() => setStep('educationLanguage')}
          />
        );
      case 'educationLanguage':
        return (
          <EducationLanguageScreen
            onBack={() => setStep('aboutYou')}
            onNext={() => setStep('personalInfo')}
          />
        );
      case 'personalInfo':
        return (
          <PersonalInfoScreen
            onBack={() => setStep('educationLanguage')}
            onNext={() => setStep('hometown')}
          />
        );
      case 'hometown':
        return (
          <HometownScreen
            onBack={() => setStep('personalInfo')}
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
            onBack={() => setStep('verification')}
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
    <NavigationContainer>
      <ProfileProvider>
        <NotificationProvider>
          <ChatProvider>
            <OnboardingProvider>
              <SafeAreaProvider>
                <View style={styles.container}>
                  <StatusBar style="dark" />
                  {renderStep()}
                  <ChapterTransition chapterLabel={chapterLabel} />
                </View>
              </SafeAreaProvider>
            </OnboardingProvider>
          </ChatProvider>
        </NotificationProvider>
      </ProfileProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ClerkProviderWrapper>
      <InnerApp />
    </ClerkProviderWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
