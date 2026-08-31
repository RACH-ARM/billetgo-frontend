import { describe, it, expect } from 'vitest';
import { availabilityLevel, categoryAvailabilityLevel } from '../../utils/availability';

describe('availabilityLevel', () => {
  it('retourne "Complet" à 100% et plus', () => {
    expect(availabilityLevel(100).label).toBe('Complet');
    expect(availabilityLevel(110).label).toBe('Complet');
    expect(availabilityLevel(100).pulse).toBe(false);
  });

  it('retourne "Presque complet" entre 90% et 99%', () => {
    expect(availabilityLevel(90).label).toBe('Presque complet');
    expect(availabilityLevel(95).label).toBe('Presque complet');
    expect(availabilityLevel(90).pulse).toBe(true);
  });

  it('retourne "Dernières places" entre 75% et 89%', () => {
    expect(availabilityLevel(75).label).toBe('Dernières places');
    expect(availabilityLevel(89).label).toBe('Dernières places');
    expect(availabilityLevel(75).pulse).toBe(false);
  });

  it('retourne "Places limitées" entre 50% et 74%', () => {
    expect(availabilityLevel(50).label).toBe('Places limitées');
    expect(availabilityLevel(74).label).toBe('Places limitées');
  });

  it('retourne "Disponible" en dessous de 50%', () => {
    expect(availabilityLevel(0).label).toBe('Disponible');
    expect(availabilityLevel(49).label).toBe('Disponible');
    expect(availabilityLevel(0).pulse).toBe(false);
  });
});

describe('categoryAvailabilityLevel', () => {
  it('retourne "Complet" si available <= 0', () => {
    expect(categoryAvailabilityLevel(0, 100).label).toBe('Complet');
    expect(categoryAvailabilityLevel(-5, 100).label).toBe('Complet');
  });

  it('retourne "Disponible" si beaucoup de places restantes', () => {
    expect(categoryAvailabilityLevel(80, 100).label).toBe('Disponible');
  });

  it('retourne "Places limitées" autour de 50% de remplissage', () => {
    expect(categoryAvailabilityLevel(40, 100).label).toBe('Places limitées');
  });

  it('retourne "Dernières places" autour de 75-90% de remplissage', () => {
    expect(categoryAvailabilityLevel(15, 100).label).toBe('Dernières places');
  });

  it('retourne "Presque complet" au-delà de 90% de remplissage', () => {
    expect(categoryAvailabilityLevel(5, 100).label).toBe('Presque complet');
    expect(categoryAvailabilityLevel(5, 100).pulse).toBe(true);
  });

  it('retourne "Disponible" si total = 0 (pas de division par zéro)', () => {
    expect(categoryAvailabilityLevel(1, 0).label).toBe('Disponible');
  });
});
