export const STEP_ORDER = [
    'welcome', 'name', 'birthday', 'gender', 'sexuality', 'relationshipType', 'datingIntention', // Chapter 1: About You
    'height', 'hometown', 'education', 'school', 'workplace', 'religion', 'children', 'tobacco', 'drinking', // Chapter 2: Your Life
    'photos', 'bio', 'verification', 'notifications' // Chapter 3: Your Photos
];

export const STEP_ICONS = {
    // Chapter 1 — About You
    name: { lib: 'Feather', name: 'user' },
    birthday: { lib: 'Feather', name: 'calendar' },
    gender: { lib: 'MaterialIcons', name: 'wc' },
    sexuality: { lib: 'Feather', name: 'heart' },
    relationshipType: { lib: 'Feather', name: 'link' },
    datingIntention: { lib: 'MaterialIcons', name: 'flag' },

    // Chapter 2 — Your Life
    height: { lib: 'MaterialIcons', name: 'height' },
    hometown: { lib: 'Feather', name: 'map-pin' },
    workplace: { lib: 'Feather', name: 'briefcase' },
    education: { lib: 'Feather', name: 'book-open' },
    school: { lib: 'Feather', name: 'award' },
    religion: { lib: 'Feather', name: 'sun' },
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
    { id: 'name', icon: 'user', library: 'Feather' },
    { id: 'birthday', icon: 'calendar', library: 'Feather' },
    { id: 'gender', icon: 'wc', library: 'MaterialIcons' },
    { id: 'sexuality', icon: 'heart', library: 'Feather' },
    { id: 'relationshipType', icon: 'link', library: 'Feather' },
    { id: 'datingIntention', icon: 'flag', library: 'MaterialIcons' },
    { id: 'height', icon: 'height', library: 'MaterialIcons' },
    { id: 'hometown', icon: 'map-pin', library: 'Feather' },
    { id: 'workplace', icon: 'briefcase', library: 'Feather' },
    { id: 'education', icon: 'book-open', library: 'Feather' },
    { id: 'school', icon: 'award', library: 'Feather' },
    { id: 'religion', icon: 'sun', library: 'Feather' },
    { id: 'children', icon: 'users', library: 'Feather' },
    { id: 'tobacco', icon: 'smoke-free', library: 'MaterialIcons' },
    { id: 'drinking', icon: 'local-bar', library: 'MaterialIcons' },
    { id: 'photos', icon: 'camera', library: 'Feather' },
    { id: 'bio', icon: 'edit-3', library: 'Feather' },
    { id: 'verification', icon: 'verified-user', library: 'MaterialIcons' },
    { id: 'notifications', icon: 'bell', library: 'Feather' },
];

export const CHAPTER_CONFIG = [
    { id: 'about', label: 'Chapter 1: About You', steps: ['welcome', 'name', 'birthday', 'gender', 'sexuality', 'relationshipType', 'datingIntention'] },
    { id: 'life', label: 'Chapter 2: Your Life', steps: ['height', 'hometown', 'education', 'school', 'workplace', 'religion', 'children', 'tobacco', 'drinking'] },
    { id: 'photos', label: 'Chapter 3: Your Photos', steps: ['photos', 'bio', 'verification', 'notifications'] },
];

export default { STEP_ORDER, STEP_ICONS, STEP_CONFIG, CHAPTER_CONFIG };
