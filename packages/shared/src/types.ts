// Core data models for VereinsKalender

export type UUID = string & { readonly __brand: 'UUID' };

export type EventType = 'event' | 'holiday' | 'blocked' | 'other';
export type EntryStatus = 'active' | 'archived' | 'cancelled';
export type RuleType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type Severity = 'soft' | 'hard';
export type Visibility = 'public' | 'private' | 'restricted';
export type HolidayType = 'fixed' | 'floating' | 'regional';
export type ConflictTriggerType = 'holiday' | 'dateRange' | 'custom';

// Calendar Entry
export interface CalendarEntry {
  id: UUID;
  title: string;
  description: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  startTime?: string; // HH:MM (optional)
  endTime?: string; // HH:MM (optional)
  type: EventType;
  groups: UUID[];
  ruleId?: UUID;
  region?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  status: EntryStatus;
}

// Group
export interface Group {
  id: UUID;
  name: string;
  description: string;
  color: string; // hex color
  members: string[]; // email or user IDs
  visibility: Visibility;
  createdAt: number;
  updatedAt: number;
}

// Recurring Rule
export interface RecurringRule {
  id: UUID;
  calendarEntryId?: UUID;
  type: RuleType;
  pattern: string; // RRULE format
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601 (optional)
  exceptions: string[]; // excluded dates (ISO 8601)
  frequency: number; // every N days/weeks/months
  createdAt: number;
  updatedAt: number;
}

// Conflict Rule
export interface ConflictRule {
  id: UUID;
  name: string;
  triggerType: ConflictTriggerType;
  condition: Record<string, any>; // date range, holiday reference, etc.
  regions: string[];
  blockedGroups: UUID[];
  severity: Severity;
  createdAt: number;
  updatedAt: number;
}

// Holiday Definition
export interface Holiday {
  id: UUID;
  name: string;
  region: string; // DE, AT, CH, etc.
  type: HolidayType;
  pattern?: string; // RRULE format
  customPeriods?: DateRange[]; // override pattern for specific years
  relatedConflictRules?: UUID[];
  createdAt: number;
  updatedAt: number;
}

// Date Range
export interface DateRange {
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
}

// Storage
export interface CalendarDatabase {
  entries: CalendarEntry[];
  groups: Group[];
  rules: RecurringRule[];
  holidays: Holiday[];
  conflicts: ConflictRule[];
  lastUpdated: number;
}

// API Request/Response Types
export interface CreateEntryRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  type: EventType;
  groups: UUID[];
  ruleId?: UUID;
  region?: string;
}

export interface UpdateEntryRequest extends Partial<CreateEntryRequest> {
  id: UUID;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  color: string;
  members: string[];
  visibility: Visibility;
}

export interface UpdateGroupRequest extends Partial<CreateGroupRequest> {
  id: UUID;
}

export interface CreateRuleRequest {
  type: RuleType;
  pattern: string;
  startDate: string;
  endDate?: string;
  exceptions?: string[];
  frequency: number;
}

export interface CreateHolidayRequest {
  name: string;
  region: string;
  type: HolidayType;
  pattern?: string;
  customPeriods?: DateRange[];
}

export interface ConflictDetectionResult {
  entryId: UUID;
  conflicts: {
    rule: ConflictRule;
    severity: Severity;
  }[];
}

export interface FilterOptions {
  dateRange?: DateRange;
  groups?: UUID[];
  types?: EventType[];
  regions?: string[];
  statuses?: EntryStatus[];
}

export function createUUID(val: string): UUID {
  return val as UUID;
}
