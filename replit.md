# Quizifications

## Overview
Quizifications is a React Native/Expo mobile app that sends push notification quizzes from user notes. The app features a 3-day free trial followed by premium subscription ($4.99/month or $39.99/year) for unlimited notes, AI-generated quizzes, and study groups (1-20 members). Trial-based model only—no free tier or ads on mobile.

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
│   │   ├── config.ts          # App config: trial days, pricing, feature flags
│   │   ├── supabase.ts        # Supabase client
│   │   └── notifications.ts   # Push notification handling
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main dashboard with stats
│   │   ├── SettingsScreen.tsx # User settings and subscription
│   │   ├── AuthScreen.tsx     # Sign in/sign up
│   │   ├── QuizScreen.tsx     # Quiz taking interface
│   │   ├── NotesScreen.tsx    # Notes management (premium)
│   │   ├── GroupsScreen.tsx   # Study groups (premium)
│   │   ├── GroupDetailScreen.tsx # Group details and leaderboard
│   │   └── CategoriesScreen.tsx  # Topic selection
│   └── types/                 # TypeScript type definitions
├── assets/                    # App icons and splash screens
└── package.json

index.html                     # Landing page for web
assets/                        # Landing page assets
supabase-schema.sql           # Database schema
supabase-groups-schema.sql    # Study groups schema
```

## Design System
- **Colors**: Purple (#8b5cf6) and Cyan (#06b6d4) gradient theme
- **Background**: Dark (#0f0f23) with elevated cards (#1a1a2e)
- **Components**: Rounded corners, soft shadows, gradient buttons
- **Typography**: System fonts with weight hierarchy

## Pricing Model
- **3-Day Free Trial**: Full access to all features
- **Monthly**: $4.99/month
- **Yearly**: $39.99/year (save 33%)
- **Premium Features**: Unlimited notes with AI questions, Study Groups (1-20 members), priority support

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
- 2026-01-31: Redesigned UI with modern purple/cyan gradient theme
- 2026-01-31: Updated pricing model to 3-day trial (removed free tier)
- 2026-01-31: Added React.lazy and React.memo for performance optimization
- 2026-01-31: Wired trial CTAs to Settings screen for upgrade flow
