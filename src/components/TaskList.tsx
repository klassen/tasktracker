'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { isTaskActiveToday, getLocalDate } from '@/lib/utils/dateUtils';

interface TaskListProps {
  selectedPersonId: number | null;
  isAdminMode: boolean;
  tenantId: number;
  onTaskUpdate?: () => void;
}

export default function TaskList({ selectedPersonId, isAdminMode, tenantId, onTaskUpdate }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?tenantId=${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        onTaskUpdate?.();
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    setShowForm(false);
    fetchTasks();
  };

  const handleTaskUpdated = () => {
    fetchTasks();
  };

  const handleTaskDeleted = () => {
    fetchTasks();
  };

  const filteredTasks = tasks.filter(task => {
    const matchesPerson = selectedPersonId === null || task.assignedToId === selectedPersonId;
    const isActiveToday = isTaskActiveToday(task.activeDays);
    return matchesPerson && isActiveToday;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600 dark:text-gray-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdminMode && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : 'Add New Task'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <TaskForm 
            onSuccess={handleTaskCreated} 
            onCancel={() => setShowForm(false)}
            defaultPersonId={selectedPersonId}
            tenantId={tenantId}
          />
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400">
            {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks for this person.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={handleTaskUpdated}
              onDelete={handleTaskDeleted}
              isAdminMode={isAdminMode}
              tenantId={tenantId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
