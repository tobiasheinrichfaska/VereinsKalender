# VereinsKalender - Planning Document

**Project:** VereinsKalender (Organization Calendar Management System)  
**Date:** 2026-05-27  
**Purpose:** Centralized calendar for managing group events with filtering, recurring rules, conflict prevention, and regional holiday management.

---

## 1. Feature Specifications & Data Models

### 1.1 Core Entities

**Calendar Entry**
- `id`: UUID
- `title`: string
- `description`: string
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `type`: enum (event, holiday, blocked, other)
- `groups`: UUID[] (associated groups)
- `rules`: Rule[] (if recurring)
- `region`: string (for regional filtering)
- `createdAt`, `updatedAt`: timestamp
- `status`: enum (active, archived, cancelled)

**Group**
- `id`: UUID
- `name`: string
- `description`: string
- `color`: hex color (for UI)
- `members`: string[] (email or user IDs)
- `visibility`: enum (public, private, restricted)
- `createdAt`, `updatedAt`: timestamp

**Recurring Rule**
- `id`: UUID
- `calendarEntryId`: UUID
- `type`: enum (daily, weekly, monthly, yearly, custom)
- `pattern`: string (cron-like or DSL)
- `startDate`: ISO 8601
- `endDate`: ISO 8601 (optional)
- `exceptions`: date[] (excluded dates)
- `frequency`: int (every N days/weeks/months)

**Pattern DSL Examples**
```
FREQ=YEARLY;BYDAY=1TH;BYMONTH=5          # First Thursday in May
FREQ=WEEKLY;BYDAY=FR                     # Every Friday
FREQ=MONTHLY;BYMONTHDAY=15               # 15th of each month
FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25-31  # Christmas holidays (Dec 25-31)
```

**Conflict Rule**
- `id`: UUID
- `name`: string
- `triggerType`: enum (holiday, dateRange, custom)
- `condition`: object (date range, holiday reference, etc.)
- `regions`: string[] (applies to these regions)
- `blockedGroups`: UUID[] (which groups cannot schedule)
- `severity`: enum (soft, hard) — soft warns; hard blocks

**Holiday Definition**
- `id`: UUID
- `name`: string
- `region`: string (DE, AT, CH, etc.)
- `type`: enum (fixed, floating, regional)
- `pattern`: string (FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1)
- `customPeriods`: dateRange[] (override pattern for specific years)
- `relatedConflictRules`: UUID[] (auto-trigger these rules)

---

## 2. User Workflows

### Workflow A: View & Filter Calendar
1. User opens calendar interface
2. Selects filter criteria:
   - Date range (single day, week, month, custom)
   - Groups (multi-select or tags)
   - Event types (events, holidays, blocks)
   - Region (Germany, Austria, Switzerland, etc.)
3. Calendar displays filtered entries with group indicators (colors/badges)
4. Click entry to view details: affected groups, rule info, conflict warnings

### Workflow B: Create Calendar Entry
1. User clicks "New Entry" and selects type (one-time event or recurring)
2. **One-Time Entry:**
   - Fill: title, description, date range, assign groups, optional region
   - Review conflicts: system checks blocking rules
   - Save or resolve conflicts

3. **Recurring Entry:**
   - Fill: title, description, rule pattern (or use UI builder)
   - Set date range for rule validity
   - Assign groups and region
   - Preview: show next 10 occurrences
   - Confirm conflict checks for each generated date
   - Save

### Workflow C: Manage Groups
1. User accesses "Groups" admin section
2. Create group: name, description, color, member emails
3. Edit existing: update members, visibility, color
4. Assign to entries during creation or bulk-edit

### Workflow D: Define & Manage Holidays
1. User navigates to "Holidays" section
2. View system holidays (DE, AT, CH by region)
3. Add custom holiday:
   - Name, region, type (fixed date or floating rule)
   - Set pattern or override specific years
4. Auto-linked conflict rules prevent scheduling on holidays for blocked groups
5. Edit/delete holidays with impact warnings (shows affected entries)

### Workflow E: Conflict Rule Management
1. User accesses "Conflict Rules" admin panel
2. Create rule:
   - Name, trigger type (holiday/date range/custom)
   - Specify condition (which holiday, date range, etc.)
   - Select affected regions
   - Choose blocked groups
   - Set severity (soft = warning, hard = block)
3. Test rule against existing calendar entries
4. Activate and monitor violations

---

## 3. Technical Architecture

### 3.1 Stack & Components

**Frontend**
- React/Vue calendar component (react-big-calendar or FullCalendar)
- Filter sidebar with multi-select
- Group color legend and badge system
- Rule pattern UI builder (or advanced text input)
- Modal/form dialogs for CRUD operations

**Backend** (if needed)
- REST API with endpoints:
  - `GET /calendar` (with filters)
  - `POST /calendar` (create entry)
  - `PUT /calendar/:id` (update with conflict check)
  - `GET /groups`, `POST /groups`
  - `GET /holidays`, `POST /holidays`
  - `GET /conflicts`, `POST /conflicts`
- Business logic:
  - Rule expansion: generate occurrences from pattern + date range
  - Conflict detection: check all entries against conflict rules
  - Holiday lookup: resolve patterns to actual dates

**Storage Layer**
- JSON files (lightweight, local-first)
- SQLite (if scalability needed)
- Nextcloud WebDAV integration (optional)

### 3.2 Key Processing Logic

**Rule Expansion Algorithm**
```
Input: Rule (pattern, startDate, endDate), year
Output: List of dates

1. Parse rule pattern (RRULE format)
2. Generate candidates for [startDate, endDate]
3. Filter exceptions
4. Return sorted date list
```

**Conflict Detection**
```
Input: Calendar entry (groups, date, region)
Output: Conflict list (with severity)

1. Match conflict rules by region
2. For each rule:
   a. Check if entry date matches trigger condition
   b. Check if entry groups overlap with blockedGroups
   c. If match: add to conflict list with severity
3. Return conflicts (may allow save if only soft conflicts)
```

**Holiday Lookup**
```
Input: Region, date
Output: Holiday name or null

1. Find holiday definitions for region
2. Expand floating patterns if not cached
3. Check if date falls in any holiday period
4. Trigger linked conflict rules if present
```

---

## 4. Storage & Schema

### 4.1 Local JSON Structure (Recommended for MVP)

```
.
├── calendar.json        # All entries
├── groups.json          # Group definitions
├── rules.json           # Recurring rules
├── holidays.json        # Holiday definitions & patterns
├── conflicts.json       # Conflict rule definitions
└── cache/
    └── expanded_rules_YYYY.json  # Pre-calculated rule expansions
```

**calendar.json schema:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "title": "Team Meeting",
      "type": "event",
      "startDate": "2026-06-01",
      "endDate": "2026-06-01",
      "groups": ["uuid1", "uuid2"],
      "region": "DE",
      "ruleId": null,
      "status": "active"
    }
  ]
}
```

### 4.2 Nextcloud Integration (Optional)

- Store JSON files in WebDAV-compatible folder
- Use `.nextcloud` metadata file for sync tracking
- Implement conflict resolution (last-write-wins with backup)
- Real-time sync via polling or webhooks

### 4.3 SQLite Schema (if scaling beyond 10k entries)

```sql
CREATE TABLE calendar_entries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  start_date DATE,
  end_date DATE,
  region TEXT,
  status TEXT,
  created_at TIMESTAMP
);

CREATE TABLE entry_groups (
  entry_id TEXT,
  group_id TEXT,
  PRIMARY KEY (entry_id, group_id),
  FOREIGN KEY (entry_id) REFERENCES calendar_entries(id)
);

CREATE TABLE rules (
  id TEXT PRIMARY KEY,
  entry_id TEXT,
  pattern TEXT,
  start_date DATE,
  end_date DATE,
  FOREIGN KEY (entry_id) REFERENCES calendar_entries(id)
);

CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT,
  visibility TEXT
);

CREATE TABLE holidays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  pattern TEXT,
  UNIQUE (name, region)
);

CREATE TABLE conflict_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT,
  condition TEXT (JSON),
  severity TEXT
);

CREATE INDEX idx_calendar_date ON calendar_entries(start_date);
CREATE INDEX idx_calendar_region ON calendar_entries(region);
```

---

## 5. Priority & Roadmap

### Must-Have (MVP - Phase 1)
- [x] Calendar view with month/week display
- [x] Filter by group(s) and date range
- [x] Create one-time events and assign to groups
- [x] Display which groups are affected by each event
- [x] Create and manage groups
- [x] Basic recurring rules (weekly, monthly patterns)
- [x] Local JSON storage

### Nice-to-Have (Phase 2)
- [ ] Holiday definitions with regional support
- [ ] Conflict rules with soft/hard enforcement
- [ ] Advanced recurring patterns (custom DSL builder)
- [ ] Nextcloud WebDAV sync
- [ ] Export (iCal, CSV)
- [ ] User authentication & permissions

### Future (Phase 3)
- [ ] Real-time collaboration
- [ ] Mobile app (React Native / Expo)
- [ ] Webhooks/integrations (Slack, email notifications)
- [ ] Advanced analytics (conflict heatmap, usage patterns)
- [ ] Multi-region conflict analytics

---

## 6. Success Criteria

1. **Calendar View:** Users can see all events for selected groups in chosen date range within 500ms
2. **Filtering:** Multi-filter (group + date + type + region) returns correct subset
3. **Rule Expansion:** Recurring rule with 100 occurrences expands in <100ms
4. **Conflict Detection:** Detects 95%+ of applicable conflicts before save
5. **Data Integrity:** No duplicate entries, consistent group references, rule patterns are valid RRULE format
6. **Scalability:** Handles 10k+ calendar entries and 1k+ rules on local storage without degradation

---

## 7. Implementation Notes

- Use **iCalendar RRULE format** (RFC 5545) for rule patterns—compatible with standard tools
- Store all dates as ISO 8601 (YYYY-MM-DD) to avoid timezone issues
- Implement rule expansion caching by year to optimize performance
- Make conflict rules optional at MVP stage; gate behind admin feature flag
- Design UI to make group assignment prominent (drag-drop or color badges)
- Plan for future Nextcloud sync early—use abstract storage layer

