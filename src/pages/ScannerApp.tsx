import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle, XCircle, AlertTriangle, ScanLine, CameraOff,
  RotateCcw, LogOut, Users, Clock,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';

type ScanColor = 'green' | 'orange' | 'red';

interface ScanResult {
  valid: boolean;
  message: string;
  color?: ScanColor;
  data?: {
    buyerName?: string;
    category?: string;
    event?: string;
    purchasedAt?: string;
    usedCount?: number;
    totalCount?: number;
    usedAt?: string;
  };
}

const COLOR_STYLES: Record<ScanColor, { border: string; icon: string; text: string }> = {
  green:  { border: 'border-green-500/50 bg-green-500/5',   icon: 'text-green-400',   text: 'text-green-400'  },
  orange: { border: 'border-yellow-400/50 bg-yellow-400/5', icon: 'text-yellow-400',  text: 'text-yellow-400' },
  red:    { border: 'border-rose-neon/50 bg-rose-neon/5',   icon: 'text-rose-neon',   text: 'text-rose-neon'  },
};

export default function ScannerApp() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const statsKey = `scanner-stats-${user?.id ?? 'unknown'}`;

  const loadStats = () => {
    try {
      const saved = localStorage.getItem(statsKey);
      if (saved) return JSON.parse(saved) as { scanCount: number; validCount: number };
    } catch {}
    return { scanCount: 0, validCount: 0 };
  };

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(() => loadStats().scanCount);
  const [validCount, setValidCount] = useState(() => loadStats().validCount);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    localStorage.setItem(statsKey, JSON.stringify({ scanCount, validCount }));
  }, [scanCount, validCount, statsKey]);

  useEffect(() => {
    return () => {
      try { scannerRef.current?.stop().catch(() => {}); } catch {}
    };
  }, []);

  const startScanning = async () => {
    setResult(null);
    setCameraError(null);
    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;

    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          setScanning(false);
          qr.stop().catch(() => {});
          await verifyQR(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
        setCameraError('Accès à la caméra refusé. Autorisez la caméra dans les paramètres du navigateur.');
      } else if (msg.toLowerCase().includes('https') || msg.toLowerCase().includes('secure')) {
        setCameraError('La caméra nécessite une connexion sécurisée (HTTPS).');
      } else {
        setCameraError('Impossible d\'accéder à la caméra : ' + msg);
      }
    }
  };

  const stopScanning = async () => {
    try { await scannerRef.current?.stop().catch(() => {}); } catch {}
    setScanning(false);
  };

  const verifyQR = async (qrPayload: string) => {
    try {
      const { data } = await api.post('/scans/verify', { qrPayload });
      const res: ScanResult = data;
      setResult(res);
      setScanCount(n => n + 1);
      if (res.valid) setValidCount(n => n + 1);
    } catch {
      setResult({ valid: false, color: 'red', message: 'Erreur de vérification réseau' });
    }
  };

  const reset = () => setResult(null);

  const handleLogout = async () => {
    try { await stopScanning(); } catch {}
    await logout();
    navigate('/login');
  };

  const resultColor: ScanColor = result?.color ?? (result?.valid ? 'green' : 'red');
  const styles = COLOR_STYLES[resultColor];

  return (
    <div className="min-h-screen bg-bg px-4 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">SCANNER</h1>
          <p className="text-white/40 text-xs mt-0.5">{user?.firstName} {user?.lastName}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>

      {/* Compteurs session */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="font-bebas text-4xl text-cyan-neon">{scanCount}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Total scans</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="font-bebas text-4xl text-green-400">{validCount}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Entrées validées</p>
        </div>
      </div>

      {/* QR Scanner */}
      <div className="glass-card p-4 mb-4 overflow-hidden">
        <div id="qr-reader" className="rounded-xl overflow-hidden" />
        {!scanning && !cameraError && (
          <div className="h-56 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-violet-neon/20 rounded-xl gap-3">
            <CameraOff size={40} className="text-white/10" />
            <p className="text-sm">Caméra désactivée</p>
          </div>
        )}
        {!scanning && cameraError && (
          <div className="h-56 flex flex-col items-center justify-center border-2 border-dashed border-rose-neon/30 rounded-xl gap-3 px-4">
            <AlertTriangle size={36} className="text-rose-neon/60" />
            <p className="text-sm text-rose-neon/80 text-center">{cameraError}</p>
          </div>
        )}
      </div>

      {/* Bouton principal */}
      <button
        onClick={scanning ? stopScanning : startScanning}
        className={`w-full py-4 rounded-2xl font-bebas text-2xl tracking-wider transition-all flex items-center justify-center gap-3 ${
          scanning
            ? 'bg-rose-neon/20 text-rose-neon border-2 border-rose-neon/40'
            : 'bg-neon-gradient text-white shadow-neon'
        }`}
      >
        <ScanLine size={24} />
        {scanning ? 'ARRÊTER LA CAMÉRA' : 'SCANNER UN QR CODE'}
      </button>

      {/* Résultat */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`mt-6 glass-card p-6 border-2 ${styles.border}`}
          >
            <div className="flex flex-col items-center mb-4">
              {/* Icône selon le cas */}
              {resultColor === 'green' && <CheckCircle size={56} className="text-green-400 mb-3" strokeWidth={1.5} />}
              {resultColor === 'orange' && <CheckCircle size={56} className="text-yellow-400 mb-3" strokeWidth={1.5} />}
              {resultColor === 'red' && <XCircle size={56} className="text-rose-neon mb-3" strokeWidth={1.5} />}

              <p className={`font-bebas text-2xl tracking-wide text-center ${styles.text}`}>
                {result.message}
              </p>

              {/* Compteur groupe X/Y */}
              {result.data?.totalCount !== undefined && (
                <div className="flex items-center gap-2 mt-2">
                  <Users className="w-4 h-4 text-white/40" />
                  <span className={`font-mono text-lg font-bold ${styles.text}`}>
                    {result.data.usedCount}/{result.data.totalCount}
                  </span>
                  <span className="text-white/40 text-sm">
                    billet{(result.data.totalCount ?? 1) > 1 ? 's' : ''} utilisé{(result.data.usedCount ?? 0) > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Détails acheteur */}
            {result.data && (result.data.buyerName || result.data.category || result.data.event) && (
              <div className="space-y-2 text-sm border-t border-white/10 pt-4">
                {result.data.buyerName && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Nom</span>
                    <span className="text-white font-medium">{result.data.buyerName}</span>
                  </div>
                )}
                {result.data.category && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Catégorie</span>
                    <span className="text-cyan-neon font-medium">{result.data.category}</span>
                  </div>
                )}
                {result.data.event && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Événement</span>
                    <span className="text-white">{result.data.event}</span>
                  </div>
                )}
                {result.data.usedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Déjà scanné à</span>
                    <span className="flex items-center gap-1.5 text-rose-neon">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(result.data.usedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="mt-5 w-full py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <RotateCcw size={14} />
              Scanner suivant
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
