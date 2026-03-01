import { containsSlurOrHateSpeech } from './profanityFilter';

const SPAM_WORDS = ['test', 'testing', 'asdf', 'abc', 'xyz', 'qwerty', 'none', 'idk', 'na'];

export const sanitizeInput = (value: string): string => {
    return value.trim().replace(/\s+/g, ' ');
};

const isOnlyRepeatedChars = (value: string): boolean => {
    if (value.length < 2) return false;
    return /^(.)\1+$/.test(value);
};

export const containsSpam = (value: string): boolean => {
    const lowerVal = value.toLowerCase();
    return SPAM_WORDS.includes(lowerVal);
};

const containsLinksOrContactInfo = (value: string): boolean => {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\/?)/i;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    const phoneRegex = /(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

    return urlRegex.test(value) || emailRegex.test(value) || phoneRegex.test(value);
};

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateName = (value: string): ValidationResult => {
    const sanitized = sanitizeInput(value);
    if (!sanitized) return { isValid: false, error: 'Name is required' };
    if (sanitized.length < 2) return { isValid: false, error: 'Name must be at least 2 characters' };
    if (sanitized.length > 50) return { isValid: false, error: 'Name cannot exceed 50 characters' };
    if (isOnlyRepeatedChars(sanitized)) return { isValid: false, error: 'Please enter a valid name' };
    if (containsSpam(sanitized)) return { isValid: false, error: 'Please enter a valid name' };
    if (containsSlurOrHateSpeech(sanitized)) return { isValid: false, error: 'Respectful language is required.' };

    // Letters, spaces, hyphens, periods, apostrophes only
    if (!/^[a-zA-Z \.\'\-]+$/.test(sanitized)) {
        return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, periods, and apostrophes' };
    }

    return { isValid: true };
};

export const validateTextField = (value: string, maxLength: number = 100, isOptional: boolean = false): ValidationResult => {
    if (!value && isOptional) return { isValid: true };

    const sanitized = sanitizeInput(value);
    if (!sanitized) {
        return isOptional ? { isValid: true } : { isValid: false, error: 'This field is required' };
    }

    if (sanitized.length < 2) return { isValid: false, error: 'Must be at least 2 characters' };
    if (sanitized.length > maxLength) return { isValid: false, error: `Cannot exceed ${maxLength} characters` };
    if (isOnlyRepeatedChars(sanitized)) return { isValid: false, error: 'Please enter meaningful text' };
    if (containsSpam(sanitized)) return { isValid: false, error: 'Please enter meaningful text' };
    if (containsSlurOrHateSpeech(sanitized)) return { isValid: false, error: 'Respectful language is required.' };

    // Letters, numbers, spaces, periods, hyphens, apostrophes only
    if (!/^[a-zA-Z0-9 \.\'\-]+$/.test(sanitized)) {
        return { isValid: false, error: 'Input contains invalid characters' };
    }

    return { isValid: true };
};

export const validateBio = (value: string, maxLength: number = 500, isOptional: boolean = false): ValidationResult => {
    if (!value && isOptional) return { isValid: true };

    const sanitized = sanitizeInput(value);
    if (!sanitized) {
        return isOptional ? { isValid: true } : { isValid: false, error: 'This field is required' };
    }

    if (sanitized.length > maxLength) return { isValid: false, error: `Cannot exceed ${maxLength} characters` };
    if (isOnlyRepeatedChars(sanitized)) return { isValid: false, error: 'Please enter meaningful text' };
    if (containsSpam(sanitized)) return { isValid: false, error: 'Please enter meaningful text' };
    if (containsSlurOrHateSpeech(sanitized)) return { isValid: false, error: 'Respectful language is required.' };
    if (containsLinksOrContactInfo(sanitized)) return { isValid: false, error: 'Cannot contain URLs, emails, or phone numbers' };

    return { isValid: true };
};

export const validatePrompts = validateBio; // Prompts use the same validation rules
