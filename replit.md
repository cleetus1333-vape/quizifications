# Quizifications

## Overview
Quizifications is a React Native/Expo mobile app that sends push notification quizzes from user notes. The app features a 3-day free trial followed by premium subscription ($4.99/month or $39.99/year) for unlimited notes, AI-generated quizzes, and study groups (1-20 members). Trial-based model only—no free tier or ads on mobile.

## Brand Identity
- **Primary Color**: Lime green (#c8ff00)
- **Background**: Black (#0a0a0b) with elevated cards (#141416, #1a1a1e)
- **Logo**: Bold "Q" in lime green
- **Contact**: help@quizifications.com (support), legal@quizifications.com (privacy/terms), info@quizifications.com (general)
- **Website**: quizifications.com

## Project Structure
```
public/                        # Static website (deployed)
├── index.html                 # Landing page
├── privacy.html               # Privacy policy (App Store compliant)
├── terms.html                 # Terms of service
├── about.html                 # About page
├── contact.html               # Contact page
└── assets/                    # Website assets (logo, icons)

app/                           # React Native/Expo mobile app
├── App.tsx                    # Main entry with navigation and lazy loading
├── src/
│   ├── constants/
│   │   └── theme.ts           # Design system: colors, gradients, spacing, typography
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── hooks/
│   │   └── useQuiz.ts         # Quiz functionality hook
│   ├── lib/
│   │   ├── config.ts          # App config: trial days, pricing, feature flags, URLs
│   │   ├── supabase.ts        # Supabase client
│   │   └── notifications.ts   # Push notification handling
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main dashboard with stats
│   │   ├── SettingsScreen.tsx # User settings, subscription, account deletion
│   │   ├── AuthScreen.tsx     # Sign in/sign up
│   │   ├── QuizScreen.tsx     # Quiz taking interface
│   │   ├── NotesScreen.tsx    # Notes management (premium)
│   │   ├── GroupsScreen.tsx   # Study groups (premium)
│   │   ├── GroupDetailScreen.tsx # Group details and leaderboard
│   │   └── CategoriesScreen.tsx  # Topic selection
│   └── types/                 # TypeScript type definitions
├── assets/                    # App icons and splash screens
└── package.json

app-store/                     # App Store & Google Play submission metadata
├── ios-app-store-metadata.json
├── google-play-metadata.json
├── app-store-description.txt
└── README.md

supabase-schema.sql            # Database schema for mobile app
supabase-groups-schema.sql     # Study groups schema
```

## Pricing Model
- **3-Day Free Trial**: Full access to all features
- **Monthly**: $4.99/month
- **Yearly**: $39.99/year (save 33%)
- **Premium Features**: Unlimited notes with AI questions, Study Groups (1-20 members), priority support

## App Store Compliance
- Account deletion in Settings screen
- Privacy policy and Terms of Service accessible in app and on web
- Subscription cancellation instructions for iOS and Android
- Contact support email accessible

## Running the Mobile App
```bash
cd app && npx expo start
```

## Running the Landing Page
```bash
python -m http.server 5000 --bind 0.0.0.0 --directory public
```

## Tech Stack
- **Mobile**: React Native, Expo SDK 54, TypeScript
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Claude API for quiz generation
- **Notifications**: Expo Notifications

## Supabase Configuration
- **URL**: Set via EXPO_PUBLIC_SUPABASE_URL secret
- **Key**: Set via EXPO_PUBLIC_SUPABASE_ANON_KEY secret
- **Schema**: Run supabase-schema.sql and supabase-groups-schema.sql in SQL Editor

## Recent Changes
- 2026-02-01: Upgraded to Expo SDK 54 (React 19, React Native 0.81.5)
- 2026-02-01: Added Supabase connection test banner on HomeScreen
- 2026-02-01: Configured Supabase credentials
- 2026-01-31: Cleaned up project structure, moved website to public/ folder
- 2026-01-31: Fixed security vulnerabilities (tar package) with npm overrides
- 2026-01-31: Rebranded entire app to lime green (#c8ff00) on black theme
- 2026-01-31: Created complete website: landing page, privacy, terms, about, contact
- 2026-01-31: Added App Store compliance: account deletion, cancellation instructions
