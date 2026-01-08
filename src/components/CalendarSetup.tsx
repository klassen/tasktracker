'use client';

import { useState, useEffect } from 'react';

interface CalendarSetupProps {
  tenantId: number;
}

export default function CalendarSetup({ tenantId }: CalendarSetupProps) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/calendar/status?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
        
        if (data.connected) {
          fetchCalendars();
        }
      }
    } catch (error) {
      console.error('Failed to check calendar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await fetch(`/api/calendar/calendars?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setCalendars(data.calendars || []);
        
        // Get current settings to pre-select calendars
        const statusResponse = await fetch(`/api/calendar/status?tenantId=${tenantId}`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.selectedCalendars) {
            const ids = statusData.selectedCalendars.split(',').filter((id: string) => id.trim());
            setSelectedCalendarIds(ids);
          }
        }
      } else if (response.status === 401) {
        setConnected(false);
      }
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(`/api/calendar/auth?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate auth:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;

    try {
      const response = await fetch(`/api/calendar/status?tenantId=${tenantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConnected(false);
        setCalendars([]);
        setSelectedCalendarIds([]);
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleToggleCalendar = (calendarId: string) => {
    setSelectedCalendarIds(prev => 
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleSaveSelection = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const response = await fetch('/api/calendar/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarIds: selectedCalendarIds, tenantId }),
      });

      if (response.ok) {
        setSaveSuccess(true);
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError('Failed to save calendar selection');
      }
    } catch (error) {
      console.error('Failed to save calendar selection:', error);
      setSaveError('Failed to save calendar selection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">Loading calendar settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        📅 Google Calendar Integration
      </h2>

      {!connected ? (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Connect your Google Calendar to see today's events on your dashboard.
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Connect Google Calendar
          </button>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Setup Required:</strong> Add the following to your .env file:
              <br />
              <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded">
                GOOGLE_CLIENT_ID=your_client_id
                <br />
                GOOGLE_CLIENT_SECRET=your_client_secret
              </code>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✓ Connected to Google Calendar
            </span>
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Disconnect
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Select Calendars to Display
            </h3>
            <div className="space-y-2">
              {calendars.map((cal) => (
                <label
                  key={cal.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCalendarIds.includes(cal.id)}
                    onChange={() => handleToggleCalendar(cal.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    {cal.backgroundColor && (
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cal.backgroundColor }}
                      />
                    )}
                    <span className="text-gray-900 dark:text-white">{cal.summary}</span>
                    {cal.primary && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {calendars.length > 0 && (
              <div className="mt-4 space-y-3">
                <button
                  onClick={handleSaveSelection}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Selection'}
                </button>
                
                {saveSuccess && (
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-lg text-green-700 dark:text-green-400 text-sm">
                    ✓ Calendar selection saved successfully!
                  </div>
                )}
                
                {saveError && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {saveError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
