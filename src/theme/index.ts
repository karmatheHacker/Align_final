import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';

export const theme = {
    colors: {
        background: COLORS.surface,
        surface: COLORS.white,
        surfaceVariant: COLORS.lightGray,
        primary: COLORS.primary,
        secondary: COLORS.purple,
        accent: COLORS.richPurple,
        text: COLORS.text,
        textSecondary: COLORS.gray,
        gradient: [COLORS.primary, COLORS.purple, COLORS.richPurple],
        darkGradient: [COLORS.surface, COLORS.warmCream],
    },
    spacing: SPACING,
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 20,
        xl: 32,
        full: 9999,
    },
    fonts: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        bold: 'Outfit_700Bold',
    }
};
