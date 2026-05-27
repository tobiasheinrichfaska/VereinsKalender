import React, { useState } from 'react';
import { Group, CreateGroupRequest, Visibility, UUID } from '@vereinskalender/shared';
import './GroupManager.css';

interface GroupManagerProps {
  groups: Group[];
  onAddGroup: (group: CreateGroupRequest) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (id: UUID) => void;
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<UUID | null>(null);
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    color: COLORS[0],
    members: [],
    visibility: 'public',
  });

  const handleAddClick = () => {
    setFormData({
      name: '',
      description: '',
      color: COLORS[0],
      members: [],
      visibility: 'public',
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditClick = (group: Group) => {
    setFormData({
      name: group.name,
      description: group.description,
      color: group.color,
      members: group.members,
      visibility: group.visibility,
    });
    setEditingId(group.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Gruppenname ist erforderlich');
      return;
    }

    if (editingId) {
      const group = groups.find((g) => g.id === editingId);
      if (group) {
        onUpdateGroup({
          ...group,
          ...formData,
          updatedAt: Date.now(),
        });
      }
    } else {
      onAddGroup(formData);
    }

    setShowForm(false);
  };

  const handleDelete = (id: UUID) => {
    if (confirm('Diese Gruppe wirklich löschen?')) {
      onDeleteGroup(id);
    }
  };

  return (
    <div className="group-manager">
      <div className="manager-header">
        <h2>Gruppenverwaltung</h2>
        <button className="btn btn-primary" onClick={handleAddClick}>
          + Neue Gruppe
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted">Keine Gruppen vorhanden. Erstellen Sie eine neue Gruppe!</p>
      ) : (
        <div className="group-grid">
          {groups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-card-header">
                <div className="group-color-circle" style={{ backgroundColor: group.color }} />
                <h3>{group.name}</h3>
              </div>
              <p className="group-description">{group.description}</p>
              <div className="group-meta">
                <span className="badge badge-primary">{group.visibility}</span>
                <span className="text-sm text-muted">{group.members.length} Mitglieder</span>
              </div>
              <div className="group-actions">
                <button
                  className="btn"
                  onClick={() => handleEditClick(group)}
                >
                  Bearbeiten
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(group.id)}
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="group-form">
              <div className="form-group">
                <label>Gruppenname *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Verwaltung"
                />
              </div>

              <div className="form-group">
                <label>Beschreibung</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Kurze Beschreibung..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Farbe</label>
                <div className="color-picker">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${
                        formData.color === color ? 'active' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Sichtbarkeit</label>
                <select
                  value={formData.visibility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visibility: e.target.value as Visibility,
                    })
                  }
                >
                  <option value="public">Öffentlich</option>
                  <option value="private">Privat</option>
                  <option value="restricted">Eingeschränkt</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mitglieder (E-Mails, durch Komma getrennt)</label>
                <textarea
                  value={formData.members.join(',\n')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      members: e.target.value
                        .split('\n')
                        .map((m) => m.trim())
                        .filter((m) => m.length > 0),
                    })
                  }
                  placeholder="example@email.com"
                  rows={4}
                />
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

export default GroupManager;
