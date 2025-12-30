export interface Person {
  id: number;
  name: string;
  color?: string;
  createdAt: string;
  pointGoal?: number;
  currentMonthPoints?: number;
}

export interface CreatePersonDto {
  name: string;
  color?: string;
}

export interface UpdatePersonDto {
  name?: string;
  color?: string;
}
