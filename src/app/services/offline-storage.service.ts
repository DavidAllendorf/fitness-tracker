import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OfflineStorageService {
    private dbName = 'FitTrackerDB';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;

    constructor() {
        this.initDB();
    }

    /**
     * Initialisiert die IndexedDB
     */
    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Fehler beim Öffnen der IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB erfolgreich geöffnet');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Workout Plans Store
                if (!db.objectStoreNames.contains('workoutPlans')) {
                    const workoutStore = db.createObjectStore('workoutPlans', { keyPath: 'id' });
                    workoutStore.createIndex('lastModified', 'lastModified', { unique: false });
                }

                // Exercises Store
                if (!db.objectStoreNames.contains('exercises')) {
                    const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
                    exerciseStore.createIndex('workoutPlanId', 'workoutPlanId', { unique: false });
                }

                // Offline Queue Store für Sync
                if (!db.objectStoreNames.contains('offlineQueue')) {
                    const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('timestamp', 'timestamp', { unique: false });
                    queueStore.createIndex('action', 'action', { unique: false });
                }

                console.log('IndexedDB Stores erstellt');
            };
        });
    }

    /**
     * Speichert Daten in IndexedDB
     */
    async saveData(storeName: string, data: any): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not available');
                return;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            // Füge Zeitstempel hinzu
            const dataWithTimestamp = {
                ...data,
                lastModified: new Date().toISOString()
            };

            const request = store.put(dataWithTimestamp);

            request.onsuccess = () => {
                console.log('Daten erfolgreich in IndexedDB gespeichert:', storeName);
                resolve();
            };

            request.onerror = () => {
                console.error('Fehler beim Speichern in IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Lädt Daten aus IndexedDB
     */
    async loadData(storeName: string, key?: string): Promise<any> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not available');
                return;
            }

            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            let request: IDBRequest;
            if (key) {
                request = store.get(key);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Fehler beim Laden aus IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Löscht Daten aus IndexedDB
     */
    async deleteData(storeName: string, key: string): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('Database not available');
                return;
            }

            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                console.log('Daten erfolgreich aus IndexedDB gelöscht');
                resolve();
            };

            request.onerror = () => {
                console.error('Fehler beim Löschen aus IndexedDB:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Fügt eine Aktion zur Offline-Queue hinzu
     */
    async addToOfflineQueue(action: string, data: any): Promise<void> {
        const queueItem = {
            action,
            data,
            timestamp: new Date().toISOString(),
            synced: false
        };

        await this.saveData('offlineQueue', queueItem);

        // Versuche sofort zu synchronisieren wenn online
        if (navigator.onLine) {
            this.processOfflineQueue();
        }
    }

    /**
     * Verarbeitet die Offline-Queue
     */
    async processOfflineQueue(): Promise<void> {
        try {
            const queueItems = await this.loadData('offlineQueue');

            for (const item of queueItems.filter((i: any) => !i.synced)) {
                try {
                    // Hier würden Sie die API-Calls machen
                    console.log('Processing offline queue item:', item);

                    // Simuliere erfolgreiche Synchronisation
                    await this.markQueueItemAsSynced(item.id);

                } catch (error) {
                    console.error('Fehler beim Synchronisieren von Queue Item:', error);
                }
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten der Offline-Queue:', error);
        }
    }

    /**
     * Markiert ein Queue-Item als synchronisiert
     */
    private async markQueueItemAsSynced(id: string): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['offlineQueue'], 'readwrite');
            const store = transaction.objectStore('offlineQueue');

            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.synced = true;
                    const putRequest = store.put(item);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                }
            };
        });
    }

    /**
     * Prüft ob die App offline ist
     */
    isOffline(): boolean {
        return !navigator.onLine;
    }

    /**
     * Registriert Online/Offline Event Listener
     */
    setupOnlineOfflineListeners(): void {
        window.addEventListener('online', () => {
            console.log('App ist wieder online');
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            console.log('App ist offline');
        });
    }

    /**
     * Exportiert alle Daten für Backup
     */
    async exportAllData(): Promise<any> {
        try {
            const workoutPlans = await this.loadData('workoutPlans');
            const exercises = await this.loadData('exercises');

            return {
                workoutPlans,
                exercises,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Fehler beim Exportieren der Daten:', error);
            throw error;
        }
    }

    /**
     * Importiert Daten von einem Backup
     */
    async importData(backupData: any): Promise<void> {
        try {
            if (backupData.workoutPlans) {
                for (const plan of backupData.workoutPlans) {
                    await this.saveData('workoutPlans', plan);
                }
            }

            if (backupData.exercises) {
                for (const exercise of backupData.exercises) {
                    await this.saveData('exercises', exercise);
                }
            }

            console.log('Daten erfolgreich importiert');
        } catch (error) {
            console.error('Fehler beim Importieren der Daten:', error);
            throw error;
        }
    }
}