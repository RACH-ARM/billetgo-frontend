import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatEventDate,
  formatDateShort,
  formatTimeUntil,
  getCountdownParts,
} from '../../utils/formatDate';

// Date fixe : samedi 15 mars 2025 à 20h00 UTC+1 (Libreville)
const FIXED_DATE = '2025-03-15T19:00:00.000Z'; // 20h00 heure de Libreville

describe('formatEventDate', () => {
  it('retourne une date en français avec le jour, le mois et l\'heure', () => {
    const result = formatEventDate(FIXED_DATE);
    expect(result).toMatch(/samedi/i);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/mars/i);
    expect(result).toMatch(/2025/);
  });

  it('accepte un objet Date', () => {
    const result = formatEventDate(new Date(FIXED_DATE));
    expect(result).toContain('2025');
  });
});

describe('formatDateShort', () => {
  it('retourne le format jj/mm/aaaa', () => {
    // Date locale sans ambiguïté de fuseau : constructeur avec parties explicites
    const date = new Date(2025, 2, 15); // 15 mars 2025
    expect(formatDateShort(date)).toBe('15/03/2025');
  });
});

describe('formatTimeUntil', () => {
  it('retourne "Terminé" pour une date passée', () => {
    expect(formatTimeUntil('2000-01-01T00:00:00Z')).toBe('Terminé');
  });

  it('retourne une chaîne non vide pour une date future', () => {
    const result = formatTimeUntil('2099-12-31T00:00:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Terminé');
  });
});

describe('getCountdownParts', () => {
  beforeEach(() => {
    // Figer l'horloge à un instant précis
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne null pour une date passée', () => {
    expect(getCountdownParts('2024-12-31T23:59:59Z')).toBeNull();
  });

  it('retourne les bonnes parties pour une date future', () => {
    // Cible : 2 jours + 3 heures + 4 minutes + 5 secondes après l'heure fictive
    const target = new Date('2025-01-01T00:00:00.000Z');
    target.setSeconds(target.getSeconds() + 2 * 86400 + 3 * 3600 + 4 * 60 + 5);

    const parts = getCountdownParts(target.toISOString());
    expect(parts).not.toBeNull();
    expect(parts!.days).toBe(2);
    expect(parts!.hours).toBe(3);
    expect(parts!.minutes).toBe(4);
    expect(parts!.seconds).toBe(5);
  });

  it('retourne null quand diff = 0 (heure exacte)', () => {
    expect(getCountdownParts('2025-01-01T00:00:00.000Z')).toBeNull();
  });
});
