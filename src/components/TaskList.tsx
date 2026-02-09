'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { isTaskActiveToday } from '@/lib/utils/dateUtils';
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
  const [isSwitching, setIsSwitching] = useState(false);
  const [activePersonId, setActivePersonId] = useState<number | null>(null);
  const [lastLoadedPersonId, setLastLoadedPersonId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (selectedPersonId === null) {
      setTasks([]);
      setLoading(false);
      setIsSwitching(false);
      setActivePersonId(null);
      setLastLoadedPersonId(null);
      return;
    }

    if (selectedPersonId !== activePersonId && tasks.length > 0) {
      setIsSwitching(true);
    }
    setActivePersonId(selectedPersonId);
    setLoading(true);
    fetchTasks(selectedPersonId);
  }, [selectedPersonId, tenantId]);

  const fetchTasks = async (personId: number) => {
    try {
      const response = await fetch(`/api/tasks?tenantId=${tenantId}&personId=${personId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
        setLastLoadedPersonId(personId);
        onTaskUpdate?.();
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
    requestAnimationFrame(() => setIsSwitching(false));
    setLoading(false);
  };

  const handleTaskCreated = () => {
    setShowForm(false);
    if (selectedPersonId !== null) {
      setLoading(true);
      fetchTasks(selectedPersonId);
    }
  };

  const handleTaskUpdated = () => {
    if (selectedPersonId !== null) {
      setLoading(true);
      fetchTasks(selectedPersonId);
    }
  };

  const handleTaskDeleted = () => {
    if (selectedPersonId !== null) {
      setLoading(true);
      fetchTasks(selectedPersonId);
    }
  };

  const isAwaitingTasksForSelection = selectedPersonId !== null && lastLoadedPersonId !== selectedPersonId;
  const displayPersonId = (isSwitching || isAwaitingTasksForSelection) && lastLoadedPersonId !== null
    ? lastLoadedPersonId
    : selectedPersonId;

  const filteredTasks = tasks.filter(task => {
    const matchesPerson = displayPersonId === null || task.assignedToId === displayPersonId;
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
        if (selectedPersonId !== null) {
          setLoading(true);
          fetchTasks(selectedPersonId);
        }
      }
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      // Revert on error
      if (selectedPersonId !== null) {
        setLoading(true);
        fetchTasks(selectedPersonId);
      }
    }
  };

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isSwitching ? 'opacity-60' : 'opacity-100'}`}>
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

      {filteredTasks.length === 0 && (selectedPersonId === null || !isAwaitingTasksForSelection) ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedPersonId === null
              ? 'Select a person to view tasks.'
              : loading || isSwitching || isAwaitingTasksForSelection
              ? ''
              : tasks.length === 0
              ? 'No tasks yet. Create your first task!'
              : 'No tasks for this person.'}
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
