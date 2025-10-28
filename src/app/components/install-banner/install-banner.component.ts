import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
    selector: 'app-install-banner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="install-banner" *ngIf="showBanner && isInstallable">
      <div class="banner-content">
        <div class="banner-icon">
          <span class="material-icons">get_app</span>
        </div>
        <div class="banner-text">
          <h3>FitTracker installieren</h3>
          <p>Installieren Sie die App für eine bessere Nutzererfahrung</p>
        </div>
        <div class="banner-actions">
          <button class="install-button" (click)="installApp()">
            Installieren
          </button>
          <button class="dismiss-button" (click)="dismissBanner()">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .install-banner {
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      z-index: 1000;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--gray-200);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .banner-icon {
      color: var(--blue-600);
    }

    .banner-text {
      flex: 1;
    }

    .banner-text h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--gray-900);
    }

    .banner-text p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      color: var(--gray-600);
    }

    .banner-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .install-button {
      background: var(--blue-600);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .install-button:hover {
      background: var(--blue-700);
    }

    .dismiss-button {
      background: none;
      border: none;
      color: var(--gray-400);
      cursor: pointer;
      padding: 0.25rem;
      display: flex;
      align-items: center;
      border-radius: 0.25rem;
      transition: color 0.2s;
    }

    .dismiss-button:hover {
      color: var(--gray-600);
    }

    .material-icons {
      font-size: 1.25rem;
    }

    @media (min-width: 640px) {
      .install-banner {
        max-width: 24rem;
        left: auto;
        right: 1rem;
      }
    }
  `]
})
export class InstallBannerComponent implements OnInit {
    showBanner = false;
    isInstallable = false;

    constructor(private pwaService: PwaService) { }

    ngOnInit(): void {
        // Prüfen ob die App installierbar ist
        this.isInstallable = this.pwaService.isInstallable();

        // Banner nur anzeigen wenn die App installierbar ist und noch nicht installiert
        if (this.isInstallable && !this.pwaService.isInstalled()) {
            // Banner nach kurzer Verzögerung anzeigen
            setTimeout(() => {
                this.showBanner = true;
            }, 2000);
        }
    }

    async installApp(): Promise<void> {
        try {
            await this.pwaService.installPwa();
            this.showBanner = false;
        } catch (error) {
            console.error('Installation failed:', error);
        }
    }

    dismissBanner(): void {
        this.showBanner = false;
        // Banner für diese Session nicht mehr anzeigen
        sessionStorage.setItem('installBannerDismissed', 'true');
    }
}