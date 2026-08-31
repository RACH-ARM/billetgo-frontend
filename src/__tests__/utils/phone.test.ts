import { describe, it, expect } from 'vitest';
import { normalizeGabonPhone, isValidGabonPhone, isPhoneMatchingProvider } from '../../utils/phone';

describe('normalizeGabonPhone', () => {
  it('accepte le format local 9 chiffres avec 0 trunk (Moov)', () => {
    expect(normalizeGabonPhone('060000000')).toBe('+24160000000');
  });

  it('accepte le format local 9 chiffres avec 0 trunk (Airtel)', () => {
    // Le 0 trunk est supprimé : '074000000' → '74000000' → '+24174000000'
    expect(normalizeGabonPhone('074000000')).toBe('+24174000000');
  });

  it('accepte le format +241 déjà complet', () => {
    expect(normalizeGabonPhone('+24162557655')).toBe('+24162557655');
  });

  it('accepte le format 241 sans le +', () => {
    expect(normalizeGabonPhone('24162557655')).toBe('+24162557655');
  });

  it('ignore les espaces dans le numéro', () => {
    expect(normalizeGabonPhone('062 55 76 55')).toBe('+24162557655');
  });

  it('ignore les tirets dans le numéro', () => {
    expect(normalizeGabonPhone('062-55-76-55')).toBe('+24162557655');
  });

  it('retourne null pour un numéro trop court', () => {
    expect(normalizeGabonPhone('0620')).toBeNull();
  });

  it('retourne null pour un numéro trop long', () => {
    expect(normalizeGabonPhone('062557655555555')).toBeNull();
  });

  it('retourne null pour une chaîne vide', () => {
    expect(normalizeGabonPhone('')).toBeNull();
  });

  it('retourne null pour des lettres', () => {
    expect(normalizeGabonPhone('abcdefgh')).toBeNull();
  });
});

describe('isValidGabonPhone', () => {
  it('retourne true pour un numéro valide', () => {
    expect(isValidGabonPhone('062557655')).toBe(true);
    expect(isValidGabonPhone('+24162557655')).toBe(true);
    expect(isValidGabonPhone('074000000')).toBe(true);
  });

  it('retourne false pour un numéro invalide', () => {
    expect(isValidGabonPhone('123')).toBe(false);
    expect(isValidGabonPhone('')).toBe(false);
    expect(isValidGabonPhone('aaa')).toBe(false);
  });
});

describe('isPhoneMatchingProvider', () => {
  it('reconnaît un numéro Moov (commence par 6 après +241)', () => {
    expect(isPhoneMatchingProvider('060000000', 'MOOV_MONEY')).toBe(true);
    expect(isPhoneMatchingProvider('062557655', 'MOOV_MONEY')).toBe(true);
  });

  it('reconnaît un numéro Airtel (commence par 7 après +241)', () => {
    expect(isPhoneMatchingProvider('074000000', 'AIRTEL_MONEY')).toBe(true);
    expect(isPhoneMatchingProvider('077123456', 'AIRTEL_MONEY')).toBe(true);
  });

  it('rejette un numéro Moov pour AIRTEL_MONEY', () => {
    expect(isPhoneMatchingProvider('062557655', 'AIRTEL_MONEY')).toBe(false);
  });

  it('rejette un numéro Airtel pour MOOV_MONEY', () => {
    expect(isPhoneMatchingProvider('074000000', 'MOOV_MONEY')).toBe(false);
  });

  it('retourne false pour un numéro invalide', () => {
    expect(isPhoneMatchingProvider('', 'AIRTEL_MONEY')).toBe(false);
    expect(isPhoneMatchingProvider('123', 'MOOV_MONEY')).toBe(false);
  });
});
