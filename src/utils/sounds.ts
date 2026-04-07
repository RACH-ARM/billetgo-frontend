// Son de succès paiement — synthèse de cloche style Apple Pay

let _audioCtx: AudioContext | null = null;

// Appeler au moment d'un clic utilisateur pour débloquer l'AudioContext
export function unlockAudio(): void {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume();
    }
  } catch {
    // ignore
  }
}

export function playPaymentSuccess(): void {
  try {
    const ctx = _audioCtx ?? new (window.AudioContext || (window as any).webkitAudioContext)();

    // Synthèse de cloche : fondamentale + harmoniques inharmoniques (timbre métallique chaud)
    const bell = (freq: number, startAt: number, decay: number, vol: number) => {
      // Ratios des partiels d'une cloche réelle
      const partials = [
        { ratio: 1.000, gain: vol * 1.00 },
        { ratio: 2.756, gain: vol * 0.25 },
        { ratio: 5.404, gain: vol * 0.10 },
        { ratio: 8.933, gain: vol * 0.04 },
      ];

      partials.forEach(({ ratio, gain }) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.connect(env);
        env.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * ratio, ctx.currentTime + startAt);

        // Attaque quasi-instantanée + déclin exponentiel naturel
        env.gain.setValueAtTime(0, ctx.currentTime + startAt);
        env.gain.linearRampToValueAtTime(gain, ctx.currentTime + startAt + 0.003);
        env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + decay);

        osc.start(ctx.currentTime + startAt);
        osc.stop(ctx.currentTime + startAt + decay + 0.01);
      });
    };

    const doPlay = () => {
      // Deux ding ascendants — style Apple Pay (Mi6 → Sol#6)
      bell(1318.5, 0.00, 0.9, 0.13); // Mi6
      bell(1661.2, 0.22, 1.1, 0.10); // Sol#6

      // Vibration synchronisée avec les deux dings (Android uniquement)
      if ('vibrate' in navigator) {
        navigator.vibrate([40, 180, 60]);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(doPlay);
    } else {
      doPlay();
    }

    setTimeout(() => { if (ctx !== _audioCtx) ctx.close(); }, 1800);
  } catch {
    // Navigateur sans Web Audio — silencieux
  }
}
