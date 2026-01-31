# Quizifications

Mobile quiz app that sends push notification quizzes throughout the day from user notes.

## Overview

Quizifications helps students learn by sending periodic quiz notifications based on their study materials. Users add notes, and the app generates multiple-choice questions using AI (Claude), then quizzes them at configurable intervals.

### Key Features
- **Notes to Quizzes**: Add study notes, AI generates quiz questions
- **Push Notifications**: Get quizzed at customizable intervals during study windows
- **Streaks**: Track daily streaks to stay motivated
- **Categories**: Pre-made question banks for common subjects
- **Study Groups** (Premium): Create groups of 1-20 members, share notes, compete on leaderboard

## Project Structure

```
app/
├── App.tsx                 # Root component with navigation
├── src/
│   ├── constants/theme.ts  # Colors, spacing, typography
│   ├── contexts/
│   │   └── AuthContext.tsx # Auth state, user management, account deletion
│   ├── hooks/
│   │   └── useQuiz.ts      # Quiz logic and stats
│   ├── lib/
│   │   ├── config.ts       # App configuration
│   │   ├── notifications.ts # Push notification handling
│   │   └── supabase.ts     # Database client
│   ├── screens/
│   │   ├── AuthScreen.tsx
│   │   ├── CategoriesScreen.tsx
│   │   ├── GroupDetailScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── NotesScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── types/index.ts      # TypeScript types
├── supabase/
│   └── schema.sql          # Database schema
├── app.json                # Expo config
├── eas.json                # EAS Build config
└── package.json
```

## Architecture

- **Frontend**: React Native + Expo SDK 52
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **AI**: Claude API for question generation
- **Notifications**: expo-notifications

## Key Design Decisions

### January 2026

1. **Groups are Premium-Only**: Study groups require premium subscription
2. **20 Member Limit**: Groups capped at 20 members for quality
3. **No Global Leaderboard**: Only within-group leaderboards
4. **No Social Features**: Removed friends, referrals for simplified scope
5. **Account Deletion**: Added per Apple App Store requirements
6. **Expo SDK 52**: Updated for latest features and app store compliance

## Running the App

```bash
cd app
npm install
npx expo start
```

## Environment Variables

Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `CLAUDE_API_KEY` - Claude API key for question generation

## Building for App Stores

```bash
# Development build
npx eas-cli build --profile development --platform all

# Production build
npx eas-cli build --profile production --platform all

# Submit to stores
npx eas-cli submit --platform ios
npx eas-cli submit --platform android
```

## Database

Run `supabase/schema.sql` in your Supabase SQL editor to set up tables:
- users, user_settings, study_windows
- categories, category_questions, user_categories
- notes, note_questions
- quiz_responses
- groups, group_members, group_notes, group_leaderboard

## Premium Features

Premium users unlock:
- **Notes**: Create and share notes, AI generates quiz questions
- **Study Groups**: Create groups (up to 20 members), share notes, compete on within-group leaderboards

Free users can:
- Study from pre-made category question banks
- Track streaks and daily stats
- Customize study windows and quiz frequency
