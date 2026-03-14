import React, { createContext, useContext, useReducer } from 'react';

interface HeightData {
    value: number;
    unit: 'FT' | 'CM';
}

export interface Language {
    language: string;
    proficiency: string;
}

export interface Prompt {
    id: number;
    question: string;
    answer: string;
}

type State = {
    name: string;
    role: string;
    freelancerType: string;
    profileBuildOption: string;
    category: string;
    specializations: string[];
    title: string;
    hourlyRate: number;
    languages: Language[];
    birthday: string;
    gender: string;
    pronouns: string[];
    sexuality: string;
    relationshipType: string;
    datingIntention: string;
    height: HeightData | null;
    hometown: string;
    hometownVisible: boolean;
    workplace: string;
    workplaceVisible: boolean;
    education: string;
    educationVisible: boolean;
    school: string;
    schoolVisible: boolean;
    religion: string;
    religionVisible: boolean;
    politics: string;
    politicsVisible: boolean;
    children: string;
    tobacco: string;
    drinking: string;
    drugs: string;
    distancePreference: string;
    location: string;
    locationCoords: { latitude: number; longitude: number } | null;
    photos: string[];
    publicBio: string;
    aiBio: string;
    prompts: Prompt[];
    verificationStatus: string;
    notificationsEnabled: boolean;
    country: string;
    streetAddress: string;
    aptSuite: string;
    linkedIn: string;
    github: string;
};

type Action =
    | { type: 'SET_FIELD'; field: keyof State; value: any }
    | { type: 'RESET' };

const initialState: State = {
    name: '',
    role: '',
    freelancerType: '',
    profileBuildOption: '',
    category: '',
    specializations: [],
    title: '',
    hourlyRate: 0,
    languages: [{ language: 'English', proficiency: 'Fluent' }],
    birthday: '',
    gender: '',
    pronouns: [],
    sexuality: '',
    relationshipType: '',
    datingIntention: '',
    height: null,
    hometown: '',
    hometownVisible: true,
    workplace: '',
    workplaceVisible: true,
    education: '',
    educationVisible: true,
    school: '',
    schoolVisible: true,
    religion: '',
    religionVisible: true,
    politics: '',
    politicsVisible: true,
    children: '',
    tobacco: '',
    drinking: '',
    drugs: '',
    distancePreference: '',
    location: '',
    locationCoords: null,
    photos: [],
    publicBio: '',
    aiBio: '',
    prompts: [
        { id: 1, question: 'Select a prompt...', answer: '' },
        { id: 2, question: 'Select a prompt...', answer: '' },
        { id: 3, question: 'Select a prompt...', answer: '' }
    ],
    verificationStatus: 'unverified',
    notificationsEnabled: false,
    country: 'India',
    streetAddress: '',
    aptSuite: '',
    linkedIn: '',
    github: '',
};

const OnboardingContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | undefined>(undefined);

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    return (
        <OnboardingContext.Provider value={{ state, dispatch }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }
    return context;
};
