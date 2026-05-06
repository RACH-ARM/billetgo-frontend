let _audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _audioCtx;
}

function resume(audioCtx: AudioContext, fn: () => void) {
  if (audioCtx.state === 'suspended') audioCtx.resume().then(fn);
  else fn();
}

// Appeler sur la première interaction utilisateur pour débloquer l'AudioContext
export function unlockAudio(): void {
  try {
    const c = ctx();
    if (c.state === 'suspended') c.resume();
  } catch { /* ignore */ }
}

// ─── Apple Pay — paiement confirmé ────────────────────────────────────────────
// Thud grave immédiat + deux cloches ascendantes (Mi6 → Sol#6)
export function playPaymentSuccess(): void {
  try {
    const c = ctx();

    const doPlay = () => {
      const now = c.currentTime;

      // Thud grave (composante haptique du son Apple Pay)
      const thudOsc = c.createOscillator();
      const thudEnv = c.createGain();
      thudOsc.connect(thudEnv); thudEnv.connect(c.destination);
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(150, now);
      thudOsc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
      thudEnv.gain.setValueAtTime(0, now);
      thudEnv.gain.linearRampToValueAtTime(0.20, now + 0.005);
      thudEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      thudOsc.start(now); thudOsc.stop(now + 0.1);

      // Cloche — partiels inharmoniques (timbre métallique chaud)
      const bell = (freq: number, startAt: number, decay: number, vol: number) => {
        [
          { r: 1.000, g: vol * 1.00 },
          { r: 2.756, g: vol * 0.25 },
          { r: 5.404, g: vol * 0.10 },
          { r: 8.933, g: vol * 0.04 },
        ].forEach(({ r, g }) => {
          const osc = c.createOscillator();
          const env = c.createGain();
          osc.connect(env); env.connect(c.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * r, now + startAt);
          env.gain.setValueAtTime(0, now + startAt);
          env.gain.linearRampToValueAtTime(g, now + startAt + 0.003);
          env.gain.exponentialRampToValueAtTime(0.0001, now + startAt + decay);
          osc.start(now + startAt); osc.stop(now + startAt + decay + 0.01);
        });
      };

      bell(1318.5, 0.05, 0.90, 0.13); // Mi6
      bell(1661.2, 0.27, 1.10, 0.10); // Sol#6

      if ('vibrate' in navigator) navigator.vibrate([40, 180, 60]);
    };

    resume(c, doPlay);
  } catch { /* navigateur sans Web Audio */ }
}

// ─── Scan valide — vert ───────────────────────────────────────────────────────
// Deux notes ascendantes courtes, sine pur — style Apple FaceID unlock
export function playScanValid(): void {
  try {
    const c = ctx();

    const doPlay = () => {
      const now = c.currentTime;

      const ping = (freq: number, at: number, vol: number) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.connect(env); env.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + at);
        env.gain.setValueAtTime(0, now + at);
        env.gain.linearRampToValueAtTime(vol, now + at + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.20);
        osc.start(now + at); osc.stop(now + at + 0.22);
      };

      ping(784,  0.00, 0.18); // Sol5
      ping(1047, 0.13, 0.14); // Do6

      if ('vibrate' in navigator) navigator.vibrate(55);
    };

    resume(c, doPlay);
  } catch {}
}

// ─── Scan invalide — rouge ────────────────────────────────────────────────────
// Deux buzz descendants sawtooth — "access denied" moderne
export function playScanInvalid(): void {
  try {
    const c = ctx();

    const doPlay = () => {
      const now = c.currentTime;

      const buzz = (freq: number, at: number, vol: number) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.connect(env); env.connect(c.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + at);
        env.gain.setValueAtTime(0, now + at);
        env.gain.linearRampToValueAtTime(vol, now + at + 0.005);
        env.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.15);
        osc.start(now + at); osc.stop(now + at + 0.17);
      };

      buzz(320, 0.00, 0.11);
      buzz(220, 0.19, 0.09);

      if ('vibrate' in navigator) navigator.vibrate([90, 60, 90]);
    };

    resume(c, doPlay);
  } catch {}
}

// ─── Mauvais événement — orange ───────────────────────────────────────────────
// Trois bips triangle rapides — signal d'attention neutre
export function playScanWrongEvent(): void {
  try {
    const c = ctx();

    const doPlay = () => {
      const now = c.currentTime;

      const beep = (at: number) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.connect(env); env.connect(c.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now + at);
        env.gain.setValueAtTime(0, now + at);
        env.gain.linearRampToValueAtTime(0.10, now + at + 0.004);
        env.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.10);
        osc.start(now + at); osc.stop(now + at + 0.11);
      };

      beep(0.00);
      beep(0.15);
      beep(0.30);

      if ('vibrate' in navigator) navigator.vibrate([35, 35, 35, 35, 35]);
    };

    resume(c, doPlay);
  } catch {}
}

// ─── Dispatcher scan ─────────────────────────────────────────────────────────
export function playScanSound(color: 'green' | 'orange' | 'red'): void {
  if (color === 'green')  playScanValid();
  else if (color === 'orange') playScanWrongEvent();
  else playScanInvalid();
}
