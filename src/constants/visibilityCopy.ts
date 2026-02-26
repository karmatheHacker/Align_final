export const VISIBILITY_COPY: Record<string, any> = {
    gender: {
        icon: 'user',
        visible: {
            headline: 'Gender Visibility',
            body: 'Your gender is shown on your profile to help others find you based on their preferences.',
        },
        hidden: {
            headline: 'Gender Hidden',
            body: 'Your gender is currently hidden. It will still be used for matching logic.',
        },
    },
    birthday: {
        icon: 'calendar',
        visible: {
            headline: 'Age Visibility',
            body: 'We show your age (not your specific birthday) on your profile.',
        },
    },
    location: {
        icon: 'map-pin',
        visible: {
            headline: 'Location Visibility',
            body: 'We use your location to show you people nearby.',
        },
    },
};
