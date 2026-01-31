# Quizifications

A mobile study app that sends push notification quizzes throughout the day from your notes.

## Quick Start

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor
3. Copy and paste everything from `app/supabase/schema.sql` and run it
4. Go to Settings → API and copy your:
   - Project URL
   - anon public key

### 2. Setup App

```bash
cd app

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your keys:
# EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyxxxxx
# CLAUDE_API_KEY=sk-ant-xxxxx  (for note question generation)

# Start the app
npx expo start
```

### 3. Run on Device

- Install "Expo Go" on your phone
- Scan the QR code
- Or press `i` for iOS simulator / `a` for Android emulator

## Features

### Free Tier
- Pre-built category questions (SAT, Bio, History, Spanish, etc.)
- Study window scheduling
- Streak tracking
- Configurable quiz frequency

### Premium Tier
- Upload your own notes
- AI generates questions from your notes
- Study groups (up to 20 members)
- Within-group leaderboards
- Share notes with group members

## File Structure

```
app/
├── App.tsx                    # Main entry point
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth state management
│   ├── hooks/
│   │   └── useQuiz.ts         # Quiz logic
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── config.ts          # App configuration
│   │   └── notifications.ts   # Push notification handling
│   ├── screens/
│   │   ├── AuthScreen.tsx     # Login/signup
│   │   ├── HomeScreen.tsx     # Dashboard
│   │   ├── QuizScreen.tsx     # Answer questions
│   │   ├── CategoriesScreen.tsx
│   │   ├── NotesScreen.tsx    # Premium feature
│   │   ├── SettingsScreen.tsx # Account settings & deletion
│   │   ├── GroupsScreen.tsx   # Premium feature
│   │   └── GroupDetailScreen.tsx
│   ├── constants/
│   │   └── theme.ts           # Colors, spacing
│   └── types/
│       └── index.ts           # TypeScript types
├── supabase/
│   └── schema.sql             # Database schema
├── app.json                   # Expo config
└── eas.json                   # EAS Build config
```

## Next Steps

1. **Add more questions** - Populate `category_questions` table with content
2. **Add RevenueCat** - For subscription payments
3. **App Store assets** - Screenshots, descriptions, icons

## Testing Notifications

Notifications only work on physical devices, not simulators.

To test:
1. Run on real device via Expo Go
2. Set a short quiz interval (e.g., 15 minutes) in settings
3. Background the app
4. Wait for notification

## Deploy

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Requirements

- Expo SDK 52
- React Native 0.76
- Supabase for backend
- Claude API for question generation (premium)

## Support

Built for students who want to study smarter, not harder.
