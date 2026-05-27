import React, { useState } from 'react';
import { Group, formatDate } from '@vereinskalender/shared';
import '../App.css';
import './EventForm.css';

interface EventFormProps {
  groups: Group[];
  selectedDate: Date;
  onSave: (data: any) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({
  groups,
  selectedDate,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(formatDate(selectedDate));
  const [endDate, setEndDate] = useState(formatDate(selectedDate));
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [region, setRegion] = useState('DE');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState('');

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || selectedGroups.length === 0) {
      alert('Bitte Titel und mindestens eine Gruppe eingeben');
      return;
    }
    onSave({
      title,
      description,
      startDate,
      endDate,
      groups: selectedGroups,
      region,
      isRecurring,
      recurrencePattern,
    });
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Neuer Eintrag</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label>Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Team Meeting"
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Weitere Informationen..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Startdatum *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Enddatum *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Region</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="DE">Deutschland</option>
              <option value="AT">Österreich</option>
              <option value="CH">Schweiz</option>
              <option value="">Keine Region</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Wiederkehrend
            </label>
          </div>

          {isRecurring && (
            <div className="form-group">
              <label>Wiederholungsmuster</label>
              <select value={recurrencePattern} onChange={(e) => setRecurrencePattern(e.target.value)}>
                <option value="">Wählen Sie ein Muster...</option>
                <option value="FREQ=WEEKLY;BYDAY=MO">Jeden Montag</option>
                <option value="FREQ=WEEKLY;BYDAY=TU">Jeden Dienstag</option>
                <option value="FREQ=WEEKLY;BYDAY=WE">Jeden Mittwoch</option>
                <option value="FREQ=WEEKLY;BYDAY=TH">Jeden Donnerstag</option>
                <option value="FREQ=WEEKLY;BYDAY=FR">Jeden Freitag</option>
                <option value="FREQ=WEEKLY;BYDAY=MO,WE,FR">Mo, Mi, Fr</option>
                <option value="FREQ=MONTHLY;BYMONTHDAY=1">1. des Monats</option>
                <option value="FREQ=MONTHLY;BYMONTHDAY=15">15. des Monats</option>
                <option value="FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1">Jährlich (1. Januar)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Gruppen * ({selectedGroups.length})</label>
            <div className="group-checkboxes">
              {groups.length === 0 ? (
                <p className="text-muted text-sm">Keine Gruppen verfügbar</p>
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
                    <span>{group.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
