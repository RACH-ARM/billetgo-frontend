const SESSION_KEY = 'billetgo_traffic';

export interface TrafficSource {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

/**
 * Capture les paramètres UTM et le referrer depuis l'URL courante.
 * Stocke dans sessionStorage — ne remplace pas une valeur déjà présente
 * (on conserve la première source de la session).
 */
export function captureTrafficSource(): void {
  // Ne pas écraser la source déjà capturée dans cette session
  if (sessionStorage.getItem(SESSION_KEY)) return;

  const params = new URLSearchParams(window.location.search);
  const utmSource   = params.get('utm_source')   ?? undefined;
  const utmMedium   = params.get('utm_medium')   ?? undefined;
  const utmCampaign = params.get('utm_campaign') ?? undefined;

  // Referrer : on n'enregistre que les referrers externes (pas la même origine)
  const rawReferrer = document.referrer;
  let referrer: string | undefined;
  if (rawReferrer) {
    try {
      const refOrigin = new URL(rawReferrer).origin;
      if (refOrigin !== window.location.origin) referrer = rawReferrer;
    } catch {
      // URL malformée — ignorer
    }
  }

  if (!utmSource && !referrer) return; // trafic direct : rien à stocker

  const data: TrafficSource = {
    ...(utmSource   && { utmSource }),
    ...(utmMedium   && { utmMedium }),
    ...(utmCampaign && { utmCampaign }),
    ...(referrer    && { referrer }),
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/** Retourne la source capturée pour la session courante. */
export function getTrafficSource(): TrafficSource {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TrafficSource;
  } catch {
    return {};
  }
}
