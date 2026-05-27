# VereinsKalender - Schedule Management System

> **Workspace info:** See [`c:\skripte\private\general stuff\CLAUDE.md`](../../private/general%20stuff/CLAUDE.md) for language, git, versioning, and licensing conventions.

## Overview

Cross-platform schedule management system for organization groups with complex scheduling rules, regional restrictions, and multi-user collaboration.

**Platforms:** Web (React PSA) | Mobile (React Native + Expo 56) | Server (Node.js)  
**Status:** Phase 1-2 complete (single-user web MVP) | Phase 3 partial (real-time scaffolding)

## Project Structure

```
packages/
├── shared/       # Types, utilities, algorithms
├── web/          # React PSA web app (1.03 MB single-file bundle)
├── mobile/       # React Native + Expo app
└── server/       # WebSocket + webhooks (scaffolding)
```

## Stack

- **Web:** React 19, Vite, react-big-calendar, date-fns
- **Mobile:** React Native 0.81, Expo SDK 56, React Navigation
- **Server:** Express.js, WebSockets, node-cron
- **Storage:** localStorage (Phase 1-2) → ready for SQLite
- **Export:** iCalendar (RFC 5545), CSV, PDF (planned)

## Quick Start

```bash
npm install
npm run web:dev      # localhost:5173
npm run mobile:dev   # Expo dev server
npm run server:dev   # localhost:3000 (optional)
```

## Current Features

✅ **Calendar View** - Month/week display with filtering  
✅ **Event Management** - Create, edit, delete events; assign to groups  
✅ **Groups** - Create, manage, assign colors and members  
✅ **Filtering** - By date, group, type, region, status  
✅ **Export** - iCalendar and CSV formats  
✅ **Recurring Rules** - RRULE support (DAILY, WEEKLY, MONTHLY, YEARLY)  
✅ **Holidays** - Regional (DE, AT, CH) with patterns  
✅ **Conflict Rules** - Soft/hard blocking for complex constraints  

## Planned Work

### Immediate (Priority 1)

1. **Complex Scheduling Rules** - Unified pattern system for:
   - Last Tue-Fri in last week of summer break
   - First Tue in month (with holiday skip)
   - 3rd Thu in month every 2 months
   - First Sat after summer break
   - 2nd possible Tue/Thu in month
   - First Thu after another meeting
   - Closest date to a target
   - etc.

2. **Duration/Hours** - Add `startTime`, `endTime` to events; display in calendar

3. **Group Tags** - Allow multiple groups per event with tag-based filtering

4. **PDF Export** - Export calendar with group filtering

### Phase 3 Integration (Priority 2)

- [ ] Wire real-time server into web app (WebSocket client exists)
- [ ] Integrate mobile SyncManager
- [ ] Add authentication & authorization
- [ ] Input validation on server
- [ ] Webhook payload formatting

## Critical Fixes Needed

See AUDIT_REPORT.md for full details. Key issues:

| Issue | File | Impact |
|-------|------|--------|
| Non-UUID ID generation | ConflictRuleManager | ID collisions, type safety |
| Unimplemented conflict rule save | App.tsx | Rules silently dropped |
| Recurrence not persisted | EventForm | Dead UI, no recurring events |
| Null check missing | utils.ts | Silent conflicts overlooked |
| JSON parse no error handling | realtime.ts | WS crashes on malformed data |

## Data Model

See VereinsKalender_PLANUNG.md for full schema. Core entities:

- **CalendarEntry** - Event with date range, groups, rules, status
- **Group** - Named group with colors, members, visibility
- **RecurringRule** - RRULE pattern with frequency, exceptions
- **Holiday** - Regional, with patterns and custom overrides
- **ConflictRule** - Trigger (holiday, date range, custom), block groups, severity

## Development Notes

- TypeScript strict mode enabled
- No tests yet (audit noted none exist)
- localStorage max ~5-10MB (fine for demo, needs DB for production)
- Single-file web build: `npm run web:build` → `dist/index.html` (1.03 MB)
- Mobile: test with Expo Go or build for App Store/Play Store

## Commands

```bash
npm run web:dev           # Web dev (localhost:5173)
npm run web:build         # Single-file bundle
npm run mobile:dev        # Expo dev
npm run shared:build      # Shared package
npm run type-check        # All TypeScript
npm run build:all         # All packages
```

## Next Steps

1. ✅ Delete redundant docs (DONE)
2. ⏳ Implement complex scheduling rules
3. ⏳ Add duration/hours to events
4. ⏳ Add group tags for multi-group events
5. ⏳ Implement PDF export
6. ⏳ Fix critical audit issues

---

See AUDIT_REPORT.md for code quality issues and VereinsKalender_PLANUNG.md for full feature specifications.
