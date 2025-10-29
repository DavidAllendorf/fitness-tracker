# Changelog - Fitness Tracker

## Version 2.0.0 (29.10.2025)

### 🚀 Neue Features
- **Individuelle Gewichte pro Satz**: Jeder Satz kann jetzt ein eigenes Gewicht haben
- **Detaillierte Sätze-Ansicht**: Übersicht über alle Sätze mit Wiederholungen und Gewicht
- **Flexible Satz-Verwaltung**: Hinzufügen, Bearbeiten und Entfernen einzelner Sätze

### 🔄 Breaking Changes
- **Modell-Änderung**: Das `Exercise`-Interface wurde komplett überarbeitet
  - `sets: number` → `sets: Set[]`
  - `reps: number` → entfernt (jetzt pro Satz)
  - `weight: number` → entfernt (jetzt pro Satz)

### 🛠️ Technische Verbesserungen
- Neues `Set`-Interface für individuelle Sätze
- Hilfsfunktionen `createEmptySet()` und `createEmptySets()`
- Erweiterte UI für Sätze-Details mit Zusammenfassung
- Verbesserte TypeScript-Typen und DTOs

### 📱 UI/UX Verbesserungen
- Neue Sätze-Detail-Ansicht in den Übungen
- Zusammenfassung der Sätze (z.B. "3x 8-12 @ 20-25kg")
- Responsive Design für Sätze-Ansicht
- Klarere Labels in den Formularen

### 🔧 Interne Änderungen
- Anpassung der WorkoutService-Methoden
- Überarbeitung der Komponenten-Logik
- Neue CSS-Klassen für Sätze-Styling
- Erweiterte Form-Validierung

## Upgrade-Hinweise

Bei bestehenden Daten wird automatisch eine Migration durchgeführt:
- Bestehende Übungen werden in das neue Format konvertiert
- Alle Sätze erhalten die ursprünglichen Werte für Wiederholungen und Gewicht
- Keine manuellen Schritte erforderlich

## Beispiel für neue Struktur

```typescript
// Alte Struktur
const exercise = {
  sets: 3,
  reps: 10,
  weight: 20
};

// Neue Struktur
const exercise = {
  sets: [
    { id: '1', reps: 10, weight: 20 },
    { id: '2', reps: 8, weight: 22.5 },
    { id: '3', reps: 6, weight: 25 }
  ]
};
```