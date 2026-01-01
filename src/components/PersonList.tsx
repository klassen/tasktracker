'use client';

import { useState, useEffect } from 'react';
import { Person } from '@/types/person';
import { getLocalDate } from '@/lib/utils/dateUtils';

interface PersonListProps {
  selectedPersonId: number | null;
  onSelectPerson: (personId: number | null) => void;
  isAdminMode: boolean;
  onShowReporting?: () => void;
  onRefresh?: (refreshFn: () => void) => void;
  onPeopleChange?: (people: Person[]) => void;
  tenantId: number;
}

export default function PersonList({ selectedPersonId, onSelectPerson, isAdminMode, onShowReporting, onRefresh, onPeopleChange, tenantId }: PersonListProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonColor, setNewPersonColor] = useState('#3B82F6');

  useEffect(() => {
    fetchPeople();
  }, [tenantId]);

  useEffect(() => {
    if (onRefresh) {
      onRefresh(fetchPeople);
    }
  }, [onRefresh]);

  const fetchPeople = async () => {
    try {
      const response = await fetch(`/api/people?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
        if (onPeopleChange) {
          onPeopleChange(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPersonName.trim(),
          color: newPersonColor,
          tenantId,
        }),
      });

      if (response.ok) {
        setNewPersonName('');
        setNewPersonColor('#3B82F6');
        setShowAddForm(false);
        fetchPeople();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add person');
      }
    } catch (error) {
      console.error('Failed to add person:', error);
      alert('Failed to add person');
    }
  };

  const handleDeletePerson = async (id: number) => {
    if (!confirm('Are you sure you want to delete this person? Their tasks will be unassigned.')) {
      return;
    }

    try {
      const response = await fetch(`/api/people/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedPersonId === id) {
          onSelectPerson(null);
        }
        fetchPeople();
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
    }
  };

  const calculateProgress = (person: Person): number | null => {
    if (!person.pointGoal || person.pointGoal === 0 || !person.currentMonthPoints && person.currentMonthPoints !== 0) {
      return null;
    }

    // Use local date to get current day
    const today = getLocalDate(); // YYYY-MM-DD
    const [year, month, day] = today.split('-').map(Number);
    const currentDay = day;
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const expectedPoints = (person.pointGoal / daysInMonth) * currentDay;
    
    if (expectedPoints === 0) return null;
    
    return Math.round((person.currentMonthPoints / expectedPoints) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'text-green-600 dark:text-green-400';
    if (percentage >= 75) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="animate-pulse">Loading people...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Family Members</h2>
      </div>
      
      <div className="p-3 space-y-2">
        {people.map((person) => {
          const progress = calculateProgress(person);
          return (
            <div key={person.id} className="flex items-center gap-2">
              <button
                onClick={() => onSelectPerson(person.id)}
                className={`flex-1 text-left px-5 py-4 rounded-xl transition-all flex items-center gap-3 shadow-sm border-2 ${
                  selectedPersonId === person.id
                    ? 'bg-blue-500 text-white border-blue-600 shadow-md scale-[1.02]'
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600 hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                {person.color && (
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white dark:ring-gray-800"
                    style={{ backgroundColor: person.color }}
                  />
                )}
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="text-lg font-medium">{person.name}</span>
                  {progress !== null && (
                    <span className={`text-sm font-bold ${selectedPersonId === person.id ? 'text-white' : getProgressColor(progress)}`}>
                      {progress}%
                    </span>
                  )}
                </div>
              </button>
              {isAdminMode && (
                <button
                  onClick={() => handleDeletePerson(person.id)}
                  className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete person"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isAdminMode && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {!showAddForm ? (
          <>
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Person
            </button>
            {onShowReporting && (
              <button
                onClick={onShowReporting}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📊 Reporting
              </button>
            )}
          </>
        ) : (
          <form onSubmit={handleAddPerson} className="space-y-3">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newPersonColor}
                onChange={(e) => setNewPersonColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Pick a color</span>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPersonName('');
                  setNewPersonColor('#3B82F6');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      )}
    </div>
  );
}
