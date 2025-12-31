'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { isTaskActiveToday, getLocalDate } from '@/lib/utils/dateUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredTasks.findIndex(task => task.id === active.id);
    const newIndex = filteredTasks.findIndex(task => task.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const reorderedTasks = arrayMove(filteredTasks, oldIndex, newIndex);
    
    // Update local state immediately
    const updatedAllTasks = [...tasks];
    filteredTasks.forEach(task => {
      const index = updatedAllTasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        updatedAllTasks.splice(index, 1);
      }
    });
    reorderedTasks.forEach((task, index) => {
      updatedAllTasks.splice(index, 0, task);
    });
    setTasks(updatedAllTasks);

    // Send update to server
    try {
      const taskOrders = reorderedTasks.map((task, index) => ({
        id: task.id,
        displayOrder: index,
      }));

      const response = await fetch('/api/tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskOrders, tenantId }),
      });

      if (!response.ok) {
        // Revert on error
        fetchTasks();
      }
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      // Revert on error
      fetchTasks();
    }
  };

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
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
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
