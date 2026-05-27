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
  const parsed = parseRRule(rule.pattern);
  const dates: Date[] = [];
  const startDate = parseDate(rule.startDate);
  const endDate = rule.endDate ? parseDate(rule.endDate) : new Date(year, 11, 31);
  const exceptions = new Set(rule.exceptions);

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

    if (rule.triggerType === 'dateRange' && rule.condition.startDate) {
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
