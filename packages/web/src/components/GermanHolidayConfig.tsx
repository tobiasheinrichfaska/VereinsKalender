import React, { useState } from 'react';
import {
  GERMAN_HOLIDAYS,
  REGION_NAMES,
  RegionCode,
  getHolidaysForRegion,
  GermanHolidayConfig,
  calculateEasterDate,
  getEasterDependentHolidays,
  formatDate,
} from '@vereinskalender/shared';
import './GermanHolidayConfig.css';

interface GermanHolidayConfigProps {
  onSelectionChange: (selectedHolidays: GermanHolidayConfig[]) => void;
  preselectedRegion?: string;
}

const GermanHolidayConfig: React.FC<GermanHolidayConfigProps> = ({
  onSelectionChange,
  preselectedRegion = 'DE',
}) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionCode>(preselectedRegion as RegionCode);
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<Set<string>>(
    new Set(getHolidaysForRegion(selectedRegion).map((h) => h.id))
  );
  const [expandedHoliday, setExpandedHoliday] = useState<string | null>(null);
  const [previewYear, setPreviewYear] = useState(new Date().getFullYear());

  const regionHolidays = getHolidaysForRegion(selectedRegion);
  const currentYear = new Date().getFullYear();

  const handleRegionChange = (region: RegionCode) => {
    setSelectedRegion(region);
    const newSelection = new Set(getHolidaysForRegion(region).map((h) => h.id));
    setSelectedHolidayIds(newSelection);
    updateSelection(newSelection);
  };

  const handleHolidayToggle = (holidayId: string) => {
    const newSelection = new Set(selectedHolidayIds);
    if (newSelection.has(holidayId)) {
      newSelection.delete(holidayId);
    } else {
      newSelection.add(holidayId);
    }
    setSelectedHolidayIds(newSelection);
    updateSelection(newSelection);
  };

  const updateSelection = (selection: Set<string>) => {
    const selected = GERMAN_HOLIDAYS.filter((h) => selection.has(h.id));
    onSelectionChange(selected);
  };

  const getHolidayDate = (holiday: GermanHolidayConfig, year: number): Date | null => {
    if (holiday.type === 'fixed' && holiday.fixedDate) {
      return new Date(Date.UTC(year, holiday.fixedDate.month - 1, holiday.fixedDate.day));
    }

    if (holiday.type === 'easter' && holiday.easterOffset !== undefined) {
      const easterDates = getEasterDependentHolidays(year);
      const easterTime = calculateEasterDate(year).getTime();
      return new Date(easterTime + holiday.easterOffset * 24 * 60 * 60 * 1000);
    }

    if (holiday.id === 'bubetag') {
      // Buß- und Bettag: Wednesday before the last Sunday in November
      const lastNov = new Date(Date.UTC(year, 10, 30));
      const lastSunday = lastNov.getUTCDate() - lastNov.getUTCDay();
      const wednesdayBefore = lastSunday - 4;
      return new Date(Date.UTC(year, 10, wednesdayBefore));
    }

    return null;
  };

  const getDateString = (date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '(Berechnung fehlgeschlagen)';
    return formatDate(date);
  };

  const categorizeHolidays = () => {
    const fixed = regionHolidays.filter((h) => h.type === 'fixed');
    const easter = regionHolidays.filter((h) => h.type === 'easter');
    const regional = regionHolidays.filter((h) => h.type === 'region-specific');
    return { fixed, easter, regional };
  };

  const { fixed, easter, regional } = categorizeHolidays();
  const allSelected = selectedHolidayIds.size === regionHolidays.length;
  const noneSelected = selectedHolidayIds.size === 0;

  return (
    <div className="german-holiday-config">
      <div className="header">
        <h2>Deutsche Feiertage konfigurieren</h2>
        <p className="description">Wählen Sie Ihre Region und die gewünschten Feiertage aus</p>
      </div>

      <div className="region-selector">
        <label>Region:</label>
        <select
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value as RegionCode)}
          className="region-select"
        >
          {Object.entries(REGION_NAMES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="selection-controls">
        <button
          className="btn btn-sm"
          onClick={() => {
            const newSelection = new Set(regionHolidays.map((h) => h.id));
            setSelectedHolidayIds(newSelection);
            updateSelection(newSelection);
          }}
          disabled={allSelected}
        >
          Alle auswählen
        </button>
        <button
          className="btn btn-sm"
          onClick={() => {
            const newSelection = new Set<string>();
            setSelectedHolidayIds(newSelection);
            updateSelection(newSelection);
          }}
          disabled={noneSelected}
        >
          Alle abwählen
        </button>
      </div>

      <div className="preview-controls">
        <label>
          Vorschau für Jahr:
          <input
            type="number"
            value={previewYear}
            onChange={(e) => setPreviewYear(parseInt(e.target.value) || currentYear)}
            min={currentYear - 5}
            max={currentYear + 5}
          />
        </label>
      </div>

      <div className="holidays-list">
        {fixed.length > 0 && (
          <div className="holiday-category">
            <h3 className="category-title">Feste Feiertage</h3>
            <div className="holiday-items">
              {fixed.map((holiday) => (
                <HolidayItem
                  key={holiday.id}
                  holiday={holiday}
                  isSelected={selectedHolidayIds.has(holiday.id)}
                  onToggle={() => handleHolidayToggle(holiday.id)}
                  isExpanded={expandedHoliday === holiday.id}
                  onToggleExpanded={() =>
                    setExpandedHoliday(expandedHoliday === holiday.id ? null : holiday.id)
                  }
                  previewDate={getHolidayDate(holiday, previewYear)}
                />
              ))}
            </div>
          </div>
        )}

        {easter.length > 0 && (
          <div className="holiday-category">
            <h3 className="category-title">Ostern-abhängige Feiertage</h3>
            <div className="holiday-items">
              {easter.map((holiday) => (
                <HolidayItem
                  key={holiday.id}
                  holiday={holiday}
                  isSelected={selectedHolidayIds.has(holiday.id)}
                  onToggle={() => handleHolidayToggle(holiday.id)}
                  isExpanded={expandedHoliday === holiday.id}
                  onToggleExpanded={() =>
                    setExpandedHoliday(expandedHoliday === holiday.id ? null : holiday.id)
                  }
                  previewDate={getHolidayDate(holiday, previewYear)}
                />
              ))}
            </div>
          </div>
        )}

        {regional.length > 0 && (
          <div className="holiday-category">
            <h3 className="category-title">Regionale Feiertage</h3>
            <div className="holiday-items">
              {regional.map((holiday) => (
                <HolidayItem
                  key={holiday.id}
                  holiday={holiday}
                  isSelected={selectedHolidayIds.has(holiday.id)}
                  onToggle={() => handleHolidayToggle(holiday.id)}
                  isExpanded={expandedHoliday === holiday.id}
                  onToggleExpanded={() =>
                    setExpandedHoliday(expandedHoliday === holiday.id ? null : holiday.id)
                  }
                  previewDate={getHolidayDate(holiday, previewYear)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="summary">
        <strong>{selectedHolidayIds.size}</strong> von <strong>{regionHolidays.length}</strong> Feiertagen ausgewählt
      </div>
    </div>
  );
};

interface HolidayItemProps {
  holiday: GermanHolidayConfig;
  isSelected: boolean;
  onToggle: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  previewDate: Date | null;
}

const HolidayItem: React.FC<HolidayItemProps> = ({
  holiday,
  isSelected,
  onToggle,
  isExpanded,
  onToggleExpanded,
  previewDate,
}) => {
  return (
    <div className={`holiday-item ${isSelected ? 'selected' : ''}`}>
      <div className="holiday-header">
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="holiday-checkbox"
          />
          <span className="holiday-name">{holiday.nameDE}</span>
        </label>
        <button
          className="expand-btn"
          onClick={onToggleExpanded}
          title={isExpanded ? 'Einklappen' : 'Ausklappen'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="holiday-details">
          <p className="description">{holiday.description}</p>
          {holiday.nameEN && (
            <p className="english-name">
              <strong>English:</strong> {holiday.nameEN}
            </p>
          )}
          {previewDate && (
            <p className="date-preview">
              <strong>Datum {new Date().getFullYear()}:</strong>{' '}
              <code>{formatDate(previewDate)}</code>
            </p>
          )}
          {holiday.pattern && (
            <p className="pattern">
              <strong>RRULE:</strong> <code>{holiday.pattern}</code>
            </p>
          )}
          <div className="applicable-regions">
            <strong>In diesen Regionen:</strong>
            <div className="region-tags">
              {holiday.regions.map((region) => (
                <span key={region} className="region-tag">
                  {region}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GermanHolidayConfig;
