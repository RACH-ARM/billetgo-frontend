import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isEventLive, isEventComingSoon } from '../../utils/eventStatus';

// Figer l'horloge à 2025-06-01T12:00:00Z pour tous les tests
const NOW = new Date('2025-06-01T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isEventLive', () => {
  it('retourne true quand on est entre doorsOpenAt et endDate', () => {
    const eventDate = '2025-06-01T10:00:00Z';
    const doors = '2025-06-01T11:00:00Z'; // ouvert à 11h, now = 12h
    const end = '2025-06-01T15:00:00Z';   // se termine à 15h
    expect(isEventLive(eventDate, doors, end)).toBe(true);
  });

  it('retourne false avant l\'ouverture des portes', () => {
    const eventDate = '2025-06-01T10:00:00Z';
    const doors = '2025-06-01T14:00:00Z'; // ouverture à 14h, now = 12h
    const end = '2025-06-01T20:00:00Z';
    expect(isEventLive(eventDate, doors, end)).toBe(false);
  });

  it('retourne false après la fin de l\'événement', () => {
    const eventDate = '2025-06-01T08:00:00Z';
    const doors = '2025-06-01T09:00:00Z';
    const end = '2025-06-01T11:00:00Z';   // terminé à 11h, now = 12h
    expect(isEventLive(eventDate, doors, end)).toBe(false);
  });

  it('utilise eventDate comme début si doorsOpenAt est null', () => {
    // eventDate = 11h, endDate = 14h → now (12h) est dedans
    const eventDate = '2025-06-01T11:00:00Z';
    const end = '2025-06-01T14:00:00Z';
    expect(isEventLive(eventDate, null, end)).toBe(true);
  });

  it('calcule une durée de 4h si endDate est null', () => {
    // eventDate = 10h → fin implicite = 14h → now (12h) est dedans
    const eventDate = '2025-06-01T10:00:00Z';
    expect(isEventLive(eventDate, null, null)).toBe(true);
  });

  it('retourne false si endDate null et more than 4h après eventDate', () => {
    // eventDate = 06h → fin implicite = 10h → now (12h) est après
    const eventDate = '2025-06-01T06:00:00Z';
    expect(isEventLive(eventDate, null, null)).toBe(false);
  });
});

describe('isEventComingSoon', () => {
  it('retourne true quand on est après eventDate mais avant doorsOpenAt', () => {
    // eventDate = 11h (passé), doors = 13h (pas encore) → "bientôt"
    const eventDate = '2025-06-01T11:00:00Z';
    const doors = '2025-06-01T13:00:00Z';
    expect(isEventComingSoon(eventDate, doors)).toBe(true);
  });

  it('retourne false si doorsOpenAt est null', () => {
    expect(isEventComingSoon('2025-06-01T11:00:00Z', null)).toBe(false);
  });

  it('retourne false si on est avant eventDate', () => {
    // eventDate = 14h (futur) → pas encore "coming soon"
    const eventDate = '2025-06-01T14:00:00Z';
    const doors = '2025-06-01T15:00:00Z';
    expect(isEventComingSoon(eventDate, doors)).toBe(false);
  });

  it('retourne false si on est après doorsOpenAt', () => {
    // eventDate = 09h (passé), doors = 10h (passé) → déjà ouvert
    const eventDate = '2025-06-01T09:00:00Z';
    const doors = '2025-06-01T10:00:00Z';
    expect(isEventComingSoon(eventDate, doors)).toBe(false);
  });
});
