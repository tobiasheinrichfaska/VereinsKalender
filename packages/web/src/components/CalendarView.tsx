import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { enUS } from 'date-fns/locale';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  format,
  startOfWeek,
  getDay,
  parse,
} from 'date-fns';
import { CalendarEntry, Group, formatDate } from '@vereinskalender/shared';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  formats: {
    dateFormat: 'dd',
    dayFormat: 'eeee dd',
    weekdayFormat: 'eeee',
    monthHeaderFormat: 'MMMM yyyy',
    dayHeaderFormat: 'eeee',
    dayRangeHeaderFormat: ({ start, end }) =>
      `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`,
    agendaHeaderFormat: ({ start, end }) =>
      `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`,
    agendaDateFormat: 'eeee MMM dd',
    agendaTimeFormat: 'p',
    agendaTimeRangeFormat: ({ start, end }) =>
      `${format(start, 'p')} - ${format(end, 'p')}`,
    timeGutterFormat: 'p',
    eventTimeRangeFormat: ({ start, end }) =>
      `${format(start, 'p')} - ${format(end, 'p')}`,
  },
  locales,
});

interface CalendarViewProps {
  entries: CalendarEntry[];
  groups: Group[];
  onDateSelect: (date: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEntry;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  entries,
  groups,
  onDateSelect,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null);

  const events: CalendarEvent[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    start: new Date(entry.startDate),
    end: new Date(entry.endDate),
    resource: entry,
  }));

  const handleSelectSlot = ({ start }: { start: Date }) => {
    onDateSelect(start);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEntry(event.resource);
  };

  const getGroupBadges = (groupIds: string[]) => {
    return groupIds
      .map((id) => groups.find((g) => g.id === id))
      .filter((g): g is Group => g !== undefined);
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>Kalenderansicht</h2>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        defaultDate={currentDate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        selectable
        popup
      />

      {selectedEntry && (
        <div className="event-details">
          <div className="event-header">
            <h3>{selectedEntry.title}</h3>
            <button onClick={() => setSelectedEntry(null)} className="close-btn">
              ×
            </button>
          </div>
          <div className="event-body">
            <p>
              <strong>Zeitraum:</strong> {selectedEntry.startDate} bis{' '}
              {selectedEntry.endDate}
            </p>
            {selectedEntry.description && (
              <p>
                <strong>Beschreibung:</strong> {selectedEntry.description}
              </p>
            )}
            <div className="event-groups">
              <strong>Gruppen:</strong>
              <div className="group-badges">
                {getGroupBadges(selectedEntry.groups).map((group) => (
                  <span
                    key={group.id}
                    className="badge"
                    style={{ backgroundColor: group.color, color: '#fff' }}
                  >
                    {group.name}
                  </span>
                ))}
              </div>
            </div>
            {selectedEntry.type && (
              <p>
                <strong>Typ:</strong> {selectedEntry.type}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
