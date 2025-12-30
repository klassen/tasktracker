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

interface Person {
  id: number;
  name: string;
  pointGoal?: number;
}

export default function Home() {
  const [loggedInTenantId, setLoggedInTenantId] = useState<number | 'admin' | null>(null);
  const [loggedInTenantName, setLoggedInTenantName] = useState<string>('');
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showCalendarSetup, setShowCalendarSetup] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [refreshPeople, setRefreshPeople] = useState<(() => void) | null>(null);

  // Load login state from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem('loggedInTenantId');
    const savedTenantName = localStorage.getItem('loggedInTenantName');
    if (savedTenantId && savedTenantName) {
      const tenantId = savedTenantId === 'admin' ? 'admin' : parseInt(savedTenantId);
      setLoggedInTenantId(tenantId);
      setLoggedInTenantName(savedTenantName);
    }
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
  };

  const handleLogout = () => {
    setLoggedInTenantId(null);
    setLoggedInTenantName('');
    setSelectedPersonId(null);
    setIsAdminMode(false);
    setShowCalendarSetup(false);
    setShowReporting(false);
    // Clear from localStorage
    localStorage.removeItem('loggedInTenantId');
    localStorage.removeItem('loggedInTenantName');
  };

  // Reset person selection when tenant changes
  useEffect(() => {
    setSelectedPersonId(null);
  }, [loggedInTenantId]);

  // Auto-select first person when people list is loaded
  useEffect(() => {
    if (people.length > 0 && selectedPersonId === null) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

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
              onClick={() => setIsAdminMode(!isAdminMode)}
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
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
                  onPeopleChange={setPeople}
                />
              </div>
              <div className="lg:col-span-3">
                {isAdminMode && showReporting ? (
                  <Reporting people={people} tenantId={loggedInTenantId} />
                ) : (
                  <TaskList 
                    selectedPersonId={selectedPersonId}
                    isAdminMode={isAdminMode}
                    tenantId={loggedInTenantId}
                    onTaskUpdate={() => refreshPeople?.()}
                  />
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
      </div>
    </main>
  );
}
