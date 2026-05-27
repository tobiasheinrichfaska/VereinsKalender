import { useState } from 'react';
import { useCalendar } from './hooks';
import { UUID, FilterOptions, formatDate, parseDate } from '@vereinskalender/shared';
import './App.css';
import CalendarView from './components/CalendarView';
import FilterSidebar from './components/FilterSidebar';
import GroupManager from './components/GroupManager';
import HolidayManager from './components/HolidayManager';
import ConflictRuleManager from './components/ConflictRuleManager';
import EventForm from './components/EventForm';
import ExportDialog from './components/ExportDialog';

function App() {
  const calendar = useCalendar();
  const [activeTab, setActiveTab] = useState<'calendar' | 'groups' | 'holidays' | 'conflicts'>('calendar');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: formatDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      endDate: formatDate(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      ),
    },
    groups: [],
    types: undefined,
    regions: undefined,
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const handleCreateEvent = (data: any) => {
    calendar.addEntry({
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      type: 'event',
      groups: data.groups,
      region: data.region,
    });
    setShowEventForm(false);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const filteredEntries = calendar.filterCalendar(filters);

  return (
    <div className="app">
      <header className="header">
        <h1>VereinsKalender</h1>
        <nav className="tabs">
          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            Kalender
          </button>
          <button
            className={activeTab === 'groups' ? 'active' : ''}
            onClick={() => setActiveTab('groups')}
          >
            Gruppen
          </button>
          <button
            className={activeTab === 'holidays' ? 'active' : ''}
            onClick={() => setActiveTab('holidays')}
          >
            Feiertage
          </button>
          <button
            className={activeTab === 'conflicts' ? 'active' : ''}
            onClick={() => setActiveTab('conflicts')}
          >
            Konfliktregeln
          </button>
        </nav>
      </header>

      <main className="main">
        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <aside className="sidebar">
              <button className="btn btn-primary" onClick={() => setShowEventForm(true)}>
                + Neuer Eintrag
              </button>
              <button className="btn btn-secondary" onClick={() => setShowExportDialog(true)}>
                ↓ Exportieren
              </button>
              <FilterSidebar
                groups={calendar.groups}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </aside>
            <section className="content">
              <CalendarView
                entries={filteredEntries}
                groups={calendar.groups}
                onDateSelect={handleDateSelect}
              />
            </section>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="content">
            <GroupManager
              groups={calendar.groups}
              onAddGroup={calendar.addGroup}
              onUpdateGroup={calendar.updateGroup}
              onDeleteGroup={calendar.deleteGroup}
            />
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="content">
            <HolidayManager
              holidays={calendar.holidays}
              onAddHoliday={calendar.addHoliday}
              onDeleteHoliday={(id) => {
                // For now, just show a message
                alert('Holiday deletion not yet implemented');
              }}
            />
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div className="content">
            <ConflictRuleManager
              conflicts={calendar.conflicts}
              groups={calendar.groups}
              onAddRule={(rule) => {
                // For now, just show a message
                alert('Conflict rule management not yet fully implemented');
              }}
              onDeleteRule={(id) => {
                // For now, just show a message
                alert('Conflict rule deletion not yet implemented');
              }}
            />
          </div>
        )}
      </main>

      {showEventForm && (
        <EventForm
          groups={calendar.groups}
          selectedDate={selectedDate}
          onSave={handleCreateEvent}
          onClose={() => setShowEventForm(false)}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          entries={calendar.entries}
          groups={calendar.groups}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}

export default App;
