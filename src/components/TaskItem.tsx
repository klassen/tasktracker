'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { getLocalDate } from '@/lib/utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onUpdate: () => void;
  onDelete: () => void;
  isAdminMode: boolean;
  tenantId: number;
}


export default function TaskItem({ task, onUpdate, onDelete, isAdminMode, tenantId }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const today = getLocalDate();
  // Local optimistic completion state
  const [optimisticCompleted, setOptimisticCompleted] = useState<null | boolean>(null);
  const [error, setError] = useState<string | null>(null);
  const isCompletedToday =
    optimisticCompleted !== null
      ? optimisticCompleted
      : task.completions?.some(c => c.completedDate === today) || false;

  // Parse active days for display
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activeDayNumbers = task.activeDays.split(',').map(d => parseInt(d.trim()));
  const activeDayLabels = activeDayNumbers.map(d => daysOfWeek[d]).join(', ');

  const handleTaskClick = async () => {
    if (isEditing) return;
    setError(null);
    // Optimistically toggle completion
    setOptimisticCompleted(!isCompletedToday);
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete?tenantId=${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedDate: today }),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate();
      } else {
        throw new Error('Failed to toggle task completion');
      }
    } catch (error) {
      setError('Failed to update task. Please try again.');
      // Revert optimistic update
      setOptimisticCompleted(isCompletedToday);
    }
  };

  const toggleDay = (day: number) => {
    const currentDays = editedTask.activeDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);
    setEditedTask({ ...editedTask, activeDays: newDays.join(',') });
  };

  const isDaySelected = (day: number) => {
    const currentDays = editedTask.activeDays.split(',').map(d => parseInt(d.trim()));
    return currentDays.includes(day);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTask.title,
          description: editedTask.description,
          isRecurring: editedTask.isRecurring,
          activeDays: editedTask.activeDays,
          points: editedTask.points,
          money: editedTask.money,
          tenantId,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}?tenantId=${tenantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  return (
    <div 
      onClick={handleTaskClick}
      className={`rounded-lg shadow-md p-6 transition-all cursor-pointer ${
        isCompletedToday
          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
          : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      {error && (
        <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded text-red-700 dark:text-red-400 text-xs">
          {error}
        </div>
      )}
      {isEditing ? (
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <textarea
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditedTask({ ...editedTask, isRecurring: true })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  editedTask.isRecurring
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                🔄 Recurring
              </button>
              <button
                type="button"
                onClick={() => setEditedTask({ ...editedTask, isRecurring: false })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  !editedTask.isRecurring
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                ✓ One-Off
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Active Days
            </label>
            <div className="flex gap-2 flex-wrap">
              {daysOfWeek.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                    isDaySelected(index)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Points
              </label>
              <input
                type="number"
                value={editedTask.points || ''}
                onChange={(e) => setEditedTask({ 
                  ...editedTask, 
                  points: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Money
              </label>
              <input
                type="number"
                step="0.01"
                value={editedTask.money || ''}
                onChange={(e) => setEditedTask({ 
                  ...editedTask, 
                  money: e.target.value ? parseFloat(e.target.value) : null 
                })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedTask(task);
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
              )}
              <div className="flex gap-2 mb-3 flex-wrap">
                {!task.isRecurring && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    ✓ One-Off
                  </span>
                )}
                {task.assignedTo && (
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5"
                    style={{ 
                      backgroundColor: task.assignedTo.color ? `${task.assignedTo.color}20` : '#E5E7EB',
                      color: task.assignedTo.color || '#374151'
                    }}
                  >
                    {task.assignedTo.color && (
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: task.assignedTo.color }}
                      />
                    )}
                    {task.assignedTo.name}
                  </span>
                )}
              </div>
              {(task.points != null || task.money != null) && (
                <div className="flex gap-3 mb-3">
                  {task.points != null && (
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      🏆 {task.points} points
                    </span>
                  )}
                  {task.money != null && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      💰 ${task.money.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📅 Active: {activeDayLabels}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {isAdminMode && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
