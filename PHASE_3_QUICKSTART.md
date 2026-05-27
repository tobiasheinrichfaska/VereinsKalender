# Phase 3 Quick Start Guide

## What's New in Phase 3

VereinsKalender now includes:
- **Real-time Collaboration** - Live sync across devices
- **Mobile App** - Full React Native + Expo app
- **Webhooks & Integrations** - Slack, Email, Google Calendar, Outlook
- **Analytics** - Dashboard with insights and metrics
- **Offline-First Mobile** - Works completely offline, syncs when online

## Getting Started (5 minutes)

### 1. Install Dependencies

```bash
# From root directory
npm install

# Or if using workspace
npm run install:all
```

### 2. Start the Backend Server

In terminal 1:
```bash
npm run server:dev
# Listens on http://localhost:3000
# WebSocket at ws://localhost:3000/ws
```

### 3. Start the Web App

In terminal 2:
```bash
npm run web:dev
# Opens at http://localhost:5173
```

### 4. (Optional) Start Mobile App

In terminal 3:
```bash
npm run mobile:dev
# Scan QR code with Expo Go app on phone
# Or use iOS/Android simulator
```

That's it! All three platforms now work together with real-time sync.

## Testing Real-time Features

### Test Collaboration in Browser

1. Open http://localhost:5173 in two browser windows
2. In Window 1, create a new event
3. In Window 2, you'll see it appear in real-time
4. Edit the event in Window 1 - Window 2 updates instantly
5. Both show active user presence (avatars in bottom-right)

### Test Mobile Sync

1. Create an event on web
2. Open mobile app (Expo)
3. Pull to refresh - event appears
4. Create event on mobile
5. Go back to web - event synced
6. Turn off mobile network
7. Create events on mobile (queued)
8. Turn network back on
9. Changes sync automatically

### Test Conflict Detection

1. Open event detail in two browsers
2. Edit same field in both simultaneously
3. Second edit triggers conflict dialog
4. Choose: accept, reject, or merge
5. All devices see final state

## Testing Integrations

### Slack Integration

```typescript
// In server code or via API
webhooks.configureIntegration({
  slack: {
    webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    channel: '#calendar',
    username: 'VereinsKalender Bot'
  }
});

// Events trigger Slack messages:
// - entry.created → "New event created"
// - conflict.detected → "⚠️ Schedule conflict"
// - reminder.due → "🔔 Reminder: Event coming up"
```

### Email Integration

```typescript
webhooks.configureIntegration({
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'your-email@gmail.com',
    smtpPassword: 'your-app-password',
    fromAddress: 'noreply@vereinskalender.de'
  }
});

// Events that trigger emails:
// - reminder.due (15 min before event)
// - entry.created (new event notification)
// - conflict.detected (conflict alert)
```

### Google Calendar Sync

```typescript
webhooks.configureIntegration({
  googleCalendar: {
    provider: 'google',
    accessToken: 'ya29.a0AfH6SMBx...', // From OAuth flow
    calendarId: 'primary'
  }
});

// Runs automatically:
// - Pulls Google Calendar events every 30 min
// - Pushes VereinsKalender events to Google
// - Detects cross-calendar conflicts
```

## Project Structure (High Level)

```
vereinskalender/
├── packages/
│   ├── shared/          # Shared types & utilities (unchanged)
│   ├── web/             # React web app (enhanced)
│   ├── mobile/          # React Native + Expo (NEW)
│   └── server/          # Node.js backend (NEW)
├── PHASE_3_IMPLEMENTATION.md  # Full documentation
└── PHASE_3_QUICKSTART.md      # This file
```

## Key Features by Platform

### Web App (React + Vite)
- ✅ Real-time collaboration
- ✅ Dashboard with analytics
- ✅ Conflict detection & resolution
- ✅ Webhook management
- ✅ User presence tracking
- ✅ Comment/annotation system

### Mobile App (React Native + Expo SDK 56)
- ✅ Calendar view (month/event list)
- ✅ Create/edit events offline
- ✅ Auto-sync when online
- ✅ Push notifications
- ✅ Offline-first architecture
- ✅ Settings & preferences
- ✅ Group management

### Backend (Node.js)
- ✅ WebSocket server
- ✅ Conflict resolution engine
- ✅ Webhook system with retry
- ✅ Job scheduler (cron)
- ✅ Slack/Email/Calendar integrations
- ✅ User presence management

## Common Tasks

### Add an Event

**Web:**
1. Click "+ Neuer Eintrag"
2. Fill in title, date, description
3. Select groups
4. Save
5. Appears in real-time on other devices

**Mobile:**
1. Tap "+" button on Calendar tab
2. Fill in details
3. Save
4. Auto-syncs when online

### Create a Group

**Web:**
1. Go to "Gruppen" tab
2. Click to add new group
3. Set name, color, members
4. Save

**Mobile:**
1. Groups tab
2. Tap "+" to create
3. Enter details
4. Save

### Set Up Reminders

**Automatic Reminders (15 min before):**
- Email reminders configured
- Push notifications on mobile
- Slack notifications in channel

**Scheduler Job:**
```typescript
scheduler.scheduleReminders(async () => {
  // Runs hourly
  // Sends reminders for upcoming events
});
```

### Monitor Collaboration

**Browser:**
- Bottom-right corner shows active users
- See who's viewing what section
- Real-time presence updates
- Click to expand collaboration panel

**Dashboard:**
- Collaboration tab shows all users
- Online/away/offline status
- Current viewing location

## Environment Variables

Create `.env.local` in root:

```bash
# Server
SERVER_URL=http://localhost:3000
PORT=3000

# Web
REACT_APP_SERVER_URL=http://localhost:3000
REACT_APP_SLACK_WEBHOOK_URL=https://hooks.slack.com/...
REACT_APP_GOOGLE_CALENDAR_TOKEN=ya29.xxx...

# Mobile
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
```

## Troubleshooting Quick Tips

**Server won't start**
```bash
# Clear node_modules and reinstall
rm -rf node_modules packages/*/node_modules
npm install
npm run server:dev
```

**Real-time not working**
- Check server is running: `curl http://localhost:3000/health`
- Check browser console for WebSocket errors
- Ensure firewall allows port 3000

**Mobile sync failing**
- Verify mobile device can reach server IP
- Check network in Settings
- Clear cache: Settings → Cache Management → Clear

**Webhooks not sending**
- Verify webhook URL is correct
- Check server logs for errors
- Use ngrok to test locally: `ngrok http 3000`

## Performance Tips

1. **Limit real-time updates:** Debouncing is built-in (100ms)
2. **Mobile offline:** Works completely without internet
3. **Database:** Currently localStorage; add real DB for scaling
4. **WebSocket:** Scales to hundreds of concurrent users
5. **Job scheduler:** Runs in-process; use job queue for production

## Next Steps

1. ✅ Test all three platforms
2. ✅ Configure integrations (Slack, email)
3. ✅ Set up external calendar sync
4. ✅ Customize UI/branding
5. ✅ Deploy to production

For detailed documentation, see **PHASE_3_IMPLEMENTATION.md**

## Support Files

- **Real-time system** → `packages/server/src/realtime/`
- **Mobile app** → `packages/mobile/src/`
- **Web dashboard** → `packages/web/src/components/Dashboard.tsx`
- **Webhooks** → `packages/server/src/webhooks/`
- **Sync manager** → `packages/mobile/src/sync/SyncManager.ts`

Happy scheduling! 📅
