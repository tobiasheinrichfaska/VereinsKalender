import React, { useState } from 'react';
import './RuleBuilder.css';

interface RuleBuilderProps {
  onPatternChange: (pattern: string) => void;
  presets?: boolean;
}

const MONTHS = [
  { num: 1, name: 'Januar' },
  { num: 2, name: 'Februar' },
  { num: 3, name: 'März' },
  { num: 4, name: 'April' },
  { num: 5, name: 'Mai' },
  { num: 6, name: 'Juni' },
  { num: 7, name: 'Juli' },
  { num: 8, name: 'August' },
  { num: 9, name: 'September' },
  { num: 10, name: 'Oktober' },
  { num: 11, name: 'November' },
  { num: 12, name: 'Dezember' },
];

const WEEKDAYS = [
  { key: 'MO', name: 'Montag' },
  { key: 'TU', name: 'Dienstag' },
  { key: 'WE', name: 'Mittwoch' },
  { key: 'TH', name: 'Donnerstag' },
  { key: 'FR', name: 'Freitag' },
  { key: 'SA', name: 'Samstag' },
  { key: 'SU', name: 'Sonntag' },
];

const OCCURRENCES = [
  { value: 1, label: 'Erstes' },
  { value: 2, label: 'Zweites' },
  { value: 3, label: 'Drittes' },
  { value: 4, label: 'Viertes' },
  { value: 5, label: 'Fünftes' },
  { value: -1, label: 'Letztes' },
];

const RuleBuilder: React.FC<RuleBuilderProps> = ({ onPatternChange, presets = true }) => {
  const [ruleType, setRuleType] = useState('nth_weekday_months');
  const [occurrence, setOccurrence] = useState(1);
  const [weekday, setWeekday] = useState('TH');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 3, 5]);
  const [skipHolidays, setSkipHolidays] = useState(false);

  const generatePattern = () => {
    if (ruleType === 'nth_weekday_months') {
      const months = selectedMonths.sort((a, b) => a - b).join(',');
      const nth = occurrence === -1 ? 'LAST' : occurrence;
      const skip = skipHolidays ? ';SKIP_HOLIDAYS=true' : '';
      const pattern = `SMART:NTH_WEEKDAY=${nth};WEEKDAY=${weekday};MONTHS=${months}${skip}`;
      onPatternChange(pattern);
    }
  };

  const handleMonthToggle = (month: number) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const selectAllMonths = () => setSelectedMonths(MONTHS.map((m) => m.num));
  const clearMonths = () => setSelectedMonths([]);

  React.useEffect(() => {
    generatePattern();
  }, [ruleType, occurrence, weekday, selectedMonths, skipHolidays]);

  const weekdayName = WEEKDAYS.find((w) => w.key === weekday)?.name || '';
  const occurrenceName = OCCURRENCES.find((o) => o.value === occurrence)?.label || '';
  const monthNames = selectedMonths
    .sort((a, b) => a - b)
    .map((m) => MONTHS.find((mon) => mon.num === m)?.name)
    .join(', ');

  return (
    <div className="rule-builder">
      <div className="rule-type-selector">
        <label>Wiederholungstyp:</label>
        <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
          <option value="nth_weekday_months">Nth Wochentag in ausgewählten Monaten</option>
          <option value="custom">Benutzerdefiniertes RRULE-Format</option>
        </select>
      </div>

      {ruleType === 'nth_weekday_months' && (
        <>
          <div className="rule-config">
            <div className="config-row">
              <div className="form-group">
                <label>Vorkommen:</label>
                <select value={occurrence} onChange={(e) => setOccurrence(parseInt(e.target.value))}>
                  {OCCURRENCES.map((occ) => (
                    <option key={occ.value} value={occ.value}>
                      {occ.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Wochentag:</label>
                <select value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                  {WEEKDAYS.map((day) => (
                    <option key={day.key} value={day.key}>
                      {day.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Monate auswählen:</label>
              <div className="month-selector">
                <div className="month-controls">
                  <button type="button" className="btn btn-sm" onClick={selectAllMonths}>
                    Alle
                  </button>
                  <button type="button" className="btn btn-sm" onClick={clearMonths}>
                    Keine
                  </button>
                </div>
                <div className="month-grid">
                  {MONTHS.map((month) => (
                    <label key={month.num} className="month-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month.num)}
                        onChange={() => handleMonthToggle(month.num)}
                      />
                      {month.name.substring(0, 3)}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={skipHolidays}
                  onChange={(e) => setSkipHolidays(e.target.checked)}
                />
                Feiertage überspringen
              </label>
            </div>
          </div>

          <div className="rule-preview">
            <strong>Regel:</strong>
            <p>
              Jedes {occurrenceName} {weekdayName} in: {monthNames}
              {skipHolidays && ' (Feiertage überspringt)'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default RuleBuilder;
