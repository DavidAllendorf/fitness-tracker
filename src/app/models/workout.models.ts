// Modell für einen einzelnen Satz
export interface Set {
  id: string;
  reps: number;
  weight: number; // in kg
  completed?: boolean;
  notes?: string;
}

// Modell für eine einzelne Übung
export interface Exercise {
  id: string;
  name: string;
  sets: Set[]; // Array von Sätzen statt nur Anzahl
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
}



// Utility-Typen
export type CreateSetDto = Omit<Set, 'id' | 'completed'>;
export type UpdateSetDto = Partial<CreateSetDto>;
export type CreateExerciseDto = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExerciseDto = Partial<CreateExerciseDto>;
export type CreateWorkoutPlanDto = Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'>;
export type UpdateWorkoutPlanDto = Partial<CreateWorkoutPlanDto>;

// Hilfsfunktionen
export function createEmptySet(reps: number = 0, weight: number = 0): Set {
  return {
    id: crypto.randomUUID(),
    reps,
    weight,
    completed: false
  };
}

export function createEmptySets(count: number, reps: number = 0, weight: number = 0): Set[] {
  return Array(count).fill(null).map(() => createEmptySet(reps, weight));
}

// Migration-Hilfsfunktion für alte Daten
export function migrateOldExerciseToNew(oldExercise: any): Exercise {
  // Prüfen, ob es sich um das alte Format handelt
  if (typeof oldExercise.sets === 'number' && typeof oldExercise.reps === 'number') {
    return {
      ...oldExercise,
      sets: createEmptySets(oldExercise.sets, oldExercise.reps, oldExercise.weight || 0)
    };
  }

  // Bereits im neuen Format
  return oldExercise as Exercise;
}