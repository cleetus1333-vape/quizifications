# Quizifications Landing Page

## Overview
A static landing page for Quizifications - a study app that quizzes users throughout the day from their own notes. The page showcases features, pricing, study groups functionality, and a waitlist signup form.

## Project Structure
- `index.html` - Main landing page (formerly quizifications-landing.html)
- `assets/` - Contains app icons and images
  - `icon.png` - App icon
  - `adaptive-icon.png` - Adaptive icon for Android
  - `splash.png` - Splash screen image
- `supabase-schema.sql` - Database schema for the full app
- `supabase-groups-schema.sql` - Database schema for study groups feature
- `quizifications-mvp.zip` - MVP source files

## Running Locally
The project uses Python's built-in HTTP server:
```bash
python -m http.server 5000 --bind 0.0.0.0
```

## Deployment
This is a static site that can be deployed using Replit's static deployment target.

## Recent Changes
- 2026-01-31: Initial setup - renamed landing page to index.html and configured web server workflow
