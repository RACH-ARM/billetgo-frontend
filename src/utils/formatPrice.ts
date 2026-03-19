export const formatPrice = (amount: number | string, currency = 'FCFA'): string => {
  const n = Number(amount);
  if (n === 0) return 'GRATUIT';
  return `${n.toLocaleString('fr-FR')} ${currency}`;
};

export const formatPriceCompact = (amount: number | string): string => {
  const n = Number(amount);
  if (n === 0) return 'GRATUIT';
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k FCFA`;
  return `${n} FCFA`;
};
