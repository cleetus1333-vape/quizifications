# Quizifications

## Overview
Quizifications is a React Native/Expo mobile app that sends push notification quizzes from user notes. The app features a 3-day free trial followed by premium subscription ($4.99/month or $39.99/year) for unlimited notes, AI-generated quizzes, and study groups (1-20 members). Trial-based model only—no free tier or ads on mobile.

## Brand Identity
- **Primary Color**: Lime green (#c8ff00)
- **Background**: Black (#0a0a0b) with elevated cards (#141416, #1a1a1e)
- **Logo**: Bold "Q" in lime green
- **Contact**: Matt@quizifications.com
- **Website**: quizifications.com

## Project Structure
```
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
├── assets/                    # App icons and splash screens (lime green Q logo)
└── package.json

index.html                     # Landing page for web
privacy.html                   # Privacy policy (App Store compliant)
terms.html                     # Terms of service
about.html                     # About page
contact.html                   # Contact page with Matt@quizifications.com
assets/                        # Landing page assets including logo
app-store/                     # App Store & Google Play submission metadata
├── ios-app-store-metadata.json
├── google-play-metadata.json
├── app-store-description.txt
└── README.md
supabase-schema.sql           # Database schema
supabase-groups-schema.sql    # Study groups schema
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
python -m http.server 5000 --bind 0.0.0.0
```

## Tech Stack
- **Mobile**: React Native, Expo, TypeScript
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **AI**: Claude API for quiz generation
- **Notifications**: Expo Notifications

## Recent Changes
- 2026-01-31: Rebranded entire app to lime green (#c8ff00) on black theme
- 2026-01-31: Created complete website: landing page, privacy, terms, about, contact
- 2026-01-31: Added App Store compliance: account deletion, cancellation instructions
- 2026-01-31: Updated all contact info to Matt@quizifications.com
