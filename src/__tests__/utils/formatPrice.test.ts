import { describe, it, expect } from 'vitest';
import { formatPrice, formatPriceCompact } from '../../utils/formatPrice';

describe('formatPrice', () => {
  it('retourne "GRATUIT" pour 0', () => {
    expect(formatPrice(0)).toBe('GRATUIT');
    expect(formatPrice('0')).toBe('GRATUIT');
  });

  it('formate avec séparateur de milliers et devise FCFA par défaut', () => {
    expect(formatPrice(5000)).toMatch(/5[\s\u202f]?000\s*FCFA/);
  });

  it('accepte une devise personnalisée', () => {
    expect(formatPrice(1000, 'XAF')).toMatch(/XAF/);
  });

  it('accepte une valeur string numérique', () => {
    expect(formatPrice('2500')).toMatch(/2[\s\u202f]?500\s*FCFA/);
  });
});

describe('formatPriceCompact', () => {
  it('retourne "GRATUIT" pour 0', () => {
    expect(formatPriceCompact(0)).toBe('GRATUIT');
  });

  it('compacte les valeurs >= 1000 en "k FCFA"', () => {
    expect(formatPriceCompact(5000)).toBe('5k FCFA');
    expect(formatPriceCompact(10000)).toBe('10k FCFA');
  });

  it('affiche les valeurs < 1000 telles quelles', () => {
    expect(formatPriceCompact(500)).toBe('500 FCFA');
    expect(formatPriceCompact(999)).toBe('999 FCFA');
  });
});
