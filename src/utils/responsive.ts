/**
 * Shared responsive scaling utilities.
 *
 * Base design reference: 393 × 852 (iPhone 14 / Pixel 7)
 *
 * Every post-onboarding screen imports from here so the
 * spacing rhythm and font scale are identical app-wide.
 */
import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** Width-proportional scale (padding, icon sizes, horizontal gaps). */
export const w = (v: number): number => Math.round((SCREEN_W / 393) * v);

/** Height-proportional scale (vertical spacing, bar heights). */
export const h = (v: number): number => Math.round((SCREEN_H / 852) * v);

/** Font scale – blended width + height, clamped 70 %–115 % of design value. */
export const f = (v: number): number => {
    const base = ((SCREEN_W / 393) * 0.5 + (SCREEN_H / 852) * 0.5) * v;
    return Math.round(Math.max(v * 0.7, Math.min(base, v * 1.15)));
};

/** 8-pt spacing rhythm, height-scaled. */
export const SP = {
    xs: h(4),
    sm: h(8),
    md: h(12),
    lg: h(16),
    xl: h(20),
    xxl: h(24),
    xxxl: h(32),
} as const;

/** Canonical horizontal page padding. */
export const H_PAD = w(22);

export { SCREEN_W, SCREEN_H };
