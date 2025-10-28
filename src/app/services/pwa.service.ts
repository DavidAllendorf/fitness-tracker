import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PwaService {
    private deferredPrompt: any;

    constructor() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
        });
    }

    public isInstallable(): boolean {
        return this.deferredPrompt !== undefined;
    }

    public async installPwa(): Promise<void> {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
        }
    }

    public isInstalled(): boolean {
        return window.matchMedia('(display-mode: standalone)').matches;
    }
}