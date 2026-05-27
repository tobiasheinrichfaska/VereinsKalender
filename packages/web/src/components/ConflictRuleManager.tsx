import React, { useState } from 'react';
import {
  ConflictRule,
  Group,
  Severity,
  UUID,
} from '@vereinskalender/shared';
import './ConflictRuleManager.css';

interface ConflictRuleManagerProps {
  conflicts: ConflictRule[];
  groups: Group[];
  onAddRule: (rule: ConflictRule) => void;
  onDeleteRule: (id: UUID) => void;
}

const ConflictRuleManager: React.FC<ConflictRuleManagerProps> = ({
  conflicts,
  groups,
  onAddRule,
  onDeleteRule,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'dateRange' as const,
    regions: [] as string[],
    blockedGroups: [] as UUID[],
    severity: 'soft' as Severity,
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.regions.length === 0) {
      alert('Name und mindestens eine Region erforderlich');
      return;
    }

    const newRule: ConflictRule = {
      id: Math.random().toString(36).substr(2, 9) as UUID,
      name: formData.name,
      triggerType: formData.triggerType,
      condition: {
        startDate: formData.startDate,
        endDate: formData.endDate,
      },
      regions: formData.regions,
      blockedGroups: formData.blockedGroups,
      severity: formData.severity,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onAddRule(newRule);
    setFormData({
      name: '',
      triggerType: 'dateRange',
      regions: [],
      blockedGroups: [],
      severity: 'soft',
      startDate: '',
      endDate: '',
    });
    setShowForm(false);
  };

  const handleDelete = (id: UUID) => {
    if (confirm('Diese Regel wirklich löschen?')) {
      onDeleteRule(id);
    }
  };

  const handleRegionToggle = (region: string) => {
    setFormData((prev) => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region],
    }));
  };

  const handleGroupToggle = (groupId: UUID) => {
    setFormData((prev) => ({
      ...prev,
      blockedGroups: prev.blockedGroups.includes(groupId)
        ? prev.blockedGroups.filter((g) => g !== groupId)
        : [...prev.blockedGroups, groupId],
    }));
  };

  return (
    <div className="conflict-manager">
      <div className="manager-header">
        <h2>Konfliktregeln</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Neue Regel
        </button>
      </div>

      <div className="rules-list">
        {conflicts.length === 0 ? (
          <p className="text-muted">Keine Konfliktregeln vorhanden</p>
        ) : (
          conflicts.map((rule) => (
            <div key={rule.id} className="rule-item">
              <div className="rule-info">
                <h3>{rule.name}</h3>
                <div className="rule-details">
                  <span className="badge badge-secondary">{rule.severity}</span>
                  <span className="badge badge-primary">{rule.triggerType}</span>
                  <span className="text-sm text-muted">
                    Regionen: {rule.regions.join(', ')}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(rule.id)}
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
              <h2>Neue Konflikt Regel</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Regelname *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="z.B. Weihnachtspause"
                />
              </div>

              <div className="form-group">
                <label>Trigger Typ *</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      triggerType: e.target.value as any,
                    })
                  }
                >
                  <option value="dateRange">Datumsbereich</option>
                  <option value="holiday">Feiertag</option>
                  <option value="custom">Benutzerdefiniert</option>
                </select>
              </div>

              {formData.triggerType === 'dateRange' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Startdatum</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Enddatum</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Regionen *</label>
                <div className="checkbox-group">
                  {['DE', 'AT', 'CH'].map((region) => (
                    <label key={region} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.regions.includes(region)}
                        onChange={() => handleRegionToggle(region)}
                      />
                      {region === 'DE'
                        ? 'Deutschland'
                        : region === 'AT'
                        ? 'Österreich'
                        : 'Schweiz'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Betroffene Gruppen</label>
                <div className="checkbox-group">
                  {groups.map((group) => (
                    <label key={group.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.blockedGroups.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Schweregrad *</label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      severity: e.target.value as Severity,
                    })
                  }
                >
                  <option value="soft">Warnung (soft)</option>
                  <option value="hard">Blockieren (hard)</option>
                </select>
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

export default ConflictRuleManager;
