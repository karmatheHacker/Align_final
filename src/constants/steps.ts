export const STEP_ORDER = [
    'welcome', 'name', 'freelancerType', 'profileBuildOption', 'category', 'aboutYou', 'educationLanguage', 'personalInfo', // Chapter 1: About You
    'hometown', 'education', 'school', 'workplace', 'religion', 'politics', 'children', 'tobacco', 'drinking', 'drugs', 'distance', // Chapter 2: Your Life
    'photos', 'bio', 'prompts', 'verification', 'verificationWait', 'safety', 'notifications' // Chapter 3: Your Photos
];

export const STEP_ICONS = {
    // Chapter 1 — About You
    name: { lib: 'Feather', name: 'user' },
    freelancerType: { lib: 'Feather', name: 'briefcase' },
    profileBuildOption: { lib: 'Feather', name: 'file-text' },
    category: { lib: 'Feather', name: 'list' },
    aboutYou: { lib: 'Feather', name: 'edit-3' },
    hourlyRate: { lib: 'Feather', name: 'dollar-sign' },
    educationLanguage: { lib: 'Feather', name: 'book-open' },
    personalInfo: { lib: 'Feather', name: 'user' },

    // Chapter 2 — Your Life
    hometown: { lib: 'Feather', name: 'map-pin' },
    workplace: { lib: 'Feather', name: 'briefcase' },
    education: { lib: 'Feather', name: 'book-open' },
    school: { lib: 'Feather', name: 'award' },
    religion: { lib: 'Feather', name: 'sun' },
    politics: { lib: 'Feather', name: 'megaphone' },
    children: { lib: 'Feather', name: 'users' },
    tobacco: { lib: 'MaterialIcons', name: 'smoke-free' },
    drinking: { lib: 'MaterialIcons', name: 'local-bar' },

    // Chapter 3 — Your Media
    photos: { lib: 'Feather', name: 'camera' },
    bio: { lib: 'Feather', name: 'edit-3' },
    verification: { lib: 'MaterialIcons', name: 'verified-user' },

    // Final Steps
    notifications: { lib: 'Feather', name: 'bell' },
};

export const STEP_CONFIG = [
    { id: 'welcome', icon: 'zap', library: 'Feather', required: true },
    { id: 'name', icon: 'user', library: 'Feather', required: true },
    { id: 'freelancerType', icon: 'briefcase', library: 'Feather', required: true },
    { id: 'profileBuildOption', icon: 'file-text', library: 'Feather', required: true },
    { id: 'category', icon: 'list', library: 'Feather', required: true },
    { id: 'aboutYou', icon: 'edit-3', library: 'Feather', required: true },
    { id: 'hourlyRate', icon: 'dollar-sign', library: 'Feather', required: true },
    { id: 'educationLanguage', icon: 'book-open', library: 'Feather', required: true },
    { id: 'personalInfo', icon: 'user', library: 'Feather', required: true },
    { id: 'hometown', icon: 'map-pin', library: 'Feather', required: false },
    { id: 'workplace', icon: 'briefcase', library: 'Feather', required: false },
    { id: 'education', icon: 'book-open', library: 'Feather', required: false },
    { id: 'school', icon: 'award', library: 'Feather', required: false },
    { id: 'religion', icon: 'sun', library: 'Feather', required: false },
    { id: 'politics', icon: 'megaphone', library: 'Feather', required: false },
    { id: 'children', icon: 'users', library: 'Feather', required: false },
    { id: 'tobacco', icon: 'smoke-free', library: 'MaterialIcons', required: false },
    { id: 'drinking', icon: 'local-bar', library: 'MaterialIcons', required: false },
    { id: 'drugs', icon: 'medical-services', library: 'MaterialIcons', required: false },
    { id: 'distance', icon: 'map', library: 'MaterialIcons', required: false },
    { id: 'photos', icon: 'camera', library: 'Feather', required: true },
    { id: 'bio', icon: 'edit-3', library: 'Feather', required: false },
    { id: 'prompts', icon: 'chat-bubble-outline', library: 'MaterialIcons', required: false },
    { id: 'verification', icon: 'verified-user', library: 'MaterialIcons', required: true },
    { id: 'verificationWait', icon: 'sync', library: 'MaterialIcons', required: true },
    { id: 'safety', icon: 'security', library: 'MaterialIcons', required: true },
    { id: 'notifications', icon: 'bell', library: 'Feather', required: true },
];

export const CHAPTER_CONFIG = [
    { id: 'about', label: 'Chapter 1: About You', steps: ['welcome', 'name', 'freelancerType', 'profileBuildOption', 'category', 'aboutYou', 'educationLanguage', 'personalInfo'] },
    { id: 'life', label: 'Chapter 2: Your Life', steps: ['hometown', 'education', 'school', 'workplace', 'religion', 'politics', 'children', 'tobacco', 'drinking', 'drugs', 'distance'] },
    { id: 'photos', label: 'Chapter 3: Your Photos', steps: ['photos', 'bio', 'prompts', 'verification', 'verificationWait', 'safety', 'notifications'] },
];

export default { STEP_ORDER, STEP_ICONS, STEP_CONFIG, CHAPTER_CONFIG };
