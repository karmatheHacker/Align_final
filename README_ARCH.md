# Align Pro - React Native Framework

Welcome to your new React Native project! This project is pre-configured with a premium design system, animations, and essential libraries to help you build state-of-the-art mobile applications.

## 🚀 Features

- **Expo SDK 55**: Modern, fast, and stable development environment.
- **Premium Design System**: Pre-defined theme with slate/navy colors, gradients, and proper spacing.
- **Animations**: Powered by `moti` and `react-native-reanimated` for smooth 60fps transitions.
- **Typography**: Integrated Google Fonts (Outfit & Inter) for a professional look.
- **Icons**: Comprehensive icon set via `lucide-react-native`.
- **Glassmorphism**: Built-in components for modern blur/translucent effects.

## 📂 Project Structure

```text
Align_Final/
├── src/
│   ├── components/    # Reusable UI components (Button, GlassCard, etc.)
│   ├── theme/         # Design tokens and style constants
│   ├── screens/       # Full screens for the application
│   └── hooks/         # Custom React hooks
├── assets/            # Static assets (images, icons)
├── App.tsx            # Main application entry point
└── package.json       # Dependencies and scripts
```

## 🛠️ Getting Started

### Prerequisites

- Node.js installed
- Expo Go app on your smartphone (for testing)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Open the app:
   - Scan the QR code with your phone (Expo Go)
   - Press `w` for Web
   - Press `a` for Android Emulator
   - Press `i` for iOS Simulator (macOS only)

## 🎨 Theme Usage

You can access the theme anywhere in your project:

```typescript
import { theme } from './src/theme';

// Example:
const styles = StyleSheet.create({
  text: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold
  }
});
```

## ✨ Beautiful Components Included

- **PremiumButton**: Fully customizable gradient button.
- **GlassCard**: Modern translucent card with subtle borders.

---

Built with ❤️ by Antigravity.
