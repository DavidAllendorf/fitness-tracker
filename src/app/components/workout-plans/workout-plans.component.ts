import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutService } from '../../services/workout.service';
import { CreateWorkoutPlanDto } from '../../models/workout.models';

@Component({
  selector: 'app-workout-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workout-plans.component.html',
  styleUrl: './workout-plans.component.css'
})
export class WorkoutPlansComponent {
  // Signals für reactive state
  protected showCreateForm = signal(false);
  protected newPlanName = signal('');
  protected newPlanDescription = signal('');
  protected isActive = signal(true);

  constructor(
    protected workoutService: WorkoutService,
    private router: Router
  ) { }

  /**
   * Zeigt das Formular zum Erstellen eines neuen Plans an
   */
  showCreatePlanForm(): void {
    this.showCreateForm.set(true);
    this.resetForm();
  }

  /**
   * Versteckt das Erstellungsformular
   */
  hideCreatePlanForm(): void {
    this.showCreateForm.set(false);
    this.resetForm();
  }

  /**
   * Setzt das Formular zurück
   */
  private resetForm(): void {
    this.newPlanName.set('');
    this.newPlanDescription.set('');
    this.isActive.set(true);
  }

  /**
   * Erstellt einen neuen Trainingsplan
   */
  async createPlan(): Promise<void> {
    const name = this.newPlanName().trim();
    if (!name) return;

    const planData: CreateWorkoutPlanDto = {
      name,
      description: this.newPlanDescription().trim() || undefined,
      isActive: this.isActive()
    };

    const newPlan = await this.workoutService.createWorkoutPlan(planData);
    if (newPlan) {
      this.hideCreatePlanForm();
      // Automatisch zum neuen Plan navigieren
      this.viewPlan(newPlan.id);
    }
  }

  /**
   * Navigiert zur Detailansicht eines Plans
   */
  viewPlan(planId: string): void {
    this.workoutService.selectWorkoutPlan(planId);
    this.router.navigate(['/plans', planId]);
  }

  /**
   * Löscht einen Trainingsplan nach Bestätigung
   */
  deletePlan(planId: string, planName: string): void {
    if (confirm(`Möchten Sie den Trainingsplan "${planName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      this.workoutService.deleteWorkoutPlan(planId);
    }
  }

  /**
   * Schaltet den aktiven Status eines Plans um
   */
  togglePlanStatus(planId: string): void {
    const plan = this.workoutService.workoutPlans().find(p => p.id === planId);
    if (plan) {
      this.workoutService.updateWorkoutPlan(planId, { isActive: !plan.isActive });
    }
  }

  /**
   * Formatiert ein Datum für die Anzeige
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Exportiert alle Trainingspläne
   */
  exportPlans(): void {
    const data = this.workoutService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trainingsplaene_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Importiert Trainingspläne aus einer Datei
   */
  importPlans(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (this.workoutService.importData(content)) {
        alert('Trainingspläne erfolgreich importiert!');
      } else {
        alert('Fehler beim Importieren der Trainingspläne. Bitte überprüfen Sie das Dateiformat.');
      }
    };
    reader.readAsText(file);

    // Input zurücksetzen für wiederholte Imports
    input.value = '';
  }

  /**
   * Löscht alle Trainingspläne nach Bestätigung
   */
  clearAllPlans(): void {
    if (confirm('Möchten Sie wirklich ALLE Trainingspläne löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      if (confirm('Sind Sie sicher? Alle Ihre Trainingspläne und Übungen werden unwiderruflich gelöscht!')) {
        this.workoutService.clearAllData();
      }
    }
  }
}