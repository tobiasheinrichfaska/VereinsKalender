# VereinsKalender - Schedule Management System

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
- **Frontend (Web)**: React 19, Vite
- **Mobile**: React Native 0.81, Expo 56
- **Shared**: TypeScript, shared utilities library
- **Storage**: Local + optional Nextcloud
- **Export**: iCalendar (ICS) format, Excel support

## Development
- `npm install` at root (installs all workspaces)
- `npm run web:dev` - Start web dev server
- `npm run mobile:dev` - Start Expo dev server
- `npm run shared:build` - Build shared package

## Key Features to Implement
- [ ] Schedule entry models (recurring, restrictions)
- [ ] Regional holiday management
- [ ] Calendar export (ICS, Excel)
- [ ] Group-based filtering
- [ ] Data storage layer (local + Nextcloud)
- [ ] Demo calendar data

## Notes
- Uses npm workspaces for monorepo management
- Mobile app tested with Expo Go (SDK 54+)
- Shared package provides types and utilities for both platforms
