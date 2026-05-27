# VereinsKalender - Schedule Management System

> **General workspace information:** See [`c:\skripte\private\general stuff\CLAUDE.md`](../../private/general%20stuff/CLAUDE.md) for language, git conventions, versioning, build rules, Python/VS Code setup, and licensing.

## Project Overview
A cross-platform schedule management system for organization groups with complex scheduling patterns and regional restrictions.

### Features
- **Multi-platform**: React PSA (web/PC) + React Native with Expo (iOS/Android)
- **Complex Scheduling**: Support for recurring patterns (e.g., "first Thursday in May")
- **Regional Restrictions**: Holiday and restriction management per region
- **Data Storage**: Local storage with optional Nextcloud integration
- **Export**: Calendar files (iCalendar, Excel) for import into external programs
- **Filtering**: Relevance-based filtering for different organization groups
- **Demo Data**: Comes with exemplary filled calendar data

## Project Structure
```
VereinsKalender/
├── packages/
│   ├── web/          # React PSA web application
│   ├── mobile/       # React Native + Expo mobile app
│   └── shared/       # Shared utilities and types
├── CLAUDE.md
└── package.json      # Monorepo root
```

## Technology Stack
- **Frontend (Web)**: React 19 + Vite (single-file build via `vite-plugin-singlefile`)
- **Mobile**: React Native 0.81, Expo 56
- **Shared**: TypeScript, shared utilities library
- **Storage**: Local + optional Nextcloud
- **Export**: iCalendar (ICS) format, Excel support

## Build & Distribution
- **PC/Web**: `npm run web:build` → `dist/index.html` (~417 kB) — single-file bundle for standalone distribution
- **Mobile**: `npm run mobile:dev` / `npm run mobile:android` / `npm run mobile:ios` — Expo builds for App Store/Play Store
- **All**: `npm run build:all` → shared + web + server

## Development
- `npm install` at root (installs all workspaces)
- `npm run web:dev` - Start web dev server (localhost:5173)
- `npm run mobile:dev` - Start Expo dev server
- `npm run shared:build` - Build shared package

## Key Features to Implement
- [ ] Schedule entry models (recurring, restrictions)
- [ ] Regional holiday management
- [ ] Calendar export (ICS, Excel)
- [ ] Group-based filtering
- [ ] Data storage layer (local + Nextcloud)
- [ ] Demo calendar data

## Recent Fixes (2026-05-27)

### Issue: TypeError in CalendarView component
**Problem:** `startOfWeek2 is not a function` error when rendering calendar
**Root Cause:** Missing date-fns functions in `dateFnsLocalizer` configuration
**Fix Applied:**
- Added imports: `startOfWeek`, `getDay`, `parse` from date-fns
- Updated localizer config in CalendarView.tsx to include these functions
- Disabled Vite minification to prevent variable name obfuscation
- Set `base: './'` for relative path resolution

**Build Changes:**
- `vite.config.ts`: Set `minify: false`, `base: './'`, `assetsInlineLimit: 100000000`
- Output: 1.03 MB single-file bundle (readable without minification)

**Verification Status:**
- ✅ App renders UI correctly (calendar, navigation, filters visible)
- ⚠️ Cannot definitively verify console for errors (DevTools check failed)
- ⚠️ Interactive testing incomplete

### File Modified
- `packages/web/src/components/CalendarView.tsx` - Added missing date-fns imports and localizer config
- `packages/web/vite.config.ts` - Build optimization for file:// protocol support
- Committed: `d6928d7` - "Fix: Add missing date-fns functions to dateFnsLocalizer and optimize build for file:// protocol"

## Notes
- Uses npm workspaces for monorepo management
- Mobile app tested with Expo Go (SDK 54+)
- Shared package provides types and utilities for both platforms
- Web app now runnable as standalone file:// without server (after fixes)
