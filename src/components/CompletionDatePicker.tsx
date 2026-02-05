'use client';

import { useState, useEffect } from 'react';
import { getLocalDate, formatLocalDate } from '@/lib/utils/dateUtils';

interface CompletionDatePickerProps {
  completedDates: string[]; // Array of dates this task is completed on
  completions: Array<{ completedDate: string; status: 'completed' | 'excluded' }>;
  onSelectDate: (date: string, status: 'completed' | 'excluded') => void;
  onClose: () => void;
}

export default function CompletionDatePicker({ 
  completedDates,
  completions,
  onSelectDate, 
  onClose 
}: CompletionDatePickerProps) {
  const today = getLocalDate();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'excluded'>('completed');

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Get last 30 days for quick selection
  const getLast30Days = () => {
    const days: { 
      date: string; 
      dayName: string; 
      completionStatus: 'completed' | 'excluded' | null;
      isToday: boolean 
    }[] = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = formatLocalDate(date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const completion = completions.find(c => c.completedDate === dateStr);
      
      days.push({
        date: dateStr,
        dayName,
        completionStatus: completion ? completion.status : null,
        isToday: dateStr === today,
      });
    }
    
    return days;
  };

  const days = getLast30Days();
  
  // Get status of currently selected date
  const selectedDateCompletion = completions.find(c => c.completedDate === selectedDate);
  const currentStatus = selectedDateCompletion?.status || null;

  const handleConfirm = (status: 'completed' | 'excluded') => {
    onSelectDate(selectedDate, status);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Completion Date
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose a date:
          </label>
          <input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            You can only mark tasks complete for today or past dates
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick select (last 30 days):
          </label>
          <div className="max-h-64 overflow-y-auto border dark:border-gray-600 rounded-lg">
            {days.map((day) => (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  selectedDate === day.date ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                } ${
                  day.completionStatus ? 'font-semibold' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  {day.completionStatus === 'completed' && (
                    <span className="text-green-600 dark:text-green-400" title="Completed">✓</span>
                  )}
                  {day.completionStatus === 'excluded' && (
                    <span className="text-orange-500 dark:text-orange-400" title="Excluded">⊘</span>
                  )}
                  <span className={day.isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-900 dark:text-white'}>
                    {day.dayName}
                    {day.isToday && ' (Today)'}
                  </span>
                </span>
                {selectedDate === day.date && (
                  <span className="text-blue-600 dark:text-blue-400 text-sm">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {currentStatus ? (
            <>
              <button
                onClick={() => handleConfirm(currentStatus === 'completed' ? 'excluded' : 'completed')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  currentStatus === 'completed'
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {currentStatus === 'completed' ? '⊘ Mark Excluded' : '✓ Mark Completed'}
              </button>
              <button
                onClick={() => handleConfirm(currentStatus)}
                className="flex-1 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
              >
                Remove Mark
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleConfirm('completed')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
              >
                ✓ Mark Completed
              </button>
              <button
                onClick={() => handleConfirm('excluded')}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
              >
                ⊘ Mark Excluded
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
