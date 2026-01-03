'use client';

import { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
  color?: string;
  eventColorId?: string;
}

interface TodaysEventsProps {
  tenantId: number;
}

export default function TodaysEvents({ tenantId }: TodaysEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);


  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Always use the user's local date for event fetching
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      console.log('[TodaysEvents] Fetching events for local date:', localDate);
      console.log('[TodaysEvents] Browser timezone:', timeZone);
      console.log('[TodaysEvents] Browser Date object:', today.toString());
      console.log('[TodaysEvents] Browser timezone offset (minutes):', today.getTimezoneOffset());
      
      const response = await fetch(`/api/calendar/events?tenantId=${tenantId}&localDate=${localDate}&timeZone=${encodeURIComponent(timeZone)}`);
      if (response.ok) {
        const data = await response.json();
        console.log('[TodaysEvents] Received events:', data.events?.length || 0);
        console.log('[TodaysEvents] Events data:', data);
        setEvents(data.events || []);
        setAuthenticated(data.authenticated !== false);
      } else {
        console.error('[TodaysEvents] Response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[TodaysEvents] Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isAllDayEvent = (start: string) => {
    // All-day events are returned as dates without time
    return !start.includes('T');
  };

  // Google Calendar event color mapping
  const getEventColor = (event: CalendarEvent) => {
    if (event.eventColorId) {
      // Google Calendar event color IDs to hex colors
      const eventColors: { [key: string]: string } = {
        '1': '#a4bdfc', // Lavender
        '2': '#7ae7bf', // Sage
        '3': '#dbadff', // Grape
        '4': '#ff887c', // Flamingo
        '5': '#fbd75b', // Banana
        '6': '#ffb878', // Tangerine
        '7': '#46d6db', // Peacock
        '8': '#e1e1e1', // Graphite
        '9': '#5484ed', // Blueberry
        '10': '#51b749', // Basil
        '11': '#dc2127', // Tomato
      };
      return eventColors[event.eventColorId] || event.color || '#3b82f6';
    }
    return event.color || '#3b82f6'; // Default blue
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
        <div className="animate-pulse text-sm text-gray-600 dark:text-gray-400">
          Loading events...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Don't show anything if not connected
  }

  if (events.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
        <h3 
          className="text-sm font-semibold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          onClick={() => {
            setLoading(true);
            fetchEvents();
          }}
          title="Click to refresh events"
        >
          📅 Today
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">No events</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sticky top-8">
      <h3 
        className="text-sm font-semibold text-gray-900 dark:text-white mb-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
        onClick={() => {
          setLoading(true);
          fetchEvents();
        }}
        title="Click to refresh events"
      >
        📅 Today ({events.length})
        {loading && <span className="animate-spin">↻</span>}
      </h3>
      <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {events.map((event) => {
          const color = getEventColor(event);
          return (
            <a
              key={event.id}
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded border-l-4 transition-all hover:shadow"
              style={{
                borderLeftColor: color,
                backgroundColor: `${color}15`, // 15 is ~8% opacity in hex
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {event.summary}
                  </h4>
                  <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1 truncate">
                      🕐{' '}
                      {isAllDayEvent(event.start) ? (
                        'All day'
                      ) : (
                        `${formatTime(event.start)}`
                      )}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        📍 {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <svg
                  className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
