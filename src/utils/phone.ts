/**
 * Normalise un numéro de téléphone gabonais vers le format E.164 : +241XXXXXXXX
 *
 * Nouveau format Gabon (9 chiffres locaux avec le 0) :
 *   "060000000"         → "+24160000000"  (Moov — format local 9 chiffres)
 *   "074000000"         → "+241074000000" (Airtel — format local 9 chiffres)
 *   "062557655"         → "+24162557655"  (format local avec 0)
 *   "+24162557655"      → "+24162557655"  (déjà E.164)
 *   "062 55 76 55"      → "+24162557655"  (avec espaces)
 *
 * Retourne null si le numéro est invalide.
 */
export const normalizeGabonPhone = (input: string): string | null => {
  // Supprimer espaces, tirets, points
  const clean = input.replace(/[\s\-\.]/g, '');

  let digits: string;

  if (clean.startsWith('+241')) {
    digits = clean.slice(4);
  } else if (clean.startsWith('241')) {
    digits = clean.slice(3);
  } else if (clean.startsWith('0')) {
    digits = clean.slice(1); // retirer le "0" trunk local
  } else {
    digits = clean;
  }

  // Gabon : 8 ou 9 chiffres après l'indicatif (nouveau format 060XXXXXX)
  if (!/^[0-9]{8,9}$/.test(digits)) return null;

  return `+241${digits}`;
};

/** Vérifie qu'un numéro est valide (après normalisation). */
export const isValidGabonPhone = (input: string): boolean => {
  return normalizeGabonPhone(input) !== null;
};

/**
 * Vérifie que le numéro correspond à l'opérateur sélectionné.
 *
 * Nouveau format Gabon — le premier chiffre après +241 indique l'opérateur :
 *   6XXXXXXX → Moov Money  (ex: 060..., 062..., 065..., 066...)
 *   7XXXXXXX → Airtel Money (ex: 070..., 074..., 077...)
 */
export const isPhoneMatchingProvider = (
  input: string,
  provider: 'AIRTEL_MONEY' | 'MOOV_MONEY',
): boolean => {
  const normalized = normalizeGabonPhone(input);
  if (!normalized) return false;
  // normalized = "+241XXXXXXXX", le 1er chiffre après +241 = opérateur
  const firstDigit = normalized[4];
  if (provider === 'AIRTEL_MONEY') return firstDigit === '7';
  if (provider === 'MOOV_MONEY')   return firstDigit === '6';
  return false;
};
