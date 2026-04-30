import { describe, it, expect, beforeEach } from 'vitest';
import { captureTrafficSource, getTrafficSource } from '../../utils/trafficSource';

// jsdom fournit sessionStorage — on le vide avant chaque test
beforeEach(() => {
  sessionStorage.clear();
});

describe('getTrafficSource', () => {
  it('retourne {} quand sessionStorage est vide', () => {
    expect(getTrafficSource()).toEqual({});
  });

  it('retourne les données stockées', () => {
    sessionStorage.setItem('billetgab_traffic', JSON.stringify({ utmSource: 'google' }));
    expect(getTrafficSource()).toEqual({ utmSource: 'google' });
  });

  it('retourne {} si la valeur en session est JSON invalide', () => {
    sessionStorage.setItem('billetgab_traffic', 'not-json{{{');
    expect(getTrafficSource()).toEqual({});
  });
});

describe('captureTrafficSource', () => {
  function setLocation(url: string) {
    Object.defineProperty(window, 'location', {
      value: new URL(url),
      writable: true,
      configurable: true,
    });
  }

  function setReferrer(value: string) {
    Object.defineProperty(document, 'referrer', {
      value,
      writable: true,
      configurable: true,
    });
  }

  beforeEach(() => {
    // Réinitialiser le referrer
    setReferrer('');
  });

  it('ne stocke rien pour du trafic direct (pas d\'UTM, pas de referrer)', () => {
    setLocation('https://billetgab.com/');
    captureTrafficSource();
    expect(sessionStorage.getItem('billetgab_traffic')).toBeNull();
  });

  it('capture utm_source et utm_campaign', () => {
    setLocation('https://billetgab.com/?utm_source=facebook&utm_campaign=manshow');
    captureTrafficSource();
    const data = getTrafficSource();
    expect(data.utmSource).toBe('facebook');
    expect(data.utmCampaign).toBe('manshow');
  });

  it('capture utm_medium', () => {
    setLocation('https://billetgab.com/?utm_source=instagram&utm_medium=story');
    captureTrafficSource();
    expect(getTrafficSource().utmMedium).toBe('story');
  });

  it('capture le referrer externe', () => {
    setLocation('https://billetgab.com/');
    setReferrer('https://facebook.com/evenement/123');
    captureTrafficSource();
    expect(getTrafficSource().referrer).toBe('https://facebook.com/evenement/123');
  });

  it('ignore le referrer de la même origine', () => {
    setLocation('https://billetgab.com/checkout');
    setReferrer('https://billetgab.com/events');
    captureTrafficSource();
    // Pas d'UTM non plus → rien stocké
    expect(sessionStorage.getItem('billetgab_traffic')).toBeNull();
  });

  it('ne remplace pas une source déjà capturée dans la session (first-touch)', () => {
    // Première visite
    setLocation('https://billetgab.com/?utm_source=facebook');
    captureTrafficSource();

    // Deuxième visite dans la même session avec une autre source
    setLocation('https://billetgab.com/?utm_source=google');
    captureTrafficSource();

    // La source d'origine (facebook) doit être conservée
    expect(getTrafficSource().utmSource).toBe('facebook');
  });
});
