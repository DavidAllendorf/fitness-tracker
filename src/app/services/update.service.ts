import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UpdateService {

    constructor(private swUpdate: SwUpdate) {
        if (swUpdate.isEnabled) {
            // Check for updates every 30 seconds
            setInterval(() => {
                swUpdate.checkForUpdate();
            }, 30000);

            // Listen for version updates
            swUpdate.versionUpdates.pipe(
                filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
            ).subscribe(() => {
                if (confirm('Eine neue Version ist verfügbar. Möchten Sie die App neu laden?')) {
                    window.location.reload();
                }
            });
        }
    }

    public promptUser(): void {
        if (this.swUpdate.isEnabled) {
            this.swUpdate.checkForUpdate().then(() => {
                console.log('Update check completed');
            });
        }
    }
}