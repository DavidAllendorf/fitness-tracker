import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { CreateExerciseDto, UpdateExerciseDto, Exercise, WorkoutPlan, Set, createEmptySet, createEmptySets } from '../../models/workout.models';

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
  protected newExerciseRestTime = signal(60);
  protected newExerciseNotes = signal('');

  // Form signals für Plan bearbeiten
  protected editPlanName = signal('');
  protected editPlanDescription = signal('');

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
    this.newExerciseRestTime.set(60);
    this.newExerciseNotes.set('');
  }

  /**
   * Erstellt eine neue Übung
   */
  createExercise(): void {
    const planId = this.planId();
    if (!planId || !this.newExerciseName().trim()) return;

    // Erstelle standardmäßig nur 1 leeren Satz
    const sets: Set[] = [createEmptySet()];

    const exerciseData: CreateExerciseDto = {
      name: this.newExerciseName().trim(),
      sets: sets,
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

    // Bestehende Sätze beibehalten
    const updates: UpdateExerciseDto = {
      name: this.newExerciseName().trim(),
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
      description: this.editPlanDescription().trim() || undefined
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
   * Aktualisiert einen einzelnen Satz
   */
  updateSet(exercise: Exercise, setId: string, field: 'reps' | 'weight', value: number): void {
    const planId = this.planId();
    if (!planId) return;

    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, [field]: value } : set
    );

    const updates: UpdateExerciseDto = { sets: updatedSets };
    this.workoutService.updateExercise(planId, exercise.id, updates);
  }

  /**
   * Fügt einen neuen Satz zu einer Übung hinzu
   */
  addSet(exercise: Exercise): void {
    const planId = this.planId();
    if (!planId) return;

    // Standard-Werte basierend auf dem letzten Satz oder Defaults
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = createEmptySet(
      lastSet?.reps || 10,
      lastSet?.weight || 20
    );

    const updatedSets = [...exercise.sets, newSet];
    const updates: UpdateExerciseDto = { sets: updatedSets };

    this.workoutService.updateExercise(planId, exercise.id, updates);
  }

  /**
   * Entfernt den letzten Satz einer Übung
   */
  removeLastSet(exercise: Exercise): void {
    const planId = this.planId();
    if (!planId || exercise.sets.length <= 1) return;

    const updatedSets = exercise.sets.slice(0, -1); // Entferne letzten Satz
    const updates: UpdateExerciseDto = { sets: updatedSets };

    this.workoutService.updateExercise(planId, exercise.id, updates);
  }

  /**
   * Dupliziert eine Übung
   */
  duplicateExercise(exercise: Exercise): void {
    const planId = this.planId();
    if (!planId) return;

    // Sätze kopieren
    const copiedSets: Set[] = exercise.sets.map(set => ({
      id: crypto.randomUUID(),
      reps: set.reps,
      weight: set.weight,
      completed: false,
      notes: set.notes
    }));

    const exerciseData: CreateExerciseDto = {
      name: `${exercise.name} (Kopie)`,
      sets: copiedSets,
      restTime: exercise.restTime,
      notes: exercise.notes
    };

    this.workoutService.addExercise(planId, exerciseData);
  }

  // Hilfsmethode um zu prüfen, ob der Exercise-Name wahrscheinlich nur eine Zeile benötigt
  protected isExerciseNameSingleLine(exerciseName: string): boolean {
    // Einfache Heuristik: Namen unter 25 Zeichen sind meist einzeilig
    // Dies kann je nach Schriftgröße und Container-Breite angepasst werden
    return exerciseName.length <= 25;
  }
}