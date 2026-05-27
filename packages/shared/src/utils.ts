import {
  CalendarEntry,
  ConflictRule,
  Holiday,
  RecurringRule,
  FilterOptions,
  ConflictDetectionResult,
  UUID,
  DateRange,
} from './types';

// Date utilities
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z');
}

export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const start = parseDate(range.startDate);
  const end = parseDate(range.endDate);
  return date >= start && date <= end;
}

export function getDatesBetween(
  startStr: string,
  endStr: string
): Date[] {
  const dates: Date[] = [];
  const current = parseDate(startStr);
  const end = parseDate(endStr);

  while (current <= end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

// RRULE parsing and expansion
interface ParsedRule {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  byday?: string[];
  bymonth?: number[];
  bymonthday?: number[];
  byweekno?: number[];
  interval: number;
}

function parseRRule(pattern: string): ParsedRule {
  const params = new Map<string, string>();
  pattern.split(';').forEach((param) => {
    const [key, value] = param.split('=');
    if (key && value) {
      params.set(key, value);
    }
  });

  return {
    freq: (params.get('FREQ') as any) || 'DAILY',
    byday: params.get('BYDAY')?.split(',') || undefined,
    bymonth: params
      .get('BYMONTH')
      ?.split(',')
      .map(Number),
    bymonthday: params
      .get('BYMONTHDAY')
      ?.split(',')
      .map(Number),
    byweekno: params
      .get('BYWEEKNO')
      ?.split(',')
      .map(Number),
    interval: parseInt(params.get('INTERVAL') || '1'),
  };
}

function dayNameToDayNum(dayName: string): number {
  const days: Record<string, number> = {
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
    SU: 0,
  };
  return days[dayName] || 0;
}

export function expandRule(
  rule: RecurringRule,
  year: number
): string[] {
  const startDate = parseDate(rule.startDate);
  const endDate = rule.endDate ? parseDate(rule.endDate) : new Date(year, 11, 31);
  const exceptions = new Set(rule.exceptions);

  // Check for complex pattern first
  const complexParsed = parseComplexPattern(rule.pattern);
  if (complexParsed) {
    return expandComplexRule(complexParsed, startDate, endDate, exceptions);
  }

  const parsed = parseRRule(rule.pattern);
  const dates: Date[] = [];

  const current = new Date(startDate);

  switch (parsed.freq) {
    case 'DAILY':
      while (current <= endDate) {
        if (!exceptions.has(formatDate(current))) {
          dates.push(new Date(current));
        }
        current.setUTCDate(current.getUTCDate() + parsed.interval);
      }
      break;

    case 'WEEKLY':
      if (parsed.byday) {
        const targetDays = parsed.byday.map(dayNameToDayNum);
        while (current <= endDate) {
          const dayOfWeek = current.getUTCDay();
          if (targetDays.includes(dayOfWeek)) {
            if (!exceptions.has(formatDate(current))) {
              dates.push(new Date(current));
            }
          }
          current.setUTCDate(current.getUTCDate() + 1);
        }
      }
      break;

    case 'MONTHLY':
      if (parsed.bymonthday) {
        while (current <= endDate) {
          for (const day of parsed.bymonthday) {
            const candidate = new Date(
              Date.UTC(
                current.getUTCFullYear(),
                current.getUTCMonth(),
                day
              )
            );
            if (
              candidate >= startDate &&
              candidate <= endDate &&
              !exceptions.has(formatDate(candidate))
            ) {
              dates.push(candidate);
            }
          }
          current.setUTCMonth(current.getUTCMonth() + parsed.interval);
        }
      }
      break;

    case 'YEARLY':
      while (current.getUTCFullYear() <= year) {
        const candidate = new Date(
          Date.UTC(
            year,
            parsed.bymonth ? parsed.bymonth[0] - 1 : current.getUTCMonth(),
            parsed.bymonthday ? parsed.bymonthday[0] : current.getUTCDate()
          )
        );
        if (
          candidate >= startDate &&
          candidate <= endDate &&
          !exceptions.has(formatDate(candidate))
        ) {
          dates.push(candidate);
        }
        current.setUTCFullYear(current.getUTCFullYear() + parsed.interval);
      }
      break;
  }

  return dates.map(formatDate).sort();
}

// Complex scheduling rule expansion
interface ComplexRuleParams {
  type: string;
  weekdays?: string[];
  nthOccurrence?: number;
  frequency?: string;
  skipHolidays?: boolean;
  skipSchoolBreak?: boolean;
  month?: string;
  period?: string;
  referenceEvent?: string;
}

function parseComplexPattern(pattern: string): ComplexRuleParams | null {
  if (!pattern.includes(':')) return null;

  const parts = pattern.split(':');
  const type = parts[0];
  const params = new Map<string, string>();

  parts.slice(1).forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) params.set(key, value);
  });

  return {
    type,
    weekdays: params.get('WEEKDAYS')?.split(','),
    nthOccurrence: params.get('NTH') ? parseInt(params.get('NTH')!) : undefined,
    frequency: params.get('FREQ'),
    skipHolidays: params.get('SKIP_HOLIDAYS') === 'true',
    skipSchoolBreak: params.get('SKIP_SCHOOL') === 'true',
    month: params.get('MONTH'),
    period: params.get('PERIOD'),
    referenceEvent: params.get('REF'),
  };
}

function dayNameToDayNumMap(dayName: string): number {
  const map: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };
  return map[dayName] || 0;
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, month - 1, 1));
  let count = 0;
  const current = new Date(first);

  while (current.getUTCMonth() === month - 1) {
    if (current.getUTCDay() === weekday) {
      count++;
      if (count === n) return new Date(current);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return new Date(Date.UTC(year, month - 1, 1)); // fallback
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = new Date(Date.UTC(year, month, 0));
  const current = new Date(last);

  while (current.getUTCDay() !== weekday) {
    current.setUTCDate(current.getUTCDate() - 1);
  }

  return current;
}

function expandComplexRule(
  parsed: ComplexRuleParams,
  startDate: Date,
  endDate: Date,
  exceptions: Set<string>
): string[] {
  const dates: string[] = [];

  if (parsed.type === 'LAST_WEEKDAYS') {
    // Last Tue-Fri in a specific period (e.g., summer break)
    const weekdays = parsed.weekdays?.map(dayNameToDayNumMap) || [2, 3, 4, 5];
    let current = new Date(startDate);

    while (current <= endDate) {
      if (weekdays.includes(current.getUTCDay())) {
        const dateStr = formatDate(current);
        if (!exceptions.has(dateStr)) {
          dates.push(dateStr);
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }
  else if (parsed.type === 'FIRST_AVAILABLE_WEEKDAY') {
    // First available weekday in month, skipping holidays/breaks
    const weekday = parsed.weekdays?.[0] ? dayNameToDayNumMap(parsed.weekdays[0]) : 2;
    const year = startDate.getUTCFullYear();

    for (let m = startDate.getUTCMonth() + 1; m <= 12 && m <= endDate.getUTCMonth() + 1; m++) {
      const firstDay = new Date(Date.UTC(year, m - 1, 1));
      let current = new Date(firstDay);

      while (current.getUTCMonth() === m - 1) {
        if (current.getUTCDay() === weekday) {
          const dateStr = formatDate(current);
          if (!exceptions.has(dateStr) && current >= startDate && current <= endDate) {
            dates.push(dateStr);
            break;
          }
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }
  }
  else if (parsed.type === 'NTH_WEEKDAY_BIMONTHLY') {
    // Nth weekday every 2 months (e.g., 3rd Thursday)
    const n = parsed.nthOccurrence || 3;
    const weekday = parsed.weekdays?.[0] ? dayNameToDayNumMap(parsed.weekdays[0]) : 4;
    let current = new Date(startDate);
    let monthCount = 0;

    while (current <= endDate) {
      if (monthCount % 2 === 0) {
        const candidate = getNthWeekdayOfMonth(current.getUTCFullYear(), current.getUTCMonth() + 1, weekday, n);
        if (candidate >= startDate && candidate <= endDate) {
          const dateStr = formatDate(candidate);
          if (!exceptions.has(dateStr)) {
            dates.push(dateStr);
          }
        }
      }
      current.setUTCMonth(current.getUTCMonth() + 2);
      monthCount++;
    }
  }
  else if (parsed.type === 'FIRST_AFTER_PERIOD') {
    // First weekday after a period (e.g., after summer break)
    const weekday = parsed.weekdays?.[0] ? dayNameToDayNumMap(parsed.weekdays[0]) : 6;
    let current = new Date(startDate);

    while (current <= endDate) {
      if (current.getUTCDay() === weekday) {
        const dateStr = formatDate(current);
        if (!exceptions.has(dateStr)) {
          dates.push(dateStr);
          break;
        }
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return dates.sort();
}

// Filtering
export function filterEntries(
  entries: CalendarEntry[],
  options: FilterOptions
): CalendarEntry[] {
  return entries.filter((entry) => {
    if (options.dateRange) {
      const start = parseDate(options.dateRange.startDate);
      const end = parseDate(options.dateRange.endDate);
      const entryStart = parseDate(entry.startDate);
      const entryEnd = parseDate(entry.endDate);

      if (entryEnd < start || entryStart > end) {
        return false;
      }
    }

    if (options.groups && options.groups.length > 0) {
      if (!entry.groups.some((g) => options.groups!.includes(g))) {
        return false;
      }
    }

    if (options.types && options.types.length > 0) {
      if (!options.types.includes(entry.type)) {
        return false;
      }
    }

    if (options.regions && options.regions.length > 0) {
      if (!entry.region || !options.regions.includes(entry.region)) {
        return false;
      }
    }

    if (options.statuses && options.statuses.length > 0) {
      if (!options.statuses.includes(entry.status)) {
        return false;
      }
    }

    return true;
  });
}

// Conflict detection
export function detectConflicts(
  entry: CalendarEntry,
  conflictRules: ConflictRule[]
): ConflictDetectionResult {
  const conflicts: ConflictDetectionResult['conflicts'] = [];

  for (const rule of conflictRules) {
    // Match by region
    if (entry.region && !rule.regions.includes(entry.region)) {
      continue;
    }

    // Check if entry groups overlap with blocked groups
    const groupOverlap = entry.groups.some((g) =>
      rule.blockedGroups.includes(g)
    );

    if (!groupOverlap) {
      continue;
    }

    // Check trigger condition
    let ruleMatches = false;

    if (rule.triggerType === 'dateRange' && rule.condition.startDate && rule.condition.endDate) {
      ruleMatches = isDateInRange(parseDate(entry.startDate), {
        startDate: rule.condition.startDate,
        endDate: rule.condition.endDate,
      });
    } else if (
      rule.triggerType === 'holiday' &&
      rule.condition.holidayId
    ) {
      ruleMatches = true; // simplified, would check against holiday dates
    }

    if (ruleMatches) {
      conflicts.push({
        rule,
        severity: rule.severity,
      });
    }
  }

  return {
    entryId: entry.id,
    conflicts,
  };
}

// Holiday lookup
export function getHolidayForDate(
  date: Date,
  holidays: Holiday[],
  region: string
): Holiday | null {
  const dateStr = formatDate(date);

  for (const holiday of holidays) {
    if (holiday.region !== region) {
      continue;
    }

    if (holiday.customPeriods) {
      for (const period of holiday.customPeriods) {
        if (isDateInRange(date, period)) {
          return holiday;
        }
      }
    }

    if (holiday.pattern) {
      const rule: RecurringRule = {
        id: holiday.id as UUID,
        type: 'yearly',
        pattern: holiday.pattern,
        startDate: '2020-01-01',
        endDate: '2100-12-31',
        exceptions: [],
        frequency: 1,
        createdAt: 0,
        updatedAt: 0,
      };

      const dates = expandRule(rule, date.getUTCFullYear());
      if (dates.includes(dateStr)) {
        return holiday;
      }
    }
  }

  return null;
}

// UUID generation
export function generateUUID(): UUID {
  return (
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }) as UUID
  );
}

// Date range creation
export function createDateRange(startDate: string, endDate: string): DateRange {
  return { startDate, endDate };
}
