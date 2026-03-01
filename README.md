# Align

Align is a React Native dating app built with Expo, Supabase, and Clerk.

## Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn
- Expo CLI
- Expo Go app on your physical device (iOS/Android), or an emulator/simulator.

## Environment Variables

You must create a `.env` file in the root directory and add the following keys:

```env
# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You will also need to create a `/server/.env` file for the verification server backend to run properly.

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3000
```

## Running the App

### 1. Start the backend verification server
This server is needed for some features (like verification). Open a terminal, navigate to the `server` directory, install dependencies, and start it:

```bash
cd server
npm install
npm start
```

### 2. Start the Expo App
In a separate terminal, navigate to the root directory, install dependencies, and start the Expo development server:

```bash
npm install
npx expo start
```

- Press `a` to run on an Android emulator.
- Press `i` to run on an iOS simulator.
- Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android) to run it on a physical device.

## Note on Supabase Edge Functions
The app also uses Supabase Edge Functions (located in the `supabase/functions/` folder) for advanced matchmaking logic and personality vectors. You will need the Supabase CLI installed to deploy these if you have your own Supabase instance.
