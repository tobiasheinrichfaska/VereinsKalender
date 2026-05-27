import { useState, useCallback, useEffect } from 'react';
import {
  CalendarEntry,
  Group,
  RecurringRule,
  Holiday,
  ConflictRule,
  FilterOptions,
  UUID,
  CreateEntryRequest,
  CreateGroupRequest,
  CreateRuleRequest,
  CreateHolidayRequest,
  generateUUID,
  filterEntries,
  detectConflicts,
} from '@vereinskalender/shared';
import { storage } from './storage';

export function useCalendar() {
  const [entries, setEntries] = useState<CalendarEntry[]>(() =>
    storage.getEntries()
  );
  const [groups, setGroups] = useState<Group[]>(() => storage.getGroups());
  const [rules, setRules] = useState<RecurringRule[]>(() => storage.getRules());
  const [holidays, setHolidays] = useState<Holiday[]>(() =>
    storage.getHolidays()
  );
  const [conflicts, setConflicts] = useState<ConflictRule[]>(() =>
    storage.getConflictRules()
  );

  const addEntry = useCallback(
    (entry: CreateEntryRequest): CalendarEntry => {
      const newEntry: CalendarEntry = {
        id: generateUUID(),
        ...entry,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.addEntry(newEntry);
      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    []
  );

  const updateEntry = useCallback((entry: CalendarEntry) => {
    const updated = { ...entry, updatedAt: Date.now() };
    storage.updateEntry(updated);
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? updated : e))
    );
  }, []);

  const deleteEntry = useCallback((id: UUID) => {
    storage.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addGroup = useCallback(
    (group: CreateGroupRequest): Group => {
      const newGroup: Group = {
        id: generateUUID(),
        ...group,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.addGroup(newGroup);
      setGroups((prev) => [...prev, newGroup]);
      return newGroup;
    },
    []
  );

  const updateGroup = useCallback((group: Group) => {
    const updated = { ...group, updatedAt: Date.now() };
    storage.updateGroup(updated);
    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? updated : g))
    );
  }, []);

  const deleteGroup = useCallback((id: UUID) => {
    storage.deleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        groups: e.groups.filter((g) => g !== id),
      }))
    );
  }, []);

  const addRule = useCallback(
    (rule: CreateRuleRequest): RecurringRule => {
      const newRule: RecurringRule = {
        id: generateUUID(),
        ...rule,
        exceptions: rule.exceptions || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.addRule(newRule);
      setRules((prev) => [...prev, newRule]);
      return newRule;
    },
    []
  );

  const addHoliday = useCallback(
    (holiday: CreateHolidayRequest): Holiday => {
      const newHoliday: Holiday = {
        id: generateUUID(),
        ...holiday,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.addHoliday(newHoliday);
      setHolidays((prev) => [...prev, newHoliday]);
      return newHoliday;
    },
    []
  );

  const deleteHoliday = useCallback((id: UUID) => {
    storage.deleteHoliday(id);
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const addConflictRule = useCallback(
    (rule: ConflictRule): ConflictRule => {
      storage.addConflictRule(rule);
      setConflicts((prev) => [...prev, rule]);
      return rule;
    },
    []
  );

  const deleteConflictRule = useCallback((id: UUID) => {
    storage.deleteConflictRule(id);
    setConflicts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const filterCalendar = useCallback(
    (options: FilterOptions): CalendarEntry[] => {
      return filterEntries(entries, options);
    },
    [entries]
  );

  const getGroupName = useCallback(
    (id: UUID): string => {
      return groups.find((g) => g.id === id)?.name || 'Unknown';
    },
    [groups]
  );

  const getGroupColor = useCallback(
    (id: UUID): string => {
      return groups.find((g) => g.id === id)?.color || '#ccc';
    },
    [groups]
  );

  const checkConflicts = useCallback(
    (entry: CalendarEntry) => {
      const relevant = conflicts.filter(
        (c) =>
          !entry.region || c.regions.includes(entry.region) || c.regions.length === 0
      );
      return detectConflicts(entry, relevant);
    },
    [conflicts]
  );

  return {
    entries,
    groups,
    rules,
    holidays,
    conflicts,
    addEntry,
    updateEntry,
    deleteEntry,
    addGroup,
    updateGroup,
    deleteGroup,
    addRule,
    addHoliday,
    deleteHoliday,
    addConflictRule,
    deleteConflictRule,
    filterCalendar,
    getGroupName,
    getGroupColor,
    checkConflicts,
  };
}
