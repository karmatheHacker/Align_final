import { allBannedWords } from '../constants/bannedWords';

/**
 * Checks if the provided text contains any banned words, slurs, or hate speech.
 * Safely handles Unicode normalization, spacing tricks, and casing across multi-languages.
 * 
 * @param text The input text from the user
 * @returns true if banned language is detected, false otherwise
 */
export const containsSlurOrHateSpeech = (text: string): boolean => {
    if (!text) return false;

    // Normalize input to prevent bypass tactics:
    // 1. NFKC normalization standardizes Unicode equivalents (e.g. Ｈｉｎｄｉ -> Hindi)
    // 2. Lowercase makes it case-insensitive
    // 3. Removing all spaces catches "s h i t" and "b i t c h"
    const spacelessText = text.normalize("NFKC").toLowerCase().replace(/\s+/g, '');

    for (const banned of allBannedWords) {
        // Normalize the banned word exactly the same way
        const normalizedBanned = banned.normalize("NFKC").toLowerCase().replace(/\s+/g, '');

        if (spacelessText.includes(normalizedBanned)) {
            return true;
        }
    }

    return false;
};
