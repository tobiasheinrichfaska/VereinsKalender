# VereinsKalender Phase 3: Implementation Guide

This document describes the complete Phase 3 implementation covering real-time collaboration, mobile app, webhooks, and analytics.

## Overview

Phase 3 adds enterprise-grade features to VereinsKalender:

1. **Real-time Collaboration** - Live sync, conflict resolution, presence awareness
2. **Mobile App** - React Native + Expo SDK 56 with offline-first architecture
3. **Webhooks & Integrations** - Slack, email, Google Calendar, Outlook
4. **Analytics & Insights** - Usage analytics, conflict heatmaps, dashboards

## Project Structure

```
vereinskalender/
├── packages/
│   ├── shared/           # Core types & utilities (unchanged)
│   ├── web/              # React web app + new components
│   │   ├── src/components/
│   │   │   ├── Dashboard.tsx          # Main dashboard
│   │   │   ├── Analytics.tsx          # Analytics visualization
│   │   │   └── CollaborationIndicators.tsx
│   │   └── src/
│   │       └── realtime.ts            # WebSocket client
│   ├── mobile/           # React Native + Expo (NEW)
│   │   ├── src/
│   │   │   ├── screens/               # Mobile screens
│   │   │   ├── sync/SyncManager.ts    # Offline sync
│   │   │   └── notifications/         # Push notifications
│   │   ├── app.json
│   │   └── tsconfig.json
│   └── server/           # Node.js backend (NEW)
│       ├── src/
│       │   ├── realtime/              # WebSocket server
│       │   ├── webhooks/              # Webhook system
│       │   ├── jobs/                  # Job scheduler
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
```

## 1. Real-time Collaboration

### Components

#### Server (packages/server/src/realtime/)

- **server.ts** - WebSocket server with user management
- **conflict-resolver.ts** - Operational Transform conflict detection/resolution
- **types.ts** - Message types for real-time events

#### Client (packages/web/src/realtime.ts)

- **RealtimeClient** - WebSocket client for the browser
- Methods:
  - `connect()` - Connect to server
  - `sendChange()` - Send a change with acknowledgment
  - `sendComment()` - Post comments on entities
  - `resolveConflict()` - Handle conflict resolution
  - `onMessage()` - Subscribe to events
  - `onPresence()` - Track active users
  - `onConflict()` - Handle conflicts

### Features

**Live Synchronization**
- Each change is versioned and broadcasted to all connected clients
- Acknowledgments ensure delivery
- Debounced batch sending (100ms intervals)

**Conflict Detection**
```typescript
// Automatically detects when:
// - Same entity is modified by multiple users
// - Updates overlap on the same fields
// - Deletions conflict with any change
```

**Conflict Resolution Strategies**
- `keep_old` - First change wins
- `accept_new` - Newest change wins (by timestamp)
- `merge` - Combine non-overlapping updates

**Presence Tracking**
- Users appear in real-time activity feed
- Status: online, away, offline
- Current view context (calendar, groups, etc.)
- Auto-update every 30s + activity tracking

### Usage Example

```typescript
import { initRealtimeClient } from './realtime';

// Initialize
const realtime = initRealtimeClient(
  'ws://localhost:3000',
  userId,
  userName
);

// Connect
await realtime.connect();

// Subscribe to changes
realtime.onMessage((event) => {
  console.log('Change:', event.data);
});

// Subscribe to presence
realtime.onPresence((users) => {
  console.log('Active users:', users);
});

// Send a change
await realtime.sendChange({
  operation: 'update',
  entity: 'entry',
  entityId: entryId,
  payload: { title: 'New Title' }
});
```

---

## 2. Mobile App (React Native + Expo)

### Architecture

**Offline-First Sync**
- All data stored locally in AsyncStorage
- Changes queued and synced when online
- Automatic sync every 30 seconds
- Full offline functionality

**Push Notifications**
- Event reminders
- Conflict alerts
- Group activity notifications
- Configurable timing

### Key Files

```
packages/mobile/
├── src/
│   ├── App.tsx                 # Main app with tabs
│   ├── screens/
│   │   ├── CalendarScreen.tsx  # Month view, event list
│   │   ├── EventDetailScreen.tsx # Create/edit events
│   │   ├── GroupsScreen.tsx    # Group list
│   │   └── SettingsScreen.tsx  # User preferences
│   ├── sync/
│   │   └── SyncManager.ts      # Offline sync orchestration
│   ├── notifications/
│   │   └── NotificationManager.ts # Push notifications
│   └── hooks/
│       └── useLocalStorage.ts  # AsyncStorage wrapper
├── app.json                    # Expo config
└── package.json
```

### Features

**Screens**

1. **CalendarScreen**
   - Month navigation
   - Events grouped by day
   - Pull-to-refresh
   - FAB to create event

2. **EventDetailScreen**
   - Create/edit entries
   - Date range picker
   - Group selection
   - Conflict warnings

3. **GroupsScreen**
   - List of all groups
   - Member counts
   - Color coding
   - Group details modal

4. **SettingsScreen**
   - Notifications toggle
   - Offline mode
   - Auto-sync configuration
   - Cache management

**SyncManager**

```typescript
const syncManager = new SyncManager();

// Initialize
await syncManager.initialize();

// Queue a change (auto-synced when online)
await syncManager.queueChange({
  operation: 'create',
  entity: 'entry',
  payload: { title: 'New Event' }
});

// Manual sync
await syncManager.sync();

// Get status
const status = syncManager.getStatus();
// { isSyncing, isOnline, pendingChanges, lastSyncTime }
```

**NotificationManager**

```typescript
const notificationManager = new NotificationManager();

// Initialize
await notificationManager.initialize();

// Send event reminder
await notificationManager.sendEventReminder(
  'Team Meeting',
  '2026-06-01T10:00:00Z',
  15 // minutes before
);

// Send conflict alert
await notificationManager.sendConflictAlert(
  'Event Title',
  'Conflicts with holiday'
);
```

### Setup & Running

```bash
# Install dependencies
npm install
cd packages/mobile
npm install

# Start development
npm run mobile:dev

# Platform-specific
npm run mobile:ios
npm run mobile:android

# Build for production
npm run mobile:build
```

### Expo SDK 56 Notes

- SDK 54+ supported by Expo Go (App Store)
- SDK 56 requires newer build tools
- Use `npx expo install --fix --legacy-peer-deps` for peer deps
- Push notifications require Expo account + credentials

---

## 3. Webhooks & Integrations

### Server Components

#### WebhookManager
```typescript
import { WebhookManager } from './webhooks/manager';

const webhooks = new WebhookManager();

// Register webhook
const webhookId = webhooks.register(
  'entry.created',
  'https://myapp.com/webhooks/entry',
  {
    maxRetries: 5,
    initialDelayMs: 1000,
    backoffMultiplier: 2
  }
);

// Emit event
webhooks.emit('entry.created', {
  title: 'New Event',
  startDate: '2026-06-01'
});

// Configure integrations
webhooks.configureIntegration({
  slack: {
    webhookUrl: 'https://hooks.slack.com/...',
    channel: '#calendar'
  }
});
```

### Integrations

#### 1. **Slack Notifications**

Events triggered:
- `entry.created` - New event created
- `entry.updated` - Event modified
- `conflict.detected` - Scheduling conflict
- `reminder.due` - Event reminder

Rich messages with:
- Event details
- Conflict severity
- Action buttons
- Timestamp

#### 2. **Email Notifications**

Requires SMTP configuration:
```typescript
webhooks.configureIntegration({
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'your-email@gmail.com',
    smtpPassword: 'app-password',
    fromAddress: 'noreply@vereinskalender.de'
  }
});
```

Events:
- `reminder.due` - Reminders 15 min before
- `entry.created` - New event notifications
- `conflict.detected` - Conflict alerts

#### 3. **Google Calendar Sync**

Two-way sync:
```typescript
webhooks.configureIntegration({
  googleCalendar: {
    provider: 'google',
    accessToken: 'ya29.xxx...',
    calendarId: 'primary'
  }
});
```

- Pull from Google Calendar
- Push VereinsKalender events
- Bidirectional sync every 30 minutes
- Conflict detection across calendars

#### 4. **Outlook Sync**

Similar to Google Calendar:
```typescript
webhooks.configureIntegration({
  outlookCalendar: {
    provider: 'outlook',
    accessToken: 'EwAUA8l6BAAU...',
  }
});
```

### Job Scheduler

Schedule recurring tasks:

```typescript
const scheduler = new JobScheduler();

// Send reminders (hourly)
scheduler.scheduleReminders(async () => {
  return await getReminders();
});

// Cleanup old data (weekly)
scheduler.scheduleCleanup(async () => {
  await deleteOldEntries();
});

// Export data (weekly)
scheduler.scheduleExport(async () => {
  await exportToCSV();
});

// Sync external calendars (every 30 min)
scheduler.scheduleCalendarSync(async () => {
  await syncCalendars();
});

scheduler.start();
```

---

## 4. Analytics & Dashboard

### Dashboard Component

Located in `packages/web/src/components/Dashboard.tsx`

**Tabs:**

1. **Overview**
   - Upcoming events (next 5)
   - Conflict/warning list
   - Group activity
   - Quick stats (total events, groups, conflicts)

2. **Analytics**
   - Event distribution by type
   - Top groups by activity
   - 6-month timeline
   - Peak day/hour statistics

3. **Collaboration**
   - Online users list
   - Current activities
   - Feature overview

### Analytics Metrics

**Computed Automatically:**

- Total events
- Events by group
- Events by type
- Events by month
- Peak day/hour
- Active groups count
- Conflict count

### Visualization Components

- **Bar charts** - Event distribution
- **Timelines** - Monthly trends
- **Rankings** - Top groups
- **Metrics cards** - Key numbers

### Collaboration Indicators

**CollaborationIndicators.tsx**
- User avatars with status
- Floating panel (bottom-right)
- Activity feed
- Expandable details

```tsx
import { CollaborationPanel } from './CollaborationIndicators';

<CollaborationPanel users={activeUsers} />
```

---

## Integration Example: Full Setup

### 1. Start Backend

```bash
npm run server:dev
# Server listening on port 3000
# WebSocket: ws://localhost:3000/ws
```

### 2. Configure Integrations

Create `.env.local`:
```
REACT_APP_SLACK_WEBHOOK_URL=https://hooks.slack.com/...
REACT_APP_GOOGLE_CALENDAR_TOKEN=ya29.xxx...
REACT_APP_EMAIL_SMTP_HOST=smtp.gmail.com
```

### 3. Start Web App

```bash
npm run web:dev
# Visit http://localhost:5173
# Real-time collaboration enabled
```

### 4. Optional: Start Mobile

```bash
npm run mobile:dev
# Scan QR code with Expo Go
# Or use iOS/Android simulator
```

### 5. Test Real-time Sync

```typescript
// Open browser console in two windows
const realtime = getRealtimeClient();
realtime.connect();

// In window 1:
realtime.sendChange({
  operation: 'create',
  entity: 'entry',
  entityId: 'test-1',
  payload: { title: 'Test Event' }
});

// Window 2 receives immediately:
// onMessage event with the change
// User presence shows window 1 online
```

---

## Deployment Considerations

### Backend (Node.js)

- Runs on port 3000
- Stateless WebSocket connections (use Redis for scaling)
- Job scheduler runs in-process
- Database: configure in environment

### Mobile

- Build via EAS:
  ```bash
  npm run mobile:build
  ```
- Requires Apple Developer / Google Play accounts
- Push notifications need Expo configuration

### Web

```bash
npm run web:build
# Creates dist/ folder
# Deploy to static host (Vercel, GitHub Pages, etc.)
```

### Database Integration

Currently uses localStorage. For production:

1. Add database adapter to server
2. Replace AsyncStorage with API calls on mobile
3. Implement conflict resolution at DB level

---

## Future Enhancements

- [ ] WebRTC for peer-to-peer sync (offline)
- [ ] End-to-end encryption for events
- [ ] Video conferencing integration
- [ ] Advanced CRDT algorithms
- [ ] Multi-device sync (iCloud, Google Drive)
- [ ] Mobile app deep linking
- [ ] Dark mode support
- [ ] Localization (i18n)

---

## Troubleshooting

### WebSocket Connection Issues

```
Error: Failed to connect to server
Solution: Ensure server is running (npm run server:dev)
          Check CORS headers and firewall
```

### Mobile Sync Not Working

```
Sync state shows offline
Solution: Check network connectivity
          Review SyncManager logs
          Verify API endpoints
```

### Slack Notifications Not Sending

```
Configure correct webhook URL
Enable Slack integration via configureIntegration()
Check webhook URL in Slack workspace
```

---

## API Reference

### WebSocket Messages

```typescript
interface ChangeMessage {
  operation: 'create' | 'update' | 'delete';
  entity: 'entry' | 'group' | 'rule' | 'holiday' | 'conflict';
  entityId: UUID;
  payload: any;
  version: number;
}

interface PresenceMessage {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
}

interface ConflictMessage {
  conflictId: string;
  conflicts: Array<{
    userId: string;
    operation: string;
    entity: string;
    resolution: 'accept_new' | 'keep_old' | 'merge';
  }>;
}
```

### REST Endpoints

```
POST   /webhooks/register      - Register webhook
DELETE /webhooks/:id           - Unregister webhook
POST   /events                 - Emit event
POST   /jobs/schedule          - Schedule job
GET    /health                 - Health check
```

---

## Support & Documentation

- Types: See `packages/shared/src/types.ts`
- Utilities: See `packages/shared/src/utils.ts`
- Component docs: JSDoc comments in source files

For questions or issues, refer to the individual package README files.
