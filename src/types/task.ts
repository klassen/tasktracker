export interface TaskCompletion {
  id: number;
  taskId: number;
  completedDate: string; // YYYY-MM-DD
  status: 'completed' | 'excluded'; // Status of the completion
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  isRecurring: boolean; // True for recurring, false for one-off
  activeDays: string; // Comma-separated days: "0,1,2,3,4,5,6" (0=Sunday)
  createdAt: string;
  updatedAt: string;
  points: number | null;
  money: number | null;
  assignedToId: number | null;
  assignedTo?: {
    id: number;
    name: string;
    color: string | null;
  } | null;
  completions?: TaskCompletion[];
  isCompletedToday?: boolean; // Frontend computed field
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  isRecurring?: boolean;
  activeDays: string; // Comma-separated days: "0,1,2,3,4,5,6"
  points?: number;
  money?: number;
  assignedToId?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  isRecurring?: boolean;
  activeDays?: string;
  points?: number;
  money?: number;
  assignedToId?: number | null;
}
