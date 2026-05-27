import React, { useState } from 'react';
import { Holiday, CreateHolidayRequest, HolidayType, UUID } from '@vereinskalender/shared';
import './HolidayManager.css';

interface HolidayManagerProps {
  holidays: Holiday[];
  onAddHoliday: (holiday: CreateHolidayRequest) => void;
  onDeleteHoliday: (id: UUID) => void;
}

const REGIONS = ['DE', 'AT', 'CH'];

const HolidayManager: React.FC<HolidayManagerProps> = ({
  holidays,
  onAddHoliday,
  onDeleteHoliday,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateHolidayRequest>({
    name: '',
    region: 'DE',
    type: 'fixed',
    pattern: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
  });
  const [selectedRegion, setSelectedRegion] = useState('DE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Feiertagsname erforderlich');
      return;
    }
    onAddHoliday(formData);
    setFormData({
      name: '',
      region: 'DE',
      type: 'fixed',
      pattern: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
    });
    setShowForm(false);
  };

  const handleDelete = (id: UUID) => {
    if (confirm('Diesen Feiertag wirklich löschen?')) {
      onDeleteHoliday(id);
    }
  };

  const filterByRegion = (region: string) => {
    return holidays.filter((h) => h.region === region);
  };

  return (
    <div className="holiday-manager">
      <div className="manager-header">
        <h2>Feiertagsverwaltung</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Neuer Feiertag
        </button>
      </div>

      <div className="region-tabs">
        {REGIONS.map((region) => (
          <button
            key={region}
            className={`region-tab ${selectedRegion === region ? 'active' : ''}`}
            onClick={() => setSelectedRegion(region)}
          >
            {region === 'DE'
              ? 'Deutschland'
              : region === 'AT'
              ? 'Österreich'
              : 'Schweiz'}{' '}
            ({filterByRegion(region).length})
          </button>
        ))}
      </div>

      <div className="holiday-list">
        {filterByRegion(selectedRegion).length === 0 ? (
          <p className="text-muted">Keine Feiertage für diese Region</p>
        ) : (
          filterByRegion(selectedRegion).map((holiday) => (
            <div key={holiday.id} className="holiday-item">
              <div className="holiday-info">
                <h3>{holiday.name}</h3>
                <p className="text-sm text-muted">{holiday.type}</p>
                {holiday.pattern && (
                  <p className="text-sm text-muted">Pattern: {holiday.pattern}</p>
                )}
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(holiday.id)}
              >
                Löschen
              </button>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Neuer Feiertag</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Feiertagsname *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="z.B. Weihnachten"
                />
              </div>

              <div className="form-group">
                <label>Region *</label>
                <select
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                >
                  <option value="DE">Deutschland</option>
                  <option value="AT">Österreich</option>
                  <option value="CH">Schweiz</option>
                </select>
              </div>

              <div className="form-group">
                <label>Typ *</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as HolidayType,
                    })
                  }
                >
                  <option value="fixed">Fix (gleiches Datum jährlich)</option>
                  <option value="floating">Beweglich (z.B. Ostern)</option>
                  <option value="regional">Regional (nur für diese Region)</option>
                </select>
              </div>

              <div className="form-group">
                <label>RRULE Pattern</label>
                <input
                  type="text"
                  value={formData.pattern || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, pattern: e.target.value })
                  }
                  placeholder="FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25"
                />
                <p className="text-sm text-muted">
                  Format: FREQ=YEARLY;BYMONTH=mm;BYMONTHDAY=dd
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Abbrechen
                </button>
                <button type="submit" className="btn btn-primary">
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayManager;
