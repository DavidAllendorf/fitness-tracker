import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
    selector: 'app-pwa-status',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="pwa-status" *ngIf="showStatus">
      <div class="status-indicator" [class.installed]="isInstalled" [class.installable]="isInstallable">
        <span class="material-icons">
          {{ isInstalled ? 'smartphone' : (isInstallable ? 'get_app' : 'web') }}
        </span>
        <span class="status-text">
          {{ isInstalled ? 'App installiert' : (isInstallable ? 'App installierbar' : 'Web-Version') }}
        </span>
      </div>
    </div>
  `,
    styles: [`
    .pwa-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 0.375rem;
      background-color: var(--gray-100);
      color: var(--gray-700);
      font-size: 0.875rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .status-indicator.installed {
      color: var(--green-600);
    }

    .status-indicator.installable {
      color: var(--blue-600);
    }

    .material-icons {
      font-size: 1rem;
    }
  `]
})
export class PwaStatusComponent implements OnInit {
    isInstalled = false;
    isInstallable = false;
    showStatus = true;

    constructor(private pwaService: PwaService) { }

    ngOnInit(): void {
        this.isInstalled = this.pwaService.isInstalled();
        this.isInstallable = this.pwaService.isInstallable();
    }
}