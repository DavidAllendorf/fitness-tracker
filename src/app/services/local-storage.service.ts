import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  
  constructor() { }

  /**
   * Speichert ein Objekt im LocalStorage
   * @param key Der Schlüssel unter dem das Objekt gespeichert wird
   * @param value Das zu speichernde Objekt
   */
  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Fehler beim Speichern in LocalStorage:', error);
    }
  }

  /**
   * Lädt ein Objekt aus dem LocalStorage
   * @param key Der Schlüssel des gespeicherten Objekts
   * @returns Das geladene Objekt oder null falls nicht gefunden
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Fehler beim Laden aus LocalStorage:', error);
      return null;
    }
  }

  /**
   * Entfernt ein Element aus dem LocalStorage
   * @param key Der Schlüssel des zu entfernenden Elements
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Fehler beim Entfernen aus LocalStorage:', error);
    }
  }

  /**
   * Prüft ob ein Schlüssel im LocalStorage existiert
   * @param key Der zu prüfende Schlüssel
   * @returns true wenn der Schlüssel existiert, sonst false
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Löscht alle Daten aus dem LocalStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Fehler beim Löschen des LocalStorage:', error);
    }
  }

  /**
   * Gibt alle Schlüssel des LocalStorage zurück
   * @returns Array mit allen Schlüsseln
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der LocalStorage-Schlüssel:', error);
    }
    return keys;
  }
}