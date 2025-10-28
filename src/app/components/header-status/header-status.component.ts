import { Component } from '@angular/core';

@Component({
    selector: 'app-header-status',
    standalone: true,
    template: `
    <div class="header-status">
      <!-- PWA Status Button -->
      <button class="mode-badge" title="App-Status">
        <span class="material-icons">web</span>
      </button>
    </div>
  `,
    styles: [`
    .header-status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mode-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mode-badge:hover {
      transform: scale(1.05);
      background: rgba(255, 255, 255, 0.3);
    }

    .mode-badge .material-icons {
      font-size: 18px;
    }

    @media (max-width: 480px) {
      .mode-badge {
        width: 32px;
        height: 32px;
      }
      
      .mode-badge .material-icons {
        font-size: 16px;
      }
    }
  `]
})
export class HeaderStatusComponent {
    // Einfache Status-Komponente ohne komplexe PWA-Logik
}
