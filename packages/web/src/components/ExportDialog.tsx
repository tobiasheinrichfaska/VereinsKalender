import React, { useState } from 'react';
import { CalendarEntry, Group } from '@vereinskalender/shared';
import { exportDatabase } from '../export';
import './ExportDialog.css';

interface ExportDialogProps {
  entries: CalendarEntry[];
  groups: Group[];
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ entries, groups, onClose }) => {
  const [format, setFormat] = useState<'ics' | 'csv'>('ics');

  const handleExport = () => {
    exportDatabase(entries, groups, format);
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content export-dialog">
        <div className="modal-header">
          <h2>Kalender exportieren</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="export-info">
          <p>
            Exportieren Sie Ihre Kalenderdaten in eines der folgenden Formate:
          </p>
        </div>

        <div className="format-options">
          <label className="format-option">
            <input
              type="radio"
              value="ics"
              checked={format === 'ics'}
              onChange={(e) => setFormat(e.target.value as 'ics')}
            />
            <div className="format-details">
              <h3>iCalendar (ICS)</h3>
              <p>Standard-Kalenderformat, kompatibel mit Google Calendar, Outlook, etc.</p>
            </div>
          </label>

          <label className="format-option">
            <input
              type="radio"
              value="csv"
              checked={format === 'csv'}
              onChange={(e) => setFormat(e.target.value as 'csv')}
            />
            <div className="format-details">
              <h3>CSV (Comma-Separated Values)</h3>
              <p>Tabellenformat, öffnbar in Excel, Google Sheets, etc.</p>
            </div>
          </label>
        </div>

        <div className="export-stats">
          <p>
            <strong>{entries.length}</strong> Einträge werden exportiert
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export starten
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
