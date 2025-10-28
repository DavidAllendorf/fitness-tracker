// Modell für eine einzelne Übung
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number; // in kg
  restTime?: number; // Pause in Sekunden
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Modell für einen Trainingsplan
export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Modell für das Training selbst (für zukünftige Erweiterungen)
export interface WorkoutSession {
  id: string;
  planId: string;
  date: Date;
  duration?: number; // in Minuten
  notes?: string;
  completed: boolean;
}

// Utility-Typen
export type CreateExerciseDto = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExerciseDto = Partial<CreateExerciseDto>;
export type CreateWorkoutPlanDto = Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'>;
export type UpdateWorkoutPlanDto = Partial<CreateWorkoutPlanDto>;