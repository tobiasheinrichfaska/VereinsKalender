import React, { useState, useEffect } from 'react';
import { CalendarEntry, Group, ConflictRule, UserPresence } from '@vereinskalender/shared';
import { Analytics } from './Analytics';
import './Dashboard.css';

interface CollaborationIndicator {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  currentView?: string;
}

interface DashboardProps {
  entries: CalendarEntry[];
  groups: Group[];
  conflicts: ConflictRule[];
  collaborators?: CollaborationIndicator[];
}

export function Dashboard({ entries, groups, conflicts, collaborators = [] }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'collaboration'>('overview');
  const onlineUsers = collaborators.filter((c) => c.status === 'online');

  return (
    <div className="dashboard">
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Überblick
        </button>
        <button
          className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analystics
        </button>
        <button
          className={`tab-button ${activeTab === 'collaboration' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaboration')}
        >
          Zusammenarbeit ({onlineUsers.length})
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <DashboardOverview entries={entries} groups={groups} conflicts={conflicts} />
        )}
        {activeTab === 'analytics' && (
          <Analytics entries={entries} groups={groups} conflictCount={conflicts.length} />
        )}
        {activeTab === 'collaboration' && (
          <CollaborationView collaborators={collaborators} />
        )}
      </div>
    </div>
  );
}

function DashboardOverview({
  entries,
  groups,
  conflicts,
}: {
  entries: CalendarEntry[];
  groups: Group[];
  conflicts: ConflictRule[];
}) {
  const upcomingEvents = entries
    .filter((e) => new Date(e.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <div className="dashboard-overview">
      <div className="overview-grid">
        <div className="overview-card">
          <h3>Bevorstehende Ereignisse</h3>
          {upcomingEvents.length === 0 ? (
            <p className="empty-message">Keine bevorstehenden Ereignisse</p>
          ) : (
            <div className="events-list">
              {upcomingEvents.map((event) => {
                const group = groups.find((g) => event.groups.includes(g.id));
                return (
                  <div key={event.id} className="event-item">
                    <div className="event-date">
                      {new Date(event.startDate).toLocaleDateString('de-DE')}
                    </div>
                    <div className="event-details">
                      <div className="event-title">{event.title}</div>
                      {group && <div className="event-group">{group.name}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="overview-card">
          <h3>Konflikte & Warnungen</h3>
          {conflicts.length === 0 ? (
            <p className="empty-message">Keine Konflikte erkannt</p>
          ) : (
            <div className="conflicts-list">
              {conflicts.slice(0, 5).map((conflict) => (
                <div key={conflict.id} className={`conflict-item conflict-${conflict.severity}`}>
                  <span className="conflict-icon">
                    {conflict.severity === 'hard' ? '🚨' : '⚠️'}
                  </span>
                  <div className="conflict-info">
                    <div className="conflict-name">{conflict.name}</div>
                    <div className="conflict-type">{conflict.triggerType}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overview-card">
          <h3>Gruppenaktivität</h3>
          {groups.length === 0 ? (
            <p className="empty-message">Keine Gruppen vorhanden</p>
          ) : (
            <div className="groups-list">
              {groups.slice(0, 5).map((group) => {
                const eventCount = entries.filter((e) => e.groups.includes(group.id)).length;
                return (
                  <div key={group.id} className="group-item">
                    <div className="group-color" style={{ backgroundColor: group.color }} />
                    <div className="group-info">
                      <div className="group-name">{group.name}</div>
                      <div className="group-stat">{eventCount} Ereignisse</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="overview-card">
          <h3>Schnellstatistiken</h3>
          <div className="stats">
            <div className="stat">
              <div className="stat-value">{entries.length}</div>
              <div className="stat-label">Gesamt Ereignisse</div>
            </div>
            <div className="stat">
              <div className="stat-value">{groups.length}</div>
              <div className="stat-label">Gruppen</div>
            </div>
            <div className="stat">
              <div className="stat-value">{conflicts.length}</div>
              <div className="stat-label">Konflikte</div>
            </div>
            <div className="stat">
              <div className="stat-value">
                {entries.filter((e) => new Date(e.startDate) < new Date()).length}
              </div>
              <div className="stat-label">Abgelaufen</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollaborationView({ collaborators }: { collaborators: CollaborationIndicator[] }) {
  return (
    <div className="collaboration-view">
      <h2>Aktive Zusammenarbeit</h2>

      <div className="collaboration-grid">
        <div className="collaboration-card">
          <h3>Online-Benutzer</h3>
          {collaborators.filter((c) => c.status === 'online').length === 0 ? (
            <p className="empty-message">Keine Benutzer online</p>
          ) : (
            <div className="users-list">
              {collaborators
                .filter((c) => c.status === 'online')
                .map((user) => (
                  <div key={user.userId} className="user-item online">
                    <span className="user-status">●</span>
                    <span className="user-name">{user.userName}</span>
                    {user.currentView && <span className="user-view">{user.currentView}</span>}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="collaboration-card">
          <h3>Alle Benutzer</h3>
          <div className="users-list">
            {collaborators.map((user) => (
              <div key={user.userId} className={`user-item ${user.status}`}>
                <span className={`user-status ${user.status}`}>●</span>
                <span className="user-name">{user.userName}</span>
                <span className="user-status-label">{user.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="collaboration-info">
        <h3>Zusammenarbeit aktivieren</h3>
        <p>
          Die Echtzeit-Zusammenarbeit ermöglicht es mehreren Benutzern, gleichzeitig den Kalender
          zu bearbeiten. Änderungen werden sofort synchronisiert und Konflikte werden automatisch
          erkannt.
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span className="feature-text">Live-Synchronisierung zwischen Geräten</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span className="feature-text">Konflikt-Erkennung und -Auflösung</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span className="feature-text">Präsenz-Bewusstsein</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span className="feature-text">Kommentare und Anmerkungen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
