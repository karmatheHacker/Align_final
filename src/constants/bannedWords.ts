/**
 * A centralized, multilingual list of banned words, slurs, and abusive language.
 * This structure supports easy expansion to maintain a safe community environment globally.
 */
export const bannedWords = {
    english: [
        "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy",
        "whore", "slut", "fag", "faggot", "nigger", "nigga", "retard",
        "kys", "killyourself", "dyke", "tranny", "spic", "chink",
        "gook", "wetback", "kike"
    ],
    hindi: [
        "मादरचोद", "बहेनचोद", "चूतिया", "भोसड़ीके", "रांड", "गंडू",
        "छिनाल", "हरामी", "कुतिया", "टट्टी", "झाँटू", "लौड़ा"
    ],
    hinglish: [
        "madarchod", "bhenchod", "bhindchod", "chutiya", "bhosadike",
        "bhosdi", "raand", "gandu", "chinal", "harami", "kutiya",
        "tatti", "jhantu", "lauda", "loda", "gaand", "gand"
    ],
    global: [
        // Spanish
        "puta", "pendejo", "maricon", "mierda",
        // Add other global language slurs here
    ]
};

// Flatten to a single array for fast checking
export const allBannedWords = Object.values(bannedWords).flat();
