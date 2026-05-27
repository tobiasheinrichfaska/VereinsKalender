import {
  CalendarDatabase,
  CalendarEntry,
  Group,
  RecurringRule,
  Holiday,
  ConflictRule,
  UUID,
} from '@vereinskalender/shared';

const STORAGE_KEY = 'vereinskalender_db';
const DEFAULT_DB: CalendarDatabase = {
  entries: [],
  groups: [],
  rules: [],
  holidays: [],
  conflicts: [],
  lastUpdated: Date.now(),
};

export class Storage {
  private db: CalendarDatabase;

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): CalendarDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CalendarDatabase;
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DB)) as CalendarDatabase;
  }

  private saveToStorage(): void {
    this.db.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
  }

  // Calendar entries
  getEntries(): CalendarEntry[] {
    return this.db.entries;
  }

  getEntry(id: UUID): CalendarEntry | undefined {
    return this.db.entries.find((e) => e.id === id);
  }

  addEntry(entry: CalendarEntry): void {
    this.db.entries.push(entry);
    this.saveToStorage();
  }

  updateEntry(entry: CalendarEntry): void {
    const index = this.db.entries.findIndex((e) => e.id === entry.id);
    if (index !== -1) {
      this.db.entries[index] = entry;
      this.saveToStorage();
    }
  }

  deleteEntry(id: UUID): void {
    this.db.entries = this.db.entries.filter((e) => e.id !== id);
    this.saveToStorage();
  }

  // Groups
  getGroups(): Group[] {
    return this.db.groups;
  }

  getGroup(id: UUID): Group | undefined {
    return this.db.groups.find((g) => g.id === id);
  }

  addGroup(group: Group): void {
    this.db.groups.push(group);
    this.saveToStorage();
  }

  updateGroup(group: Group): void {
    const index = this.db.groups.findIndex((g) => g.id === group.id);
    if (index !== -1) {
      this.db.groups[index] = group;
      this.saveToStorage();
    }
  }

  deleteGroup(id: UUID): void {
    this.db.groups = this.db.groups.filter((g) => g.id !== id);
    // Remove group from all entries
    this.db.entries = this.db.entries.map((e) => ({
      ...e,
      groups: e.groups.filter((g) => g !== id),
    }));
    this.saveToStorage();
  }

  // Rules
  getRules(): RecurringRule[] {
    return this.db.rules;
  }

  getRule(id: UUID): RecurringRule | undefined {
    return this.db.rules.find((r) => r.id === id);
  }

  addRule(rule: RecurringRule): void {
    this.db.rules.push(rule);
    this.saveToStorage();
  }

  updateRule(rule: RecurringRule): void {
    const index = this.db.rules.findIndex((r) => r.id === rule.id);
    if (index !== -1) {
      this.db.rules[index] = rule;
      this.saveToStorage();
    }
  }

  deleteRule(id: UUID): void {
    this.db.rules = this.db.rules.filter((r) => r.id !== id);
    this.saveToStorage();
  }

  // Holidays
  getHolidays(): Holiday[] {
    return this.db.holidays;
  }

  getHolidaysByRegion(region: string): Holiday[] {
    return this.db.holidays.filter((h) => h.region === region);
  }

  addHoliday(holiday: Holiday): void {
    this.db.holidays.push(holiday);
    this.saveToStorage();
  }

  updateHoliday(holiday: Holiday): void {
    const index = this.db.holidays.findIndex((h) => h.id === holiday.id);
    if (index !== -1) {
      this.db.holidays[index] = holiday;
      this.saveToStorage();
    }
  }

  deleteHoliday(id: UUID): void {
    this.db.holidays = this.db.holidays.filter((h) => h.id !== id);
    this.saveToStorage();
  }

  // Conflict rules
  getConflictRules(): ConflictRule[] {
    return this.db.conflicts;
  }

  getConflictRulesByRegion(region: string): ConflictRule[] {
    return this.db.conflicts.filter((c) => c.regions.includes(region));
  }

  addConflictRule(rule: ConflictRule): void {
    this.db.conflicts.push(rule);
    this.saveToStorage();
  }

  updateConflictRule(rule: ConflictRule): void {
    const index = this.db.conflicts.findIndex((c) => c.id === rule.id);
    if (index !== -1) {
      this.db.conflicts[index] = rule;
      this.saveToStorage();
    }
  }

  deleteConflictRule(id: UUID): void {
    this.db.conflicts = this.db.conflicts.filter((c) => c.id !== id);
    this.saveToStorage();
  }

  // Database operations
  exportDatabase(): CalendarDatabase {
    return JSON.parse(JSON.stringify(this.db)) as CalendarDatabase;
  }

  importDatabase(data: CalendarDatabase): void {
    this.db = JSON.parse(JSON.stringify(data)) as CalendarDatabase;
    this.saveToStorage();
  }

  clear(): void {
    this.db = JSON.parse(JSON.stringify(DEFAULT_DB)) as CalendarDatabase;
    this.saveToStorage();
  }
}

export const storage = new Storage();
