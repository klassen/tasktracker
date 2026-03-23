'use client';

import { useState, useEffect, useCallback } from 'react';
import TaskList from '@/components/TaskList';
import PersonList from '@/components/PersonList';
import CalendarSetup from '@/components/CalendarSetup';
import TodaysEvents from '@/components/TodaysEvents';
import Reporting from '@/components/Reporting';
import TenantSelector from '@/components/TenantSelector';
import AccountManagement from '@/components/AccountManagement';
import ChangePassword from '@/components/ChangePassword';


import type { Person } from '@/types/person';

export default function Home() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [loggedInTenantId, setLoggedInTenantId] = useState<number | 'admin' | null>(null);
  const [loggedInTenantName, setLoggedInTenantName] = useState<string>('');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [showSetPin, setShowSetPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [newPinSaving, setNewPinSaving] = useState(false);
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoaded, setPeopleLoaded] = useState(false);
  const [refreshPeople, setRefreshPeople] = useState<(() => void) | null>(null);
  const isPersonReady = selectedPersonId !== null || (peopleLoaded && people.length === 0);

  // Load login state from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem('loggedInTenantId');
    const savedTenantName = localStorage.getItem('loggedInTenantName');
    if (savedTenantId && savedTenantName) {
      const tenantId = savedTenantId === 'admin' ? 'admin' : parseInt(savedTenantId);
      setLoggedInTenantId(tenantId);
      setLoggedInTenantName(savedTenantName);
      // Fetch whether this tenant requires a PIN
      if (tenantId !== 'admin') {
        fetch(`/api/tenants/${tenantId}/pin`)
          .then(r => r.json())
          .then(d => setPinRequired(!!d.required))
          .catch(() => setPinRequired(false));
      }
    }
    setIsHydrated(true);
  }, []);

  const handleRefreshSetup = useCallback((fn: () => void) => {
    setRefreshPeople(() => fn);
  }, []);

  const handleLogin = (tenantId: number | 'admin', tenantName: string) => {
    setLoggedInTenantId(tenantId);
    setLoggedInTenantName(tenantName);
    // Persist to localStorage
    localStorage.setItem('loggedInTenantId', tenantId.toString());
    localStorage.setItem('loggedInTenantName', tenantName);
    // Fetch whether this tenant requires a PIN
    if (tenantId !== 'admin') {
      fetch(`/api/tenants/${tenantId}/pin`)
        .then(r => r.json())
        .then(d => setPinRequired(!!d.required))
        .catch(() => setPinRequired(false));
    }
  };

  const handleLogout = () => {
    setLoggedInTenantId(null);
    setLoggedInTenantName('');
    setSelectedPersonId(null);
    setIsAdminMode(false);
    setShowCalendarSetup(false);
    setShowReporting(false);
    setPeople([]);
    setPeopleLoaded(false);
    // Clear from localStorage
    localStorage.removeItem('loggedInTenantId');
    localStorage.removeItem('loggedInTenantName');
  };

  // Reset person selection when tenant changes
  useEffect(() => {
    setSelectedPersonId(null);
    setPeopleLoaded(false);
  }, [loggedInTenantId]);

  // Auto-select first person when people list is loaded
  useEffect(() => {
    if (people.length > 0 && selectedPersonId === null) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

  const handlePeopleChange = useCallback((nextPeople: Person[]) => {
    setPeople(nextPeople);
    setPeopleLoaded(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="animate-pulse text-gray-600 dark:text-gray-400">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // If not logged in, show login screen
  if (!loggedInTenantId) {
    return <TenantSelector onLogin={handleLogin} />;
  }

  // If logged in as admin, show account management
  if (loggedInTenantId === 'admin') {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Logged in as: <span className="font-semibold">{loggedInTenantName}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
            >
              🚪 Logout
            </button>
          </div>
          
          <AccountManagement />
        </div>
      </main>
    );
  }

  // Normal user view
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Task Tracker
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Logged in as: <button 
                onClick={() => setShowChangePassword(true)}
                className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 underline decoration-dotted cursor-pointer transition-colors"
                title="Click to change password"
              >
                {loggedInTenantName}
              </button>
            </p>
          </div>
          <div className="flex gap-3">
            {isAdminMode && (
              <button
                onClick={() => { setNewPinInput(''); setShowSetPin(true); }}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                🔐 Set PIN
              </button>
            )}
            {isAdminMode && (
              <button
                onClick={() => {
                  setShowCalendarSetup(!showCalendarSetup);
                  if (!showCalendarSetup) setShowReporting(false);
                }}
                className="px-4 py-2 rounded-lg font-semibold transition-colors bg-purple-600 hover:bg-purple-700 text-white"
              >
                {showCalendarSetup ? '✕ Close Calendar Setup' : '📅 Calendar Setup'}
              </button>
            )}
            <button
              onClick={() => {
                if (isAdminMode) {
                  setIsAdminMode(false);
                  setShowCalendarSetup(false);
                  setShowReporting(false);
                } else if (pinRequired) {
                  setPinInput('');
                  setPinError(false);
                  setShowPinModal(true);
                } else {
                  setIsAdminMode(true);
                }
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isAdminMode
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {isAdminMode ? '🔓 Admin Mode' : '🔒 View Only'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors font-semibold"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {isAdminMode && showCalendarSetup && (
          <div className="mb-6">
            <CalendarSetup tenantId={loggedInTenantId} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:min-w-fit">
                <PersonList 
                  selectedPersonId={selectedPersonId}
                  onSelectPerson={setSelectedPersonId}
                  isAdminMode={isAdminMode}
                  tenantId={loggedInTenantId}
                  onShowReporting={() => {
                    setShowReporting(!showReporting);
                    if (!showReporting) setShowCalendarSetup(false);
                  }}
                  onRefresh={handleRefreshSetup}
                  onPeopleChange={handlePeopleChange}
                />
              </div>
              <div className="flex-1">
                {isAdminMode && showReporting ? (
                  <Reporting people={people} tenantId={loggedInTenantId} />
                ) : (
                  isPersonReady ? (
                    <TaskList 
                      selectedPersonId={selectedPersonId}
                      isAdminMode={isAdminMode}
                      tenantId={loggedInTenantId}
                      onTaskUpdate={() => refreshPeople?.()}
                    />
                  ) : (
                    <div className="py-12" />
                  )
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <TodaysEvents tenantId={loggedInTenantId} />
          </div>
        </div>

        {showChangePassword && (
          <ChangePassword 
            tenantId={loggedInTenantId} 
            onClose={() => setShowChangePassword(false)} 
          />
        )}

        {showSetPin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSetPin(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-80" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🔐 Set Admin PIN</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This PIN will be required to enable Admin Mode. Leave blank to remove the PIN.
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                autoFocus
                value={newPinInput}
                onChange={e => setNewPinInput(e.target.value)}
                placeholder="Enter new PIN (blank to clear)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-center text-2xl tracking-widest font-mono mb-4 bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSetPin(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={newPinSaving}
                  onClick={async () => {
                    setNewPinSaving(true);
                    try {
                      await fetch(`/api/tenants/${loggedInTenantId}/pin`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pin: newPinInput || null }),
                      });
                      setPinRequired(!!newPinInput);
                      setShowSetPin(false);
                    } finally {
                      setNewPinSaving(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
                >
                  {newPinSaving ? 'Saving...' : newPinInput ? 'Set PIN' : 'Clear PIN'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPinModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔒 Enter Admin PIN</h2>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              autoFocus
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={async e => {
                if (e.key === 'Enter' && !pinVerifying) {
                  setPinVerifying(true);
                  try {
                    const res = await fetch(`/api/tenants/${loggedInTenantId}/pin`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pin: pinInput }),
                    });
                    const data = await res.json();
                    if (data.valid) {
                      setIsAdminMode(true);
                      setShowPinModal(false);
                    } else {
                      setPinError(true);
                      setPinInput('');
                    }
                  } finally {
                    setPinVerifying(false);
                  }
                } else if (e.key === 'Escape') {
                  setShowPinModal(false);
                }
              }}
              placeholder="Enter PIN"
              className={`w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-widest font-mono mb-3 bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 ${pinError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-400'}`}
            />
            {pinError && <p className="text-red-500 text-sm text-center mb-3">Incorrect PIN. Try again.</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={pinVerifying}
                onClick={async () => {
                  if (pinVerifying) return;
                  setPinVerifying(true);
                  try {
                    const res = await fetch(`/api/tenants/${loggedInTenantId}/pin`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pin: pinInput }),
                    });
                    const data = await res.json();
                    if (data.valid) {
                      setIsAdminMode(true);
                      setShowPinModal(false);
                    } else {
                      setPinError(true);
                      setPinInput('');
                    }
                  } finally {
                    setPinVerifying(false);
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {pinVerifying ? 'Checking...' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
