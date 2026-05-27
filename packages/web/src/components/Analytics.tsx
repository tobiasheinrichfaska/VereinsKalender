import React, { useMemo } from 'react';
import { CalendarEntry, Group, UUID } from '@vereinskalender/shared';
import './Analytics.css';

interface AnalyticsData {
  totalEvents: number;
  eventsByGroup: Record<UUID, number>;
  eventsByMonth: Record<string, number>;
  eventsByType: Record<string, number>;
  conflictCount: number;
  activeGroups: number;
  peakDay: string;
  peakHour: number;
}

interface AnalyticsProps {
  entries: CalendarEntry[];
  groups: Group[];
  conflictCount: number;
}

export function Analytics({ entries, groups, conflictCount }: AnalyticsProps) {
  const analytics: AnalyticsData = useMemo(() => {
    const eventsByGroup: Record<UUID, number> = {};
    const eventsByMonth: Record<string, number> = {};
    const eventsByType: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};

    groups.forEach((g) => {
      eventsByGroup[g.id] = 0;
    });

    entries.forEach((entry) => {
      const date = new Date(entry.startDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('de-DE', { weekday: 'long' });
      const hour = date.getHours();

      // Count by month
      eventsByMonth[month] = (eventsByMonth[month] || 0) + 1;

      // Count by type
      eventsByType[entry.type] = (eventsByType[entry.type] || 0) + 1;

      // Count by group
      entry.groups.forEach((groupId) => {
        eventsByGroup[groupId] = (eventsByGroup[groupId] || 0) + 1;
      });

      // Count by hour
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      // Count by day
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    // Find peak day and hour
    const peakDay = Object.entries(dayCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
      ? parseInt(Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0])
      : 0;

    return {
      totalEvents: entries.length,
      eventsByGroup,
      eventsByMonth,
      eventsByType,
      conflictCount,
      activeGroups: groups.filter((g) => eventsByGroup[g.id] > 0).length,
      peakDay,
      peakHour,
    };
  }, [entries, groups, conflictCount]);

  return (
    <div className="analytics">
      <h2>Analystics & Einblicke</h2>

      <div className="analytics-grid">
        <div className="metric-card">
          <h3>Gesamt Ereignisse</h3>
          <p className="metric-value">{analytics.totalEvents}</p>
          <p className="metric-label">Ereignisse in dieser Ansicht</p>
        </div>

        <div className="metric-card">
          <h3>Aktive Gruppen</h3>
          <p className="metric-value">{analytics.activeGroups}</p>
          <p className="metric-label">Gruppen mit Ereignissen</p>
        </div>

        <div className="metric-card">
          <h3>Konflikte erkannt</h3>
          <p className="metric-value">{analytics.conflictCount}</p>
          <p className="metric-label">Aktive Konflikte</p>
        </div>

        <div className="metric-card">
          <h3>Spitzentag</h3>
          <p className="metric-value">{analytics.peakDay}</p>
          <p className="metric-label">Meiste Ereignisse</p>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Ereignisse nach Typ</h3>
        <div className="chart-container">
          {Object.entries(analytics.eventsByType).map(([type, count]) => (
            <div key={type} className="chart-bar">
              <div className="bar-label">{type}</div>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    width: `${(count / analytics.totalEvents) * 100}%`,
                  }}
                />
              </div>
              <div className="bar-value">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h3>Top Gruppen</h3>
        <div className="group-rankings">
          {groups
            .filter((g) => analytics.eventsByGroup[g.id] > 0)
            .sort((a, b) => analytics.eventsByGroup[b.id] - analytics.eventsByGroup[a.id])
            .slice(0, 5)
            .map((group, index) => (
              <div key={group.id} className="ranking-item">
                <span className="rank">{index + 1}.</span>
                <span className="group-name">{group.name}</span>
                <span className="count">{analytics.eventsByGroup[group.id]} Ereignisse</span>
              </div>
            ))}
        </div>
      </div>

      <div className="analytics-section">
        <h3>Monatsansicht</h3>
        <div className="timeline">
          {Object.entries(analytics.eventsByMonth)
            .sort()
            .slice(-6)
            .map(([month, count]) => (
              <div key={month} className="timeline-item">
                <div className="timeline-date">{month}</div>
                <div className="timeline-bar">
                  <div
                    className="timeline-bar-fill"
                    style={{
                      width: `${Math.min((count / Math.max(...Object.values(analytics.eventsByMonth))) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="timeline-count">{count}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
