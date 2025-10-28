import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { CreateExerciseDto, UpdateExerciseDto, Exercise, WorkoutPlan } from '../../models/workout.models';

@Component({
  selector: 'app-workout-plan-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout-plan-detail.component.html',
  styleUrl: './workout-plan-detail.component.css'
})
export class WorkoutPlanDetailComponent implements OnInit {
  // Signals für reactive state
  protected planId = signal<string | null>(null);
  protected showCreateExerciseForm = signal(false);
  protected editingExercise = signal<Exercise | null>(null);
  protected showEditPlanForm = signal(false);

  // Form signals für neue Übung
  protected newExerciseName = signal('');
  protected newExerciseSets = signal(3);
  protected newExerciseReps = signal(10);
  protected newExerciseWeight = signal(20);
  protected newExerciseRestTime = signal(60);
  protected newExerciseNotes = signal('');

  // Form signals für Plan bearbeiten
  protected editPlanName = signal('');
  protected editPlanDescription = signal('');
  protected editPlanIsActive = signal(true);

  // Computed properties
  protected currentPlan = computed(() => {
    const id = this.planId();
    return id ? this.workoutService.workoutPlans().find(p => p.id === id) || null : null;
  });

  constructor(
    protected workoutService: WorkoutService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.planId.set(id);
      this.workoutService.selectWorkoutPlan(id);

      // Prüfen ob Plan existiert
      if (!this.currentPlan()) {
        this.router.navigate(['/']);
      }
    });
  }

  /**
   * Navigiert zurück zur Übersicht
   */
  goBack(): void {
    this.router.navigate(['/']);
  }

  /**
   * Zeigt das Formular zum Erstellen einer neuen Übung
   */
  showCreateExercise(): void {
    this.showCreateExerciseForm.set(true);
    this.resetExerciseForm();
  }

  /**
   * Versteckt das Formular für neue Übungen
   */
  hideCreateExercise(): void {
    this.showCreateExerciseForm.set(false);
    this.resetExerciseForm();
  }

  /**
   * Setzt das Übungsformular zurück
   */
  private resetExerciseForm(): void {
    this.newExerciseName.set('');
    this.newExerciseSets.set(3);
    this.newExerciseReps.set(10);
    this.newExerciseWeight.set(20);
    this.newExerciseRestTime.set(60);
    this.newExerciseNotes.set('');
  }

  /**
   * Erstellt eine neue Übung
   */
  createExercise(): void {
    const planId = this.planId();
    if (!planId || !this.newExerciseName().trim()) return;

    const exerciseData: CreateExerciseDto = {
      name: this.newExerciseName().trim(),
      sets: this.newExerciseSets(),
      reps: this.newExerciseReps(),
      weight: this.newExerciseWeight(),
      restTime: this.newExerciseRestTime() || undefined,
      notes: this.newExerciseNotes().trim() || undefined
    };

    const newExercise = this.workoutService.addExercise(planId, exerciseData);
    if (newExercise) {
      this.hideCreateExercise();
    }
  }

  /**
   * Startet die Bearbeitung einer Übung
   */
  startEditExercise(exercise: Exercise): void {
    this.editingExercise.set(exercise);
    // Formular mit aktuellen Werten füllen
    this.newExerciseName.set(exercise.name);
    this.newExerciseSets.set(exercise.sets);
    this.newExerciseReps.set(exercise.reps);
    this.newExerciseWeight.set(exercise.weight);
    this.newExerciseRestTime.set(exercise.restTime || 60);
    this.newExerciseNotes.set(exercise.notes || '');
  }

  /**
   * Bricht die Bearbeitung einer Übung ab
   */
  cancelEditExercise(): void {
    this.editingExercise.set(null);
    this.resetExerciseForm();
  }

  /**
   * Speichert die Änderungen an einer Übung
   */
  saveExercise(): void {
    const planId = this.planId();
    const exercise = this.editingExercise();
    if (!planId || !exercise || !this.newExerciseName().trim()) return;

    const updates: UpdateExerciseDto = {
      name: this.newExerciseName().trim(),
      sets: this.newExerciseSets(),
      reps: this.newExerciseReps(),
      weight: this.newExerciseWeight(),
      restTime: this.newExerciseRestTime() || undefined,
      notes: this.newExerciseNotes().trim() || undefined
    };

    const updatedExercise = this.workoutService.updateExercise(planId, exercise.id, updates);
    if (updatedExercise) {
      this.cancelEditExercise();
    }
  }

  /**
   * Löscht eine Übung
   */
  deleteExercise(exerciseId: string, exerciseName: string): void {
    const planId = this.planId();
    if (!planId) return;

    if (confirm(`Möchten Sie die Übung "${exerciseName}" wirklich löschen?`)) {
      this.workoutService.deleteExercise(planId, exerciseId);
    }
  }

  /**
   * Zeigt das Formular zum Bearbeiten des Plans
   */
  showEditPlan(): void {
    const plan = this.currentPlan();
    if (!plan) return;

    this.editPlanName.set(plan.name);
    this.editPlanDescription.set(plan.description || '');
    this.editPlanIsActive.set(plan.isActive);
    this.showEditPlanForm.set(true);
  }

  /**
   * Versteckt das Plan-Bearbeitungsformular
   */
  hideEditPlan(): void {
    this.showEditPlanForm.set(false);
  }

  /**
   * Speichert die Änderungen am Plan
   */
  async savePlan(): Promise<void> {
    const planId = this.planId();
    if (!planId || !this.editPlanName().trim()) return;

    const updates = {
      name: this.editPlanName().trim(),
      description: this.editPlanDescription().trim() || undefined,
      isActive: this.editPlanIsActive()
    };

    const updatedPlan = await this.workoutService.updateWorkoutPlan(planId, updates);
    if (updatedPlan) {
      this.hideEditPlan();
    }
  }

  /**
   * Formatiert die Pausenzeit für die Anzeige
   */
  formatRestTime(seconds?: number): string {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  /**
   * Formatiert ein Datum für die Anzeige
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Berechnet das Gesamtvolumen einer Übung
   */
  calculateVolume(exercise: Exercise): number {
    return exercise.sets * exercise.reps * exercise.weight;
  }

  /**
   * Berechnet das Gesamtvolumen des Plans
   */
  calculateTotalVolume(): number {
    const plan = this.currentPlan();
    if (!plan) return 0;
    return plan.exercises.reduce((total, exercise) => total + this.calculateVolume(exercise), 0);
  }

  /**
   * Dupliziert eine Übung
   */
  duplicateExercise(exercise: Exercise): void {
    const planId = this.planId();
    if (!planId) return;

    const exerciseData: CreateExerciseDto = {
      name: `${exercise.name} (Kopie)`,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      restTime: exercise.restTime,
      notes: exercise.notes
    };

    this.workoutService.addExercise(planId, exerciseData);
  }
}