# Quizifications

## Overview
Quizifications is a React Native/Expo iOS mobile app that sends push notification quizzes from user notes. Users type/paste or scan notes, AI generates quiz questions, and users get quizzed via interactive push notifications. Features a 3-day free trial followed by $1.99/month subscription.

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
├── App.tsx                    # Main entry with navigation (5 screens)
├── src/
│   ├── constants/
│   │   └── theme.ts           # Design system: colors, gradients, spacing, typography
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state management
│   ├── hooks/
│   │   └── useQuiz.ts         # Quiz functionality hook
│   ├── lib/
│   │   ├── config.ts          # App config: trial days, $1.99 pricing, URLs
│   │   ├── supabase.ts        # Supabase client
│   │   └── notifications.ts   # Push notification handling with interactive categories
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main dashboard with stats and quick actions
│   │   ├── NotesScreen.tsx    # Notes list with delete functionality
│   │   ├── AddNoteScreen.tsx  # Add notes: type/paste, camera scan, or gallery
│   │   ├── QuizScreen.tsx     # Quiz taking interface
│   │   ├── SettingsScreen.tsx # Settings, subscription, Restore Purchases, account deletion
│   │   └── AuthScreen.tsx     # Sign in/sign up with trial messaging
│   └── types/                 # TypeScript type definitions
├── assets/                    # App icons and splash screens
└── package.json

supabase-schema-simplified.sql # Simplified database schema (users, notes, questions, attempts, settings)
```

## Pricing Model
- **3-Day Free Trial**: Full access to all features
- **Monthly**: $1.99/month
- **Premium Features**: Unlimited notes, scan handwritten notes, AI-generated quiz questions, push notification quizzes

## App Features
1. **Add Notes**: Type/paste text or scan handwritten/printed notes with camera/gallery
2. **AI Quiz Generation**: Claude API generates multiple choice questions from notes
3. **Push Notification Quizzes**: Interactive notifications with A/B/C/D answer buttons
4. **Progress Tracking**: Streaks, accuracy stats, and learning progress
5. **Spaced Repetition**: Questions weighted by times shown and correct rate

## App Store Compliance
- Account deletion in Settings screen
- Privacy policy and Terms of Service accessible in app and on web
- Restore Purchases button for subscription restoration
- Subscription cancellation instructions for iOS
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
- **Backend**: Supabase (Auth, Database)
- **AI**: Claude API for quiz generation and OCR
- **Notifications**: Expo Notifications with interactive categories

## Supabase Configuration
- **URL**: Set via EXPO_PUBLIC_SUPABASE_URL secret
- **Key**: Set via EXPO_PUBLIC_SUPABASE_ANON_KEY secret
- **Schema**: Run supabase-schema-simplified.sql in SQL Editor

## Environment Variables
- EXPO_PUBLIC_SUPABASE_URL - Supabase project URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY - Supabase anon key
- EXPO_PUBLIC_CLAUDE_API_KEY - Claude API key for AI features

## EAS Build & Submit (No Mac Required)
See `app/BUILD_INSTRUCTIONS.md` for complete step-by-step guide.

Quick commands:
```bash
npm install -g eas-cli
eas login
cd app && eas build --platform ios --profile production
eas submit --platform ios --latest
```

## App Store Screenshots
Located in `public/app-store-screenshots/` organized by device size:
- 6.7-inch (iPhone 14/15 Pro Max): 1290x2796
- 6.5-inch (iPhone 11/12/13 Pro Max): 1284x2778
- 5.5-inch (iPhone 8 Plus): 1242x2208

## Recent Changes
- 2026-02-04: Added iOS camera and photo library permissions to app.json
- 2026-02-04: Created BUILD_INSTRUCTIONS.md with EAS Build submission guide
- 2026-02-04: Generated App Store marketing screenshots for all required sizes
- 2026-02-04: Updated pricing to $1.99/month (removed yearly option)
- 2026-02-04: Simplified app to 5 screens (Home, Notes, AddNote, Quiz, Settings)
- 2026-02-04: Added camera/gallery scanning with Claude Vision OCR
- 2026-02-04: Added interactive notification categories (A/B/C/D answer buttons)
- 2026-02-04: Removed groups and categories features for MVP simplicity
- 2026-02-04: Updated all legal pages and landing page with new pricing
- 2026-02-04: Fixed all TypeScript errors, app compiles successfully
