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

// PDF export (simple text-based PDF)
export function exportToPDF(entries: CalendarEntry[], groups: Map<string, Group>, selectedGroups?: string[]): string {
  const filtered = selectedGroups && selectedGroups.length > 0
    ? entries.filter(e => e.groups.some(g => selectedGroups.includes(g)))
    : entries;

  // Simple PDF structure with minimal text rendering
  const lines: string[] = [];

  // PDF header
  lines.push('%PDF-1.4');
  lines.push('1 0 obj');
  lines.push('<< /Type /Catalog /Pages 2 0 R >>');
  lines.push('endobj');
  lines.push('2 0 obj');
  lines.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  lines.push('endobj');
  lines.push('3 0 obj');
  lines.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>');
  lines.push('endobj');
  lines.push('4 0 obj');

  // Content stream with text
  const contentLines: string[] = [];
  contentLines.push('BT');
  contentLines.push('/F1 14 Tf');
  contentLines.push('50 750 Td');
  contentLines.push('(VereinsKalender Export) Tj');

  contentLines.push('/F1 10 Tf');
  contentLines.push('0 -20 Td');
  contentLines.push(`(Generated: ${new Date().toLocaleDateString()}) Tj`);

  contentLines.push('0 -30 Td');
  let yPos = -30;

  for (const entry of filtered) {
    if (entry.status !== 'active') continue;

    const groupNames = entry.groups
      .map((gid) => groups.get(gid)?.name || '')
      .filter(Boolean)
      .join(', ');

    const timeInfo = entry.startTime && entry.endTime
      ? ` ${entry.startTime}-${entry.endTime}`
      : '';

    contentLines.push(`(${entry.startDate}${timeInfo}: ${entry.title}${groupNames ? ` [${groupNames}]` : ''}) Tj`);
    contentLines.push('0 -15 Td');
    yPos -= 15;
  }

  contentLines.push('ET');

  const content = contentLines.join('\n');
  const contentLength = content.length;

  lines.push(`<< /Length ${contentLength} >>`);
  lines.push('stream');
  lines.push(content);
  lines.push('endstream');
  lines.push('endobj');
  lines.push('5 0 obj');
  lines.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  lines.push('endobj');
  lines.push('xref');
  lines.push('0 6');
  lines.push('0000000000 65535 f ');
  lines.push('0000000009 00000 n ');
  lines.push('0000000056 00000 n ');
  lines.push('0000000115 00000 n ');
  lines.push('0000000229 00000 n ');
  lines.push(`${String(lines.slice(0, -4).join('\n').length).padStart(10, '0')} 00000 n `);
  lines.push('trailer');
  lines.push('<< /Size 6 /Root 1 0 R >>');
  lines.push('startxref');
  lines.push(String(lines.slice(0, -3).join('\n').length));
  lines.push('%%EOF');

  return lines.join('\n');
}

export function exportCalendarToPDF(entries: CalendarEntry[], groups: Group[], selectedGroupIds?: string[]): void {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const pdf = exportToPDF(entries, groupMap, selectedGroupIds);
  const filename = `vereinskalender_${formatDate(new Date())}.pdf`;
  downloadFile(pdf, filename, 'application/pdf;charset=utf-8');
}

export function exportDatabase(
  entries: CalendarEntry[],
  groups: Group[],
  format: 'ics' | 'csv' | 'pdf',
  selectedGroupIds?: string[]
): void {
  if (format === 'ics') {
    exportCalendarToICS(entries, groups);
  } else if (format === 'csv') {
    exportCalendarToCSV(entries, groups);
  } else if (format === 'pdf') {
    exportCalendarToPDF(entries, groups, selectedGroupIds);
  }
}
