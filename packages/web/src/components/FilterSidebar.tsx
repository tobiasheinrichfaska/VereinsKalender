import React, { useState } from 'react';
import { Group, FilterOptions, formatDate, parseDate } from '@vereinskalender/shared';
import './FilterSidebar.css';

interface FilterSidebarProps {
  groups: Group[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  groups,
  filters,
  onFilterChange,
}) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(filters.groups || []);
  const [startDate, setStartDate] = useState(
    filters.dateRange?.startDate || formatDate(new Date())
  );
  const [endDate, setEndDate] = useState(
    filters.dateRange?.endDate || formatDate(new Date())
  );

  const handleGroupToggle = (groupId: string) => {
    const updated = selectedGroups.includes(groupId)
      ? selectedGroups.filter((g) => g !== groupId)
      : [...selectedGroups, groupId];
    setSelectedGroups(updated);
    onFilterChange({
      ...filters,
      groups: updated,
    });
  };

  const handleDateRangeChange = () => {
    onFilterChange({
      ...filters,
      dateRange: {
        startDate,
        endDate,
      },
    });
  };

  const handleResetFilters = () => {
    setSelectedGroups([]);
    const today = formatDate(new Date());
    setStartDate(today);
    setEndDate(today);
    onFilterChange({
      dateRange: { startDate: today, endDate: today },
      groups: [],
    });
  };

  return (
    <div className="filter-sidebar">
      <div className="filter-section">
        <h3>Zeitraum</h3>
        <div className="form-group">
          <label>Von</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Bis</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleDateRangeChange}>
          Anwenden
        </button>
      </div>

      <div className="filter-section">
        <h3>Gruppen ({selectedGroups.length})</h3>
        <div className="group-list">
          {groups.length === 0 ? (
            <p className="text-muted text-sm">Keine Gruppen erstellt</p>
          ) : (
            groups.map((group) => (
              <label key={group.id} className="group-checkbox">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => handleGroupToggle(group.id)}
                />
                <span
                  className="group-color"
                  style={{ backgroundColor: group.color }}
                />
                <span className="group-name">{group.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {(selectedGroups.length > 0 || startDate !== endDate) && (
        <button className="btn btn-secondary" onClick={handleResetFilters}>
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
};

export default FilterSidebar;
