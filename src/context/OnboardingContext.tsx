import React, { createContext, useContext, useReducer } from 'react';

interface HeightData {
    value: number;
    unit: 'FT' | 'CM';
}

type State = {
    firstName: string;
    birthday: string;
    gender: string;
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
    children: string;
    tobacco: string;
    drinking: string;
    location: string;
    locationCoords: { latitude: number; longitude: number } | null;
    photos: string[];
    bio: string;
    publicBio: string;
    aiBio: string;
    verificationStatus: string;
    notificationsEnabled: boolean;
};

type Action =
    | { type: 'SET_FIELD'; field: keyof State; value: any }
    | { type: 'RESET' };

const initialState: State = {
    firstName: '',
    birthday: '',
    gender: '',
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
    children: '',
    tobacco: '',
    drinking: '',
    location: '',
    locationCoords: null,
    photos: [],
    bio: '',
    publicBio: '',
    aiBio: '',
    verificationStatus: 'unverified',
    notificationsEnabled: false,
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
