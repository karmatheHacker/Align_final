import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from './src/context/OnboardingContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import NameScreen from './src/screens/NameScreen';
import BirthdayScreen from './src/screens/BirthdayScreen';
import GenderScreen from './src/screens/GenderScreen';
import SexualityScreen from './src/screens/SexualityScreen';
import RelationshipTypeScreen from './src/screens/RelationshipTypeScreen';
import DatingIntentionScreen from './src/screens/DatingIntentionScreen';
import HeightScreen from './src/screens/HeightScreen';
import HometownScreen from './src/screens/HometownScreen';
import WorkplaceScreen from './src/screens/WorkplaceScreen';
import EducationScreen from './src/screens/EducationScreen';
import SchoolScreen from './src/screens/SchoolScreen';
import ReligionScreen from './src/screens/ReligionScreen';
import ChildrenScreen from './src/screens/ChildrenScreen';
import TobaccoScreen from './src/screens/TobaccoScreen';
import DrinkingScreen from './src/screens/DrinkingScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import BioScreen from './src/screens/BioScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import ChapterTransition from './src/components/ChapterTransition';
import { CHAPTER_CONFIG } from './src/constants/steps';
import { theme } from './src/theme';

type OnboardingStep = 'welcome' | 'name' | 'birthday' | 'gender' | 'sexuality' | 'relationshipType' | 'datingIntention' | 'height' | 'hometown' | 'workplace' | 'education' | 'school' | 'religion' | 'children' | 'tobacco' | 'drinking' | 'photos' | 'bio' | 'verification' | 'notifications' | 'complete';

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
            onNext={() => setStep('sexuality')}
          />
        );
      case 'sexuality':
        return (
          <SexualityScreen
            onBack={() => setStep('gender')}
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
            onNext={() => setStep('verification')}
          />
        );
      case 'verification':
        return (
          <VerificationScreen
            onBack={() => setStep('bio')}
            onNext={() => setStep('notifications')}
          />
        );
      case 'notifications':
        return (
          <WelcomeScreen onNext={() => setStep('complete')} /> // Placeholder for now
        );
      default:
        return <WelcomeScreen onNext={() => setStep('name')} />;
    }
  };

  return (
    <OnboardingProvider>
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          {renderStep()}
          <ChapterTransition chapterLabel={chapterLabel} />
        </View>
      </SafeAreaProvider>
    </OnboardingProvider>
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
