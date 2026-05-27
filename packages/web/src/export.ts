import { CalendarEntry, Group, formatDate } from '@vereinskalender/shared';

// iCalendar (ICS) export
export function exportToICS(entries: CalendarEntry[], groups: Map<string, Group>): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VereinsKalender//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const entry of entries) {
    if (entry.status !== 'active') continue;

    const startDate = entry.startDate.replace(/-/g, '');
    const endDate = entry.endDate.replace(/-/g, '');
    const created = new Date(entry.createdAt).toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z';

    const groupNames = entry.groups
      .map((gid) => groups.get(gid)?.name || '')
      .filter(Boolean)
      .join(', ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${entry.id}@vereinskalender.local`);
    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    lines.push(`DTEND;VALUE=DATE:${endDate}`);
    lines.push(`SUMMARY:${escapeICS(entry.title)}`);
    if (entry.description) {
      lines.push(`DESCRIPTION:${escapeICS(entry.description)}`);
    }
    if (groupNames) {
      lines.push(`CATEGORIES:${groupNames}`);
    }
    lines.push(`CREATED:${created}`);
    lines.push(`LAST-MODIFIED:${created}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

// CSV export
export function exportToCSV(entries: CalendarEntry[], groups: Map<string, Group>): string {
  const headers = ['ID', 'Titel', 'Beschreibung', 'Startdatum', 'Enddatum', 'Typ', 'Gruppen', 'Region', 'Status'];
  const rows: string[][] = [];

  for (const entry of entries) {
    const groupNames = entry.groups
      .map((gid) => groups.get(gid)?.name || '')
      .filter(Boolean)
      .join('; ');

    rows.push([
      entry.id,
      escapeCsv(entry.title),
      escapeCsv(entry.description),
      entry.startDate,
      entry.endDate,
      entry.type,
      escapeCsv(groupNames),
      entry.region || '',
      entry.status,
    ]);
  }

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

function escapeCsv(str: string): string {
  return str.replace(/"/g, '""');
}

// Download helpers
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCalendarToICS(entries: CalendarEntry[], groups: Group[]): void {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const ics = exportToICS(entries, groupMap);
  const filename = `vereinskalender_${formatDate(new Date())}.ics`;
  downloadFile(ics, filename, 'text/calendar;charset=utf-8');
}

export function exportCalendarToCSV(entries: CalendarEntry[], groups: Group[]): void {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const csv = exportToCSV(entries, groupMap);
  const filename = `vereinskalender_${formatDate(new Date())}.csv`;
  downloadFile(csv, filename, 'text/csv;charset=utf-8');
}

export function exportDatabase(
  entries: CalendarEntry[],
  groups: Group[],
  format: 'ics' | 'csv'
): void {
  if (format === 'ics') {
    exportCalendarToICS(entries, groups);
  } else {
    exportCalendarToCSV(entries, groups);
  }
}
