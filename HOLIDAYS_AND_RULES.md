# Holiday Management & Integration in VereinsKalender

## How Holidays Feed Into the System

### 1. Holiday Entry Points

Holidays can be entered via two methods:

#### A. Holiday Manager UI
- Navigate to "Feiertagsverwaltung" tab
- Click "+ Neuer Feiertag"
- Fill in:
  - **Name**: e.g., "Weihnachten", "Pfingstmontag"
  - **Region**: DE (Germany), AT (Austria), CH (Switzerland)
  - **Type**: 
    - `fixed`: Same date every year (e.g., Dec 25)
    - `floating`: Changes yearly (e.g., Easter)
    - `regional`: Specific to a region
  - **RRULE Pattern**: Defines when the holiday recurs

#### B. Programmatic API (Backend)
```typescript
const holiday: Holiday = {
  id: generateUUID(),
  name: 'Weihnachtstag',
  region: 'DE',
  type: 'fixed',
  pattern: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
  customPeriods: [
    { startDate: '2024-12-25', endDate: '2024-12-31' } // Override for specific year
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
storage.addHoliday(holiday);
```

### 2. RRULE Pattern Format

Holidays use RFC 5545 RRULE format:

| Pattern | Meaning | Example |
|---------|---------|---------|
| `FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1` | Fixed date yearly | New Year (Jan 1) |
| `FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25` | Christmas (Dec 25) | |
| `FREQ=YEARLY;BYMONTH=5;BYDAY=3MO` | 3rd Monday in May | Memorial Day |
| `FREQ=YEARLY;BYMONTH=7;BYDAY=1MO` | 1st Monday in July | | 

Supported parameters:
- `FREQ`: YEARLY, MONTHLY, WEEKLY, DAILY
- `BYMONTH`: 1-12 (months)
- `BYMONTHDAY`: 1-31 (day of month)
- `BYDAY`: MO, TU, WE, TH, FR, SA, SU (with optional prefix for nth occurrence)
- `INTERVAL`: Every N years/months/days

### 3. Holiday-Based Conflict Rules

Holidays integrate with the conflict detection system:

```typescript
const conflictRule: ConflictRule = {
  id: generateUUID(),
  name: 'No meetings during summer break',
  triggerType: 'holiday',
  condition: {
    holidayId: summerBreakHolidayId,
    checkDates: true,
  },
  regions: ['DE'],
  blockedGroups: [boardGroupId],
  severity: 'hard', // hard = block, soft = warn
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
```

### 4. Skip Holiday Feature in Rules

When creating recurring events, you can skip holidays:

**Via RuleBuilder UI:**
- Create event with "Wiederkehrend" (recurring)
- Select "Nth Wochentag in ausgewählten Monaten" (e.g., "first Thursday")
- Check "Feiertage überspringen" (Skip holidays)
- This generates: `SMART:NTH_WEEKDAY=1;WEEKDAY=TH;MONTHS=1,3,5;SKIP_HOLIDAYS=true`

**Pattern format:**
```
SMART:NTH_WEEKDAY=1;WEEKDAY=TH;MONTHS=1,3,5;SKIP_HOLIDAYS=true
```

When expanded, the system:
1. Generates all "first Thursdays" in selected months (Jan, Mar, May)
2. Checks if any generated date falls on a holiday
3. If yes and `SKIP_HOLIDAYS=true`, moves to next Thursday

### 5. Integration with Event Expansion

When a recurring event is expanded (to show upcoming instances):

```typescript
const entries = expandRule(recurringRule, 2024);
// Returns: ['2024-01-04', '2024-03-07', '2024-05-02', ...]

// If SKIP_HOLIDAYS=true, the system checks:
for (const date of entries) {
  const holiday = getHolidayForDate(parseDate(date), holidays, region);
  if (holiday) {
    // Skip this date, find next occurrence
    const nextDate = findNextAvailableDate(date, recurringRule.pattern);
    // Include nextDate instead
  }
}
```

## Use Cases

### Case 1: Board Meeting "First Thursday of Jan, Mar, May, Sep"
**Setup:**
1. Create new event "Vorstandssitzung" (recurring)
2. Use RuleBuilder:
   - Occurrence: "Erstes" (First)
   - Weekday: "Donnerstag" (Thursday)
   - Months: Jan, Mar, May, Sep
   - Check "Feiertage überspringen"
3. Save

**Result:**
- 2024: Jan 4, Mar 7, May 2, Sep 5
- If May 2 is a holiday → moves to May 9
- If Jan 4 is a holiday → moves to Jan 11

### Case 2: Monthly Team Standup "Always Skips August"
**Setup:**
1. Create recurring event "Team Standup"
2. Manual pattern: `FREQ=MONTHLY;BYMONTHDAY=1`
3. Add custom exception for August:
   - In `exceptions` array, add all August 1st dates

OR use RuleBuilder:
- Occurrence: "Erstes" (First)
- Months: Jan, Feb, Mar, Apr, May, Jun, Jul, Sep, Oct, Nov, Dec (skip Aug)

### Case 3: School Break Blocking
**Setup:**
1. Create holiday "Sommerferien" (Summer break)
   - Pattern: `FREQ=YEARLY;BYMONTH=7,8`
   - Region: DE
2. Create conflict rule: Block all groups during "Sommerferien"
   - TriggerType: holiday
   - Severity: hard
3. Any event during July-August that conflicts shows warning

## Data Model Reference

### Holiday
```typescript
interface Holiday {
  id: UUID;
  name: string;
  region: string;        // DE, AT, CH
  type: HolidayType;     // 'fixed' | 'floating' | 'regional'
  pattern?: string;      // RRULE format
  customPeriods?: DateRange[];  // Override for specific years
  relatedConflictRules?: UUID[]; // Links to conflict rules
  createdAt: number;
  updatedAt: number;
}
```

### Conflict Rule (Holiday Trigger)
```typescript
interface ConflictRule {
  id: UUID;
  name: string;
  triggerType: 'holiday' | 'dateRange' | 'custom';
  condition: {
    holidayId?: UUID;    // For holiday trigger
    startDate?: string;  // For dateRange trigger
    endDate?: string;
  };
  regions: string[];
  blockedGroups: UUID[];  // Which groups can't schedule
  severity: 'soft' | 'hard';
  createdAt: number;
  updatedAt: number;
}
```

## Limitations & Future Work

### Current
- Holiday patterns use RFC 5545 RRULE
- Single-day holidays only (no multi-day periods)
- Holiday skip only works with `SKIP_HOLIDAYS=true` in rules
- No automatic integration with external calendar sources

### Planned
- [ ] Import holidays from iCal feed
- [ ] Support multi-day holiday periods
- [ ] Automatic skip during school breaks
- [ ] Region-specific holiday presets (pre-loaded DE/AT/CH holidays)
- [ ] Conflict detection UI shows which holiday is blocking
- [ ] Calendar heat map showing conflict-prone dates
