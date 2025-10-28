import { Injectable, signal, computed } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { OfflineStorageService } from './offline-storage.service';
import {
  WorkoutPlan,
  Exercise,
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
  CreateExerciseDto,
  UpdateExerciseDto
} from '../models/workout.models';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private readonly WORKOUT_PLANS_KEY = 'workout-plans';

  // Reactive state mit signals
  private _workoutPlans = signal<WorkoutPlan[]>([]);
  private _selectedPlanId = signal<string | null>(null);
  private _isOffline = signal<boolean>(!navigator.onLine);

  // Computed properties
  public workoutPlans = computed(() => this._workoutPlans());
  public selectedPlan = computed(() => {
    const planId = this._selectedPlanId();
    return planId ? this._workoutPlans().find(p => p.id === planId) || null : null;
  });
  public isOffline = computed(() => this._isOffline());

  constructor(
    private localStorageService: LocalStorageService,
    private offlineStorageService: OfflineStorageService
  ) {
    this.loadWorkoutPlans();
    this.setupOfflineHandling();
  }

  /**
   * Setup für Offline-Handling
   */
  private setupOfflineHandling(): void {
    this.offlineStorageService.setupOnlineOfflineListeners();

    // Online/Offline Status überwachen
    window.addEventListener('online', () => {
      this._isOffline.set(false);
      this.syncWithIndexedDB();
    });

    window.addEventListener('offline', () => {
      this._isOffline.set(true);
    });
  }

  /**
   * Synchronisiert Daten mit IndexedDB
   */
  private async syncWithIndexedDB(): Promise<void> {
    try {
      const currentPlans = this._workoutPlans();
      for (const plan of currentPlans) {
        await this.offlineStorageService.saveData('workoutPlans', plan);

        // Speichere auch die Übungen
        for (const exercise of plan.exercises) {
          await this.offlineStorageService.saveData('exercises', exercise);
        }
      }
    } catch (error) {
      console.error('Fehler beim Synchronisieren mit IndexedDB:', error);
    }
  }

  /**
   * Lädt alle Trainingspläne aus dem LocalStorage
   */
  private loadWorkoutPlans(): void {
    const plans = this.localStorageService.getItem<WorkoutPlan[]>(this.WORKOUT_PLANS_KEY);
    if (plans) {
      // Konvertiere Date-Strings zurück zu Date-Objekten
      const parsedPlans = plans.map(plan => ({
        ...plan,
        createdAt: new Date(plan.createdAt),
        updatedAt: new Date(plan.updatedAt),
        exercises: plan.exercises.map(exercise => ({
          ...exercise,
          createdAt: new Date(exercise.createdAt),
          updatedAt: new Date(exercise.updatedAt)
        }))
      }));
      this._workoutPlans.set(parsedPlans);
    }
  }

  /**
   * Speichert alle Trainingspläne im LocalStorage und IndexedDB
   */
  private async saveWorkoutPlans(): Promise<void> {
    this.localStorageService.setItem(this.WORKOUT_PLANS_KEY, this._workoutPlans());

    // Auch in IndexedDB speichern für Offline-Unterstützung
    if (!this._isOffline()) {
      await this.syncWithIndexedDB();
    }
  }

  /**
   * Erstellt einen neuen Trainingsplan
   */
  async createWorkoutPlan(planData: CreateWorkoutPlanDto): Promise<WorkoutPlan> {
    const newPlan: WorkoutPlan = {
      id: this.generateId(),
      ...planData,
      exercises: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this._workoutPlans.update(plans => [...plans, newPlan]);
    await this.saveWorkoutPlans();

    // Füge zur Offline-Queue hinzu wenn offline
    if (this._isOffline()) {
      await this.offlineStorageService.addToOfflineQueue('CREATE_WORKOUT_PLAN', newPlan);
    }

    return newPlan;
  }

  /**
   * Aktualisiert einen Trainingsplan
   */
  async updateWorkoutPlan(planId: string, updates: UpdateWorkoutPlanDto): Promise<WorkoutPlan | null> {
    const planIndex = this._workoutPlans().findIndex(p => p.id === planId);
    if (planIndex === -1) return null;

    this._workoutPlans.update(plans => {
      const updatedPlans = [...plans];
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        ...updates,
        updatedAt: new Date()
      };
      return updatedPlans;
    });

    this.saveWorkoutPlans();
    return this._workoutPlans()[planIndex];
  }

  /**
   * Löscht einen Trainingsplan
   */
  deleteWorkoutPlan(planId: string): boolean {
    const initialLength = this._workoutPlans().length;
    this._workoutPlans.update(plans => plans.filter(p => p.id !== planId));

    if (this._workoutPlans().length < initialLength) {
      // Falls der gelöschte Plan ausgewählt war, Auswahl zurücksetzen
      if (this._selectedPlanId() === planId) {
        this._selectedPlanId.set(null);
      }
      this.saveWorkoutPlans();
      return true;
    }
    return false;
  }

  /**
   * Setzt den aktuell ausgewählten Trainingsplan
   */
  selectWorkoutPlan(planId: string | null): void {
    this._selectedPlanId.set(planId);
  }

  /**
   * Fügt eine Übung zu einem Trainingsplan hinzu
   */
  addExercise(planId: string, exerciseData: CreateExerciseDto): Exercise | null {
    const planIndex = this._workoutPlans().findIndex(p => p.id === planId);
    if (planIndex === -1) return null;

    const newExercise: Exercise = {
      id: this.generateId(),
      ...exerciseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this._workoutPlans.update(plans => {
      const updatedPlans = [...plans];
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        exercises: [...updatedPlans[planIndex].exercises, newExercise],
        updatedAt: new Date()
      };
      return updatedPlans;
    });

    this.saveWorkoutPlans();
    return newExercise;
  }

  /**
   * Aktualisiert eine Übung
   */
  updateExercise(planId: string, exerciseId: string, updates: UpdateExerciseDto): Exercise | null {
    const planIndex = this._workoutPlans().findIndex(p => p.id === planId);
    if (planIndex === -1) return null;

    const plan = this._workoutPlans()[planIndex];
    const exerciseIndex = plan.exercises.findIndex(e => e.id === exerciseId);
    if (exerciseIndex === -1) return null;

    this._workoutPlans.update(plans => {
      const updatedPlans = [...plans];
      const updatedExercises = [...updatedPlans[planIndex].exercises];
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        ...updates,
        updatedAt: new Date()
      };
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        exercises: updatedExercises,
        updatedAt: new Date()
      };
      return updatedPlans;
    });

    this.saveWorkoutPlans();
    return this._workoutPlans()[planIndex].exercises[exerciseIndex];
  }

  /**
   * Löscht eine Übung aus einem Trainingsplan
   */
  deleteExercise(planId: string, exerciseId: string): boolean {
    const planIndex = this._workoutPlans().findIndex(p => p.id === planId);
    if (planIndex === -1) return false;

    const plan = this._workoutPlans()[planIndex];
    const initialLength = plan.exercises.length;

    this._workoutPlans.update(plans => {
      const updatedPlans = [...plans];
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        exercises: updatedPlans[planIndex].exercises.filter(e => e.id !== exerciseId),
        updatedAt: new Date()
      };
      return updatedPlans;
    });

    if (this._workoutPlans()[planIndex].exercises.length < initialLength) {
      this.saveWorkoutPlans();
      return true;
    }
    return false;
  }

  /**
   * Generiert eine eindeutige ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Exportiert alle Daten als JSON
   */
  exportData(): string {
    return JSON.stringify(this._workoutPlans(), null, 2);
  }

  /**
   * Importiert Daten aus JSON
   */
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as WorkoutPlan[];
      // Validierung der importierten Daten
      if (!Array.isArray(data)) return false;

      this._workoutPlans.set(data);
      this.saveWorkoutPlans();
      return true;
    } catch (error) {
      console.error('Fehler beim Importieren der Daten:', error);
      return false;
    }
  }

  /**
   * Löscht alle Trainingspläne
   */
  clearAllData(): void {
    this._workoutPlans.set([]);
    this._selectedPlanId.set(null);
    this.localStorageService.removeItem(this.WORKOUT_PLANS_KEY);
  }
}