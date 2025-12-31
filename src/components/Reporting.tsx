'use client';

import { useState, useEffect } from 'react';

interface Person {
  id: number;
  name: string;
  pointGoal: number;
}

interface TaskSummary {
  taskId: number;
  taskTitle: string;
  completionCount: number;
  possibleCompletions: number;
  percentComplete: number;
  pointsPerCompletion: number;
  totalPoints: number;
}

interface ReportData {
  person: Person;
  year: number;
  month: number;
  totalPoints: number;
  completionCount: number;
  taskSummaries: TaskSummary[];
  progress: number;
}

interface ReportingProps {
  people: Person[];
  tenantId: number;
}

export default function Reporting({ people, tenantId }: ReportingProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    if (people.length > 0 && !selectedPersonId) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

  useEffect(() => {
    if (selectedPersonId) {
      fetchReport();
    }
  }, [selectedPersonId, year, month]);

  const fetchReport = async () => {
    if (!selectedPersonId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/${selectedPersonId}?year=${year}&month=${month}&tenantId=${tenantId}`
      );
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedPersonId) return;

    const goalValue = parseInt(newGoal);
    if (isNaN(goalValue) || goalValue < 0) {
      alert('Please enter a valid point goal');
      return;
    }

    try {
      const response = await fetch(`/api/people/${selectedPersonId}/goal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointGoal: goalValue }),
      });

      if (response.ok) {
        setEditingGoal(false);
        fetchReport(); // Refresh to get updated goal
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
      alert('Failed to update point goal');
    }
  };

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Don't go beyond current month
    if (year === currentYear && month === currentMonth) {
      return;
    }

    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMonthName = () => {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  };

  if (loading && !reportData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading report...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        📊 Task Reporting
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Person Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Person
          </label>
          <select
            value={selectedPersonId || ''}
            onChange={(e) => setSelectedPersonId(parseInt(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        {/* Month Navigation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Month
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors"
            >
              ←
            </button>
            <div className="flex-1 text-center font-semibold text-gray-900 dark:text-white">
              {getMonthName()}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth()}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Points */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                Total Points Earned
              </div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {reportData.totalPoints}
              </div>
            </div>

            {/* Point Goal */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Monthly Goal
                </div>
                {!editingGoal && (
                  <button
                    onClick={() => {
                      setNewGoal(reportData.person.pointGoal?.toString() || '0');
                      setEditingGoal(true);
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-20 px-2 py-1 text-xl font-bold rounded border border-purple-300 dark:border-purple-600 bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300"
                    min="0"
                  />
                  <button
                    onClick={handleUpdateGoal}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm flex-shrink-0"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingGoal(false)}
                    className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {reportData.person.pointGoal || 0}
                </div>
              )}
            </div>

            {/* Tasks Completed */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                Tasks Completed
              </div>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                {reportData.completionCount}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {reportData.person.pointGoal && reportData.person.pointGoal > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress to Goal
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {Math.round(reportData.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${
                    reportData.progress >= 100
                      ? 'bg-green-500'
                      : reportData.progress >= 75
                      ? 'bg-blue-500'
                      : reportData.progress >= 50
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(reportData.progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Task Summary Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Task Summary
            </h3>
            {reportData.taskSummaries.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No tasks assigned
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600">
                        Task
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 text-center">
                        Times Completed
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 text-right">
                        Points/Task
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 text-right">
                        Total Points
                      </th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b-2 border-gray-300 dark:border-gray-600 text-center">
                        % Complete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.taskSummaries.map((task) => (
                      <tr
                        key={task.taskId}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {task.taskTitle}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {task.completionCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                          {task.pointsPerCompletion > 0 ? task.pointsPerCompletion : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                          {task.totalPoints > 0 ? task.totalPoints : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  task.percentComplete >= 100
                                    ? 'bg-green-500'
                                    : task.percentComplete >= 75
                                    ? 'bg-blue-500'
                                    : task.percentComplete >= 50
                                    ? 'bg-yellow-500'
                                    : 'bg-orange-500'
                                }`}
                                style={{ width: `${Math.min(task.percentComplete, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[45px]">
                              {task.percentComplete}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
