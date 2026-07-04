export type AvailabilityLevel = {
  label: string;
  color: string;
  pulse: boolean;
};

/**
 * Retourne un label de disponibilité discret basé sur le taux de remplissage.
 * Ne révèle jamais le nombre exact de billets restants.
 */
export function availabilityLevel(occupancy: number): AvailabilityLevel {
  if (occupancy >= 100) return { label: 'Complet',          color: 'text-rose-neon',  pulse: false };
  if (occupancy >= 90)  return { label: 'Presque complet',  color: 'text-rose-neon',  pulse: true  };
  if (occupancy >= 75)  return { label: 'Dernières places', color: 'text-orange-400', pulse: false };
  if (occupancy >= 50)  return { label: 'Places limitées',  color: 'text-amber-400',  pulse: false };
  return                       { label: 'Disponible',       color: 'text-green-400',  pulse: false };
}

/**
 * Même logique mais basé sur la disponibilité d'une catégorie individuelle.
 * Utiliser `available` (quantityTotal - quantitySold - quantityReserved) et `total`.
 */
export function categoryAvailabilityLevel(available: number, total: number): AvailabilityLevel {
  if (available <= 0)       return { label: 'Complet',          color: 'text-rose-neon',  pulse: false };
  const occ = total > 0 ? Math.round(((total - available) / total) * 100) : 0;
  if (occ >= 90)            return { label: 'Presque complet',  color: 'text-rose-neon',  pulse: true  };
  if (occ >= 75)            return { label: 'Dernières places', color: 'text-orange-400', pulse: false };
  if (occ >= 50)            return { label: 'Places limitées',  color: 'text-amber-400',  pulse: false };
  return                           { label: 'Disponible',       color: 'text-green-400',  pulse: false };
}
