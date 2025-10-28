import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/workout-plans/workout-plans.component').then(m => m.WorkoutPlansComponent)
  },
  {
    path: 'plans/:id',
    loadComponent: () => import('./components/workout-plan-detail/workout-plan-detail.component').then(m => m.WorkoutPlanDetailComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
