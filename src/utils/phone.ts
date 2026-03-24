/**
 * Normalise un numéro de téléphone gabonais vers le format E.164 : +241XXXXXXXX
 *
 * Accepte :
 *   "62557655"          → "+24162557655"  (8 chiffres, saisis dans le champ préfixé +241)
 *   "062557655"         → "+24162557655"  (format local avec 0)
 *   "+24162557655"      → "+24162557655"  (déjà E.164)
 *   "24162557655"       → "+24162557655"  (sans le +)
 *   "062 55 76 55"      → "+24162557655"  (avec espaces)
 *   "+241 62 55 76 55"  → "+24162557655"  (E.164 avec espaces)
 *
 * Retourne null si le numéro est invalide.
 */
export const normalizeGabonPhone = (input: string): string | null => {
  // Supprimer espaces, tirets, points
  const clean = input.replace(/[\s\-\.]/g, '');

  let digits: string;

  if (clean.startsWith('+241')) {
    digits = clean.slice(4); // retirer "+241"
  } else if (clean.startsWith('241')) {
    digits = clean.slice(3); // retirer "241"
  } else if (clean.startsWith('0')) {
    digits = clean.slice(1); // retirer le "0" local
  } else {
    digits = clean; // supposé être les 8 chiffres locaux directs
  }

  // Un numéro gabonais = exactement 8 chiffres après l'indicatif
  if (!/^[0-9]{8}$/.test(digits)) return null;

  return `+241${digits}`;
};

/** Vérifie qu'un numéro est valide (après normalisation). */
export const isValidGabonPhone = (input: string): boolean => {
  return normalizeGabonPhone(input) !== null;
};
