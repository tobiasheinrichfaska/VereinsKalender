import { Holiday, UUID, createUUID } from './types';

// Easter calculation using Anonymous Gregorian algorithm
export function calculateEasterDate(year: number): Date {
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

// Compute Easter-dependent holidays
export function getEasterDependentHolidays(year: number): Record<string, Date> {
  const easter = calculateEasterDate(year);
  const easterTime = easter.getTime();

  return {
    goodFriday: new Date(easterTime - 2 * 24 * 60 * 60 * 1000),
    easterSunday: easter,
    easterMonday: new Date(easterTime + 1 * 24 * 60 * 60 * 1000),
    ascensionDay: new Date(easterTime + 39 * 24 * 60 * 60 * 1000),
    whitMonday: new Date(easterTime + 50 * 24 * 60 * 60 * 1000),
    corpusChristi: new Date(easterTime + 60 * 24 * 60 * 60 * 1000),
  };
}

export interface GermanHolidayConfig {
  id: string;
  nameDE: string;
  nameEN: string;
  type: 'fixed' | 'easter' | 'region-specific';
  description: string;
  fixedDate?: { month: number; day: number }; // for fixed holidays
  easterOffset?: number; // days after Easter (can be negative)
  regions: ('DE' | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV' | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH')[];
  pattern?: string; // RRULE for storage
}

export const GERMAN_HOLIDAYS: GermanHolidayConfig[] = [
  // Fixed holidays (nationwide)
  {
    id: 'neujahrstag',
    nameDE: 'Neujahrstag',
    nameEN: 'New Year\'s Day',
    type: 'fixed',
    description: 'Der erste Tag des Jahres',
    fixedDate: { month: 1, day: 1 },
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    pattern: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
  },
  {
    id: 'tag-der-arbeit',
    nameDE: 'Tag der Arbeit',
    nameEN: 'Labour Day',
    type: 'fixed',
    description: 'Internationaler Arbeitertag',
    fixedDate: { month: 5, day: 1 },
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    pattern: 'FREQ=YEARLY;BYMONTH=5;BYMONTHDAY=1',
  },
  {
    id: 'tag-der-deutschen-einheit',
    nameDE: 'Tag der Deutschen Einheit',
    nameEN: 'German Unity Day',
    type: 'fixed',
    description: 'Erinnerung an die Deutsche Wiedervereinigung',
    fixedDate: { month: 10, day: 3 },
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    pattern: 'FREQ=YEARLY;BYMONTH=10;BYMONTHDAY=3',
  },
  {
    id: 'weihnachtstag',
    nameDE: 'Weihnachtstag',
    nameEN: 'Christmas Day',
    type: 'fixed',
    description: 'Weihnachtsfest',
    fixedDate: { month: 12, day: 25 },
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    pattern: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25',
  },
  {
    id: 'zweiter-weihnachtstag',
    nameDE: 'Zweiter Weihnachtstag',
    nameEN: 'Second Day of Christmas',
    type: 'fixed',
    description: 'Zweiter Weihnachtsfeiertag',
    fixedDate: { month: 12, day: 26 },
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
    pattern: 'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=26',
  },

  // Easter-dependent holidays (nationwide)
  {
    id: 'karfreitag',
    nameDE: 'Karfreitag',
    nameEN: 'Good Friday',
    type: 'easter',
    description: 'Freitag vor dem Ostersonntag (2 Tage vor Ostern)',
    easterOffset: -2,
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
  },
  {
    id: 'ostermontag',
    nameDE: 'Ostermontag',
    nameEN: 'Easter Monday',
    type: 'easter',
    description: 'Montag nach dem Ostersonntag (1 Tag nach Ostern)',
    easterOffset: 1,
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
  },
  {
    id: 'himmelfahrt',
    nameDE: 'Himmelfahrtstag',
    nameEN: 'Ascension Day',
    type: 'easter',
    description: 'Himmelfahrt (39 Tage nach Ostern)',
    easterOffset: 39,
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
  },
  {
    id: 'pfingstmontag',
    nameDE: 'Pfingstmontag',
    nameEN: 'Whit Monday',
    type: 'easter',
    description: 'Montag nach Pfingsten (50 Tage nach Ostern)',
    easterOffset: 50,
    regions: ['DE', 'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'],
  },

  // Regional holidays
  {
    id: 'epiphanie',
    nameDE: 'Epiphanie / Heilige Drei Könige',
    nameEN: 'Epiphany',
    type: 'region-specific',
    description: 'Feiertag in Baden-Württemberg, Bayern und Sachsen-Anhalt',
    fixedDate: { month: 1, day: 6 },
    regions: ['BW', 'BY', 'SN', 'SH'],
    pattern: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=6',
  },
  {
    id: 'fronleichnam',
    nameDE: 'Fronleichnam / Corpus Christi',
    nameEN: 'Corpus Christi',
    type: 'easter',
    description: 'Feiertag in Baden-Württemberg, Bayern, Hessen, Nordrhein-Westfalen, Rheinland-Pfalz und im Saarland (60 Tage nach Ostern)',
    easterOffset: 60,
    regions: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL'],
  },
  {
    id: 'augsburger-friedensfest',
    nameDE: 'Augsburger Friedensfest',
    nameEN: 'Augsburg Peace Celebration',
    type: 'region-specific',
    description: 'Feiertag nur in Augsburg (Stadt), Bayern',
    fixedDate: { month: 8, day: 8 },
    regions: ['BY'],
    pattern: 'FREQ=YEARLY;BYMONTH=8;BYMONTHDAY=8',
  },
  {
    id: 'allerheiligen',
    nameDE: 'Allerheiligen',
    nameEN: 'All Saints\' Day',
    type: 'region-specific',
    description: 'Feiertag in Baden-Württemberg, Bayern, Nordrhein-Westfalen, Rheinland-Pfalz und im Saarland',
    fixedDate: { month: 11, day: 1 },
    regions: ['BW', 'BY', 'NW', 'RP', 'SL'],
    pattern: 'FREQ=YEARLY;BYMONTH=11;BYMONTHDAY=1',
  },
  {
    id: 'reformationstag',
    nameDE: 'Reformationstag',
    nameEN: 'Reformation Day',
    type: 'region-specific',
    description: 'Feiertag in Brandenburg, Bremen, Hamburg, Mecklenburg-Vorpommern, Niedersachsen, Sachsen, Sachsen-Anhalt, Schleswig-Holstein und Thüringen',
    fixedDate: { month: 10, day: 31 },
    regions: ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH'],
    pattern: 'FREQ=YEARLY;BYMONTH=10;BYMONTHDAY=31',
  },
  {
    id: 'bubetag',
    nameDE: 'Buß- und Bettag',
    nameEN: 'Repentance and Prayer Day',
    type: 'region-specific',
    description: 'Mittwoch vor dem letzten Sonntag im November (regionaler Feiertag in mehreren Bundesländern)',
    easterOffset: null,
    regions: ['BW', 'BY', 'HE', 'NW', 'RP', 'SL', 'SN'],
  },
];

export const REGION_NAMES: Record<string, string> = {
  DE: 'Deutschland (Bund)',
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  BE: 'Berlin',
  BB: 'Brandenburg',
  HB: 'Bremen',
  HH: 'Hamburg',
  HE: 'Hessen',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein',
  TH: 'Thüringen',
};

export type RegionCode = keyof typeof REGION_NAMES;

// Convert holiday config to Holiday object
export function holidayConfigToHoliday(
  config: GermanHolidayConfig,
  region: string
): Holiday {
  return {
    id: createUUID(`holiday-${config.id}-${region}`),
    name: config.nameDE,
    region,
    type: config.type === 'easter' ? 'floating' : config.type === 'region-specific' ? 'regional' : 'fixed',
    pattern: config.pattern,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Get applicable holidays for a region
export function getHolidaysForRegion(region: string): GermanHolidayConfig[] {
  return GERMAN_HOLIDAYS.filter(h => h.regions.includes(region as any));
}

// Get all unique holidays that apply to any German region
export function getAllGermanHolidays(): GermanHolidayConfig[] {
  return GERMAN_HOLIDAYS;
}
