'use client';

import { useState } from 'react';
import { CreateTaskDto } from '@/types/task';

interface TaskFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  defaultPersonId?: number | null;
  tenantId: number;
}

export default function TaskForm({ onSuccess, onCancel, defaultPersonId, tenantId }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    description: '',
    isRecurring: true, // Default to recurring
    activeDays: '0,1,2,3,4,5,6', // Default: all days
    assignedToId: defaultPersonId || undefined,
  });
  const [loading, setLoading] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const toggleDay = (day: number) => {
    const currentDays = formData.activeDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    setFormData({ ...formData, activeDays: newDays.join(',') });
  };

  const isDaySelected = (day: number) => {
    const currentDays = formData.activeDays.split(',').map(d => parseInt(d.trim()));
    return currentDays.includes(day);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tenantId }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({ 
          title: '', 
          description: '', 
          isRecurring: true,
          activeDays: '0,1,2,3,4,5,6',
          assignedToId: defaultPersonId || undefined 
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Task Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isRecurring: true })}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              formData.isRecurring
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            🔄 Recurring
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isRecurring: false })}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              !formData.isRecurring
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            ✓ One-Off
          </button>
        </div>
        {!formData.isRecurring && (
          <p className="mt-2 text-sm text-purple-600 dark:text-purple-400">
            This task will be removed when completed
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Active Days *
        </label>
        <div className="flex gap-2 flex-wrap">
          {daysOfWeek.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDaySelected(day.value)
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Points
          </label>
          <input
            type="number"
            id="points"
            value={formData.points || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              points: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="money" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Money
          </label>
          <input
            type="number"
            id="money"
            step="0.01"
            value={formData.money || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              money: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="0.00"
            min="0"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
