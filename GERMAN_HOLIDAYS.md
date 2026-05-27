# German Holidays Configuration System

## Overview

The German Holidays system provides:
- **17 official German holidays** (fixed and Easter-dependent)
- **Regional variations** for all 16 Bundesländer (states) + federal level
- **Easter calculation** using the Computus algorithm
- **Interactive configuration UI** to select applicable holidays by region
- **Smart integration** with event scheduling and conflict detection

## All German Holidays

### Nationwide Holidays (Bundesweite Feiertage)

| Holiday | German Name | Type | Date | Regions |
|---------|------------|------|------|---------|
| New Year's Day | Neujahrstag | Fixed | Jan 1 | All |
| Labour Day | Tag der Arbeit | Fixed | May 1 | All |
| German Unity Day | Tag der Deutschen Einheit | Fixed | Oct 3 | All |
| Christmas Day | Weihnachtstag | Fixed | Dec 25 | All |
| Second Day of Christmas | Zweiter Weihnachtstag | Fixed | Dec 26 | All |
| Good Friday | Karfreitag | Easter | -2 days | All |
| Easter Monday | Ostermontag | Easter | +1 day | All |
| Ascension Day | Himmelfahrtstag | Easter | +39 days | All |
| Whit Monday | Pfingstmontag | Easter | +50 days | All |

### Regional Holidays (Regionale Feiertage)

#### Catholic Regions

| Holiday | German Name | Type | Date/Offset | Regions |
|---------|------------|------|-------------|---------|
| Epiphany | Epiphanie / Heilige Drei Könige | Fixed | Jan 6 | BW, BY, SN, SH |
| Corpus Christi | Fronleichnam | Easter | +60 days | BW, BY, HE, NW, RP, SL |
| All Saints' Day | Allerheiligen | Fixed | Nov 1 | BW, BY, NW, RP, SL |

#### Protestant Regions

| Holiday | German Name | Type | Date | Regions |
|---------|------------|------|------|---------|
| Reformation Day | Reformationstag | Fixed | Oct 31 | BB, HB, HH, MV, NI, SN, ST, SH, TH |

#### Special/Local Holidays

| Holiday | German Name | Type | Date | Regions |
|---------|------------|------|------|---------|
| Augsburg Peace Celebration | Augsburger Friedensfest | Fixed | Aug 8 | BY (Augsburg city only) |
| Repentance and Prayer Day | Buß- und Bettag | Computed | Wed before last Sun in Nov | BW, BY, HE, NW, RP, SL, SN |

## State Abbreviations

```
DE = Deutschland (Federal level - for national laws)
BW = Baden-Württemberg
BY = Bayern (Bavaria)
BE = Berlin
BB = Brandenburg
HB = Bremen (Stadtstate)
HH = Hamburg (Citystate)
HE = Hessen (Hesse)
MV = Mecklenburg-Vorpommern
NI = Niedersachsen (Lower Saxony)
NW = Nordrhein-Westfalen (North Rhine-Westphalia)
RP = Rheinland-Pfalz (Rhineland-Palatinate)
SL = Saarland
SN = Sachsen (Saxony)
ST = Sachsen-Anhalt (Saxony-Anhalt)
SH = Schleswig-Holstein
TH = Thüringen (Thuringia)
```

## Easter Calculation

The system uses the **Anonymous Gregorian algorithm** (also called the Meeus algorithm) to calculate Easter Sunday, from which all other Easter-dependent holidays are derived.

### Algorithm
```typescript
function calculateEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}
```

### Easter-Dependent Holiday Offsets

| Holiday | German Name | Days after Easter |
|---------|------------|-------------------|
| Good Friday | Karfreitag | -2 |
| Easter Sunday | Ostersonntag | 0 |
| Easter Monday | Ostermontag | +1 |
| Ascension Day | Himmelfahrtstag | +39 |
| Whit Sunday | Pfingstsonntag | +49 |
| Whit Monday | Pfingstmontag | +50 |
| Corpus Christi | Fronleichnam | +60 |

### Easter Dates 2024-2028

```
2024: April 31 → Good Friday: Mar 29, Easter Mon: Apr 1, Ascension: May 9, Whit Mon: May 20
2025: April 20 → Good Friday: Apr 18, Easter Mon: Apr 21, Ascension: May 29, Whit Mon: Jun 9
2026: April 5  → Good Friday: Apr 3, Easter Mon: Apr 6, Ascension: May 14, Whit Mon: May 25
2027: March 28 → Good Friday: Mar 26, Easter Mon: Mar 29, Ascension: May 6, Whit Mon: May 17
2028: April 16 → Good Friday: Apr 14, Easter Mon: Apr 17, Ascension: May 25, Whit Mon: Jun 5
```

## Using the Configuration UI

### GermanHolidayConfig Component

Located in `packages/web/src/components/GermanHolidayConfig.tsx`

#### Features

1. **Region Selection**
   - Dropdown to select Bundesland or federal level
   - Automatically updates available holidays based on region

2. **Holiday Selection**
   - Checkbox list of applicable holidays
   - Grouped by type: Fixed, Easter-dependent, Regional
   - "Select All / Clear All" buttons

3. **Preview**
   - Date preview for selected year
   - Shows actual date of Easter-dependent holidays
   - Helpful for planning

4. **Details**
   - Expandable holiday details
   - English translations
   - RRULE patterns
   - Applicable regions

#### Example Usage

```typescript
import GermanHolidayConfig, {
  GERMAN_HOLIDAYS,
  GermanHolidayConfig as HolidayConfig,
  holidayConfigToHoliday,
} from '@vereinskalender/shared';

function MyApp() {
  const [selectedHolidays, setSelectedHolidays] = useState<HolidayConfig[]>([]);

  const handleHolidaySelection = (holidays: HolidayConfig[]) => {
    setSelectedHolidays(holidays);

    // Convert to Holiday objects and store
    const holidayObjects = holidays.map((config) =>
      holidayConfigToHoliday(config, 'BY') // Bayern example
    );

    // Save to storage
    holidayObjects.forEach((h) => storage.addHoliday(h));
  };

  return (
    <GermanHolidayConfig
      onSelectionChange={handleHolidaySelection}
      preselectedRegion="BY"
    />
  );
}
```

### Programmatic API

```typescript
import {
  GERMAN_HOLIDAYS,
  getHolidaysForRegion,
  calculateEasterDate,
  getEasterDependentHolidays,
  holidayConfigToHoliday,
} from '@vereinskalender/shared';

// Get all holidays for a region
const byHolidays = getHolidaysForRegion('BY');

// Calculate Easter
const easter2024 = calculateEasterDate(2024);
// Date(2024, 3, 31) = March 31, 2024

// Get all Easter-dependent dates
const easterDates = getEasterDependentHolidays(2024);
// {
//   goodFriday: Date,
//   easterSunday: Date,
//   easterMonday: Date,
//   ascensionDay: Date,
//   whitMonday: Date,
//   corpusChristi: Date,
// }

// Convert config to Holiday object
const holiday = holidayConfigToHoliday(GERMAN_HOLIDAYS[0], 'BY');
```

## Integration with Calendar

### 1. Adding Holidays to Calendar

```typescript
// On first load or setup
function initializeGermanHolidays(selectedRegion: string) {
  const holidays = getHolidaysForRegion(selectedRegion);

  holidays.forEach((config) => {
    const holiday = holidayConfigToHoliday(config, selectedRegion);
    storage.addHoliday(holiday);
  });
}
```

### 2. Using Holidays in Recurring Events

When creating a recurring event, you can skip holidays:

```typescript
// Create event that skips holidays
const rule: RecurringRule = {
  id: generateUUID(),
  calendarEntryId: eventId,
  type: 'custom',
  pattern: 'SMART:NTH_WEEKDAY=1;WEEKDAY=TH;MONTHS=1,3,5,9;SKIP_HOLIDAYS=true',
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  exceptions: [],
  frequency: 1,
};
```

### 3. Conflict Detection

Link holidays to conflict rules to block scheduling:

```typescript
const conflictRule: ConflictRule = {
  id: generateUUID(),
  name: 'No meetings during Easter holidays',
  triggerType: 'holiday',
  condition: {
    holidayId: easterMondayHolidayId,
  },
  regions: ['BY'],
  blockedGroups: [boardGroupId],
  severity: 'hard',
};
```

## Holiday Storage Format

Holidays are stored using RFC 5545 RRULE format where applicable:

### Fixed Holiday Example
```json
{
  "id": "holiday-neujahrstag-DE",
  "name": "Neujahrstag",
  "region": "DE",
  "type": "fixed",
  "pattern": "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### Easter-Dependent Holiday Example
```json
{
  "id": "holiday-ostermontag-DE",
  "name": "Ostermontag",
  "region": "DE",
  "type": "floating",
  "pattern": null,
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

Note: Easter-dependent holidays have `pattern: null` since they can't be expressed in RRULE format. They're calculated on-demand using `calculateEasterDate()`.

## Data Structure Reference

### GermanHolidayConfig Interface

```typescript
interface GermanHolidayConfig {
  id: string;                          // Unique identifier
  nameDE: string;                      // German name
  nameEN: string;                      // English name
  type: 'fixed' | 'easter' | 'region-specific';
  description: string;                 // Human-readable description
  fixedDate?: { month: number; day: number };
  easterOffset?: number;               // Days after Easter
  regions: RegionCode[];               // Which regions it applies to
  pattern?: string;                    // RRULE pattern (for fixed/regional)
}
```

### RegionCode Type

```typescript
type RegionCode = 
  | 'DE'   // Federal
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV'
  | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';
```

## Limitations & Future Work

### Current
- ✅ All 17 German holidays covered
- ✅ Easter calculation works for any year
- ✅ Regional selection by Bundesland
- ✅ Interactive configuration UI
- ✅ RRULE storage format

### Planned
- [ ] Import holidays from iCal feed (e.g., DLM.de)
- [ ] School holiday integration (Schulferien)
- [ ] Business holiday templates (half days, custom company holidays)
- [ ] Holiday color coding in calendar view
- [ ] Automatic event conflict detection
- [ ] Export calendar with embedded holidays
- [ ] Mobile app holiday sync

## Testing Examples

```typescript
// Test Easter calculation
console.log(calculateEasterDate(2024)); // Mar 31, 2024
console.log(calculateEasterDate(2025)); // Apr 20, 2025
console.log(calculateEasterDate(2026)); // Apr 5, 2026

// Test regional holidays
const bavariaHolidays = getHolidaysForRegion('BY');
console.log(bavariaHolidays.length); // 13 holidays

const berlinHolidays = getHolidaysForRegion('BE');
console.log(berlinHolidays.length); // 9 holidays

// Test holiday conversion
const config = GERMAN_HOLIDAYS.find((h) => h.id === 'ostermontag');
const holiday = holidayConfigToHoliday(config, 'BY');
console.log(holiday.name); // "Ostermontag"
```
