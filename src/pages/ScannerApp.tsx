import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle, XCircle, AlertTriangle, ScanLine, CameraOff,
  LogOut, Users, Clock, WifiOff, Wifi, Download, RefreshCw,
  ChevronDown, ChevronUp, Calendar,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface OfflineTicket {
  id: string;
  qrPayload: string;
  status: string;
  orderId: string;
  categoryName: string;
  buyerName: string;
}

interface OfflineOrder {
  id: string;
  qrPayload: string;
  buyerName: string;
  tickets: Array<{ id: string; status: string; categoryName: string }>;
}

interface OfflineCache {
  eventId: string;
  eventTitle: string;
  generatedAt: string;
  tickets: OfflineTicket[];
  orders: OfflineOrder[];
}

interface PendingScan {
  id: string;
  qrPayload: string;
  scannedAt: string;
  localResult: { valid: boolean; color: ScanColor; message: string };
}

interface ScannerEvent {
  id: string;
  title: string;
  eventDate: string;
  venueName: string;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const PENDING_KEY = 'scanner-pending-syncs';
const cacheKey = (eventId: string) => `offline-cache-${eventId}`;

function loadCache(eventId: string): OfflineCache | null {
  try { return JSON.parse(localStorage.getItem(cacheKey(eventId)) ?? 'null'); } catch { return null; }
}
function saveCache(cache: OfflineCache) {
  localStorage.setItem(cacheKey(cache.eventId), JSON.stringify(cache));
}
function loadAllCaches(): Record<string, OfflineCache> {
  const out: Record<string, OfflineCache> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('offline-cache-')) {
      const eventId = k.slice('offline-cache-'.length);
      const c = loadCache(eventId);
      if (c) out[eventId] = c;
    }
  }
  return out;
}
function loadPending(): PendingScan[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '[]'); } catch { return []; }
}
function savePending(p: PendingScan[]) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(p));
}

// ─── Offline QR verification ──────────────────────────────────────────────────

function findCacheForQR(qrPayload: string, caches: Record<string, OfflineCache>): OfflineCache | null {
  const q = qrPayload.trim();
  for (const cache of Object.values(caches)) {
    if (q.startsWith('order:')) {
      if (cache.orders.some(o => o.qrPayload === q)) return cache;
    } else {
      if (cache.tickets.some(t => t.qrPayload === q)) return cache;
    }
  }
  return null;
}

function verifyQROffline(qrPayload: string, cache: OfflineCache): ScanResult {
  const q = qrPayload.trim();

  if (q.startsWith('order:')) {
    const order = cache.orders.find(o => o.qrPayload === q);
    if (!order) return { valid: false, color: 'red', message: 'QR invalide (hors-ligne)' };

    const owned = order.tickets;
    const unused = owned.filter(t => t.status === 'UNUSED');
    const usedCount = owned.filter(t => t.status === 'USED').length;

    if (unused.length === 0) {
      return {
        valid: false, color: 'red',
        message: `Billet épuisé — ${usedCount}/${owned.length} utilisés`,
        data: { usedCount, totalCount: owned.length },
      };
    }

    // Marquer le premier billet UNUSED localement
    unused[0].status = 'USED';
    const newUsed = usedCount + 1;
    const isLast = newUsed >= owned.length;

    return {
      valid: true,
      color: isLast ? 'orange' : 'green',
      message: `${newUsed}/${owned.length} utilisé${newUsed > 1 ? 's' : ''}`,
      data: {
        buyerName: order.buyerName,
        category: unused[0].categoryName,
        usedCount: newUsed,
        totalCount: owned.length,
      },
    };
  }

  // Billet individuel
  const ticket = cache.tickets.find(t => t.qrPayload === q);
  if (!ticket) return { valid: false, color: 'red', message: 'QR invalide (hors-ligne)' };
  if (ticket.status !== 'UNUSED') {
    return { valid: false, color: 'red', message: 'Billet déjà utilisé (hors-ligne)' };
  }

  ticket.status = 'USED';
  return {
    valid: true, color: 'green',
    message: 'Entrée validée',
    data: { buyerName: ticket.buyerName, category: ticket.categoryName },
  };
}

// ─── Color styles ─────────────────────────────────────────────────────────────

const COLOR_STYLES: Record<ScanColor, { border: string; text: string }> = {
  green:  { border: 'border-green-500/50 bg-green-500/5',   text: 'text-green-400'  },
  orange: { border: 'border-yellow-400/50 bg-yellow-400/5', text: 'text-yellow-400' },
  red:    { border: 'border-rose-neon/50 bg-rose-neon/5',   text: 'text-rose-neon'  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScannerApp() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const statsKey = `scanner-stats-${user?.id ?? 'unknown'}`;

  const loadStats = () => {
    try {
      const s = localStorage.getItem(statsKey);
      if (s) return JSON.parse(s) as { scanCount: number; validCount: number };
    } catch {}
    return { scanCount: 0, validCount: 0 };
  };

  // ── Scan state ──────────────────────────────────────────────────────────────
  const [scanning, setScanning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(() => loadStats().scanCount);
  const [validCount, setValidCount] = useState(() => loadStats().validCount);
  const [scanGlow, setScanGlow] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const autoRestartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Network state ───────────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── Offline state ───────────────────────────────────────────────────────────
  const [offlineCaches, setOfflineCaches] = useState<Record<string, OfflineCache>>({});
  const offlineCachesRef = useRef<Record<string, OfflineCache>>({});
  const [pendingSyncs, setPendingSyncs] = useState<PendingScan[]>([]);
  const [scannerEvents, setScannerEvents] = useState<ScannerEvent[]>([]);
  const [preloadingEventId, setPreloadingEventId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOfflinePanel, setShowOfflinePanel] = useState(false);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const caches = loadAllCaches();
    setOfflineCaches(caches);
    offlineCachesRef.current = caches;
    setPendingSyncs(loadPending());

    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Garder le ref synchronisé avec le state (pour éviter les closures périmées dans verifyQR)
  useEffect(() => { offlineCachesRef.current = offlineCaches; }, [offlineCaches]);

  // Persister les stats
  useEffect(() => {
    localStorage.setItem(statsKey, JSON.stringify({ scanCount, validCount }));
  }, [scanCount, validCount, statsKey]);

  // Auto-sync quand le réseau revient
  useEffect(() => {
    if (isOnline) {
      fetchScannerEvents();
      if (pendingSyncs.length > 0) syncPending();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetches ─────────────────────────────────────────────────────────────────
  const fetchScannerEvents = async () => {
    try {
      const { data } = await api.get('/scans/events');
      setScannerEvents(data.data ?? []);
    } catch {}
  };

  const preloadCache = async (eventId: string) => {
    setPreloadingEventId(eventId);
    try {
      const { data } = await api.get(`/scans/event/${eventId}/tickets`);
      const cache: OfflineCache = {
        eventId,
        eventTitle: data.data.event.title,
        generatedAt: data.generatedAt,
        tickets: data.data.tickets,
        orders: data.data.orders,
      };
      saveCache(cache);
      const updated = { ...offlineCachesRef.current, [eventId]: cache };
      setOfflineCaches(updated);
      offlineCachesRef.current = updated;
      const total = cache.tickets.length + cache.orders.reduce((s: number, o: OfflineOrder) => s + o.tickets.length, 0);
      toast.success(`Cache téléchargé — ${total} billets prêts hors-ligne`);
    } catch {
      toast.error('Impossible de télécharger le cache');
    } finally {
      setPreloadingEventId(null);
    }
  };

  const syncPending = useCallback(async () => {
    const pending = loadPending();
    if (pending.length === 0) return;
    setIsSyncing(true);
    const synced: string[] = [];
    for (const scan of pending) {
      try {
        await api.post('/scans/verify', { qrPayload: scan.qrPayload });
        synced.push(scan.id);
      } catch {
        // Laisser pour le prochain essai
      }
    }
    if (synced.length > 0) {
      const remaining = pending.filter(s => !synced.includes(s.id));
      savePending(remaining);
      setPendingSyncs(remaining);
      toast.success(`${synced.length} scan${synced.length > 1 ? 's' : ''} synchronisé${synced.length > 1 ? 's' : ''}`);
    }
    setIsSyncing(false);
  }, []);

  // Auto-restart caméra après affichage du résultat
  useEffect(() => {
    if (!result) return;
    if (autoRestartRef.current) clearTimeout(autoRestartRef.current);
    const delay = 60_000;
    autoRestartRef.current = setTimeout(resumeScanning, delay);
    return () => { if (autoRestartRef.current) clearTimeout(autoRestartRef.current); };
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scanner caméra ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoRestartRef.current) clearTimeout(autoRestartRef.current);
      try { scannerRef.current?.stop().catch(() => {}); } catch {}
    };
  }, []);

  const startScanning = async () => {
    setResult(null);
    setIsVerifying(false);
    setCameraError(null);
    const qr = new Html5Qrcode('qr-reader');
    scannerRef.current = qr;
    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 25, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          setScanGlow(true);
          setTimeout(() => setScanGlow(false), 700);
          // pause() garde la caméra allumée — reprise instantanée vs stop/start (1-2s)
          try { scannerRef.current?.pause(); } catch {}
          setIsVerifying(true); // feedback visuel immédiat pendant la requête serveur
          await verifyQR(decodedText);
          setIsVerifying(false);
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

  // Resume après pause (sans redémarrer la caméra — instantané)
  const resumeScanning = () => {
    if (autoRestartRef.current) clearTimeout(autoRestartRef.current);
    setResult(null);
    setIsVerifying(false);
    try {
      scannerRef.current?.resume();
    } catch {
      // Fallback si resume() échoue : redémarrage complet
      startScanning();
    }
  };

  const stopScanning = async () => {
    if (autoRestartRef.current) clearTimeout(autoRestartRef.current);
    try { await scannerRef.current?.stop().catch(() => {}); } catch {}
    setScanning(false);
    setIsVerifying(false);
    setResult(null);
  };

  const verifyQR = async (qrPayload: string) => {
    if (isOnline) {
      try {
        const { data } = await api.post('/scans/verify', { qrPayload });
        const res: ScanResult = data;
        setResult(res);
        setScanCount(n => n + 1);
        if (res.valid) setValidCount(n => n + 1);
        return;
      } catch {
        // Réseau coupé malgré isOnline → basculer en offline
      }
    }
    tryOfflineVerification(qrPayload);
  };

  const tryOfflineVerification = (qrPayload: string) => {
    const cache = findCacheForQR(qrPayload, offlineCachesRef.current);

    if (!cache) {
      setResult({
        valid: false, color: 'red',
        message: '⚠ Hors-ligne — aucun cache pour ce billet',
      });
      setScanCount(n => n + 1);
      return;
    }

    const res = verifyQROffline(qrPayload, cache);
    setResult(res);
    setScanCount(n => n + 1);
    if (res.valid) setValidCount(n => n + 1);

    // Persister le cache avec les statuts mis à jour
    saveCache(cache);
    setOfflineCaches(prev => ({ ...prev, [cache.eventId]: { ...cache } }));

    // Ajouter à la file de synchronisation
    const newPending: PendingScan = {
      id: crypto.randomUUID(),
      qrPayload,
      scannedAt: new Date().toISOString(),
      localResult: { valid: res.valid, color: res.color ?? 'red', message: res.message },
    };
    const updated = [...loadPending(), newPending];
    savePending(updated);
    setPendingSyncs(updated);
  };

  const handleLogout = async () => {
    try { await stopScanning(); } catch {}
    await logout();
    navigate('/login');
  };

  const resultColor: ScanColor = result?.valid ? 'green' : (result?.color ?? 'red');
  const styles = COLOR_STYLES[resultColor];
  const totalCacheTickets = Object.values(offlineCaches).reduce(
    (s, c) => s + c.tickets.length + c.orders.reduce((os, o) => os + o.tickets.length, 0), 0
  );

  return (
    <div className="min-h-screen bg-bg px-4 py-8 max-w-md mx-auto">
      <style>{`
        @keyframes violetFlash {
          0%   { opacity: 0;   box-shadow: 0 0 0px 0px rgba(123,47,190,0); }
          25%  { opacity: 1;   box-shadow: 0 0 40px 12px rgba(123,47,190,0.9), inset 0 0 30px rgba(123,47,190,0.4); }
          60%  { opacity: 0.7; box-shadow: 0 0 60px 20px rgba(123,47,190,0.6), inset 0 0 20px rgba(123,47,190,0.2); }
          100% { opacity: 0;   box-shadow: 0 0 0px 0px rgba(123,47,190,0); }
        }
        .scan-glow-overlay { animation: violetFlash 0.7s ease-out forwards; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">SCANNER</h1>
          <p className="text-white/40 text-xs mt-0.5">{user?.firstName} {user?.lastName}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            isOnline
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-rose-neon/10 border-rose-neon/30 text-rose-neon'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'En ligne' : 'Hors-ligne'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-white/40 hover:text-rose-neon hover:border-rose-neon/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Compteurs session ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-4 text-center">
          <p className="font-bebas text-4xl text-cyan-neon">{scanCount}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Total scans</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="font-bebas text-4xl text-green-400">{validCount}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Entrées validées</p>
        </div>
      </div>

      {/* ── Panel hors-ligne ── */}
      <div className="glass-card mb-4 overflow-hidden">
        <button
          onClick={() => {
            setShowOfflinePanel(v => !v);
            if (!showOfflinePanel && isOnline) fetchScannerEvents();
          }}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <WifiOff className="w-4 h-4 text-violet-neon/70" />
            <span className="text-sm font-semibold text-white/70">Mode hors-ligne</span>
            {totalCacheTickets > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-violet-neon/20 text-violet-neon text-xs font-medium">
                {totalCacheTickets} billets en cache
              </span>
            )}
            {pendingSyncs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                {pendingSyncs.length} à synchroniser
              </span>
            )}
          </div>
          {showOfflinePanel ? <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />}
        </button>

        <AnimatePresence>
          {showOfflinePanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06]">

                {/* Caches déjà téléchargés */}
                {Object.values(offlineCaches).length > 0 && (
                  <div className="space-y-2 pt-3">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Caches disponibles</p>
                    {Object.values(offlineCaches).map(cache => {
                      const count = cache.tickets.length + cache.orders.reduce((s, o) => s + o.tickets.length, 0);
                      const ageMin = Math.round((Date.now() - new Date(cache.generatedAt).getTime()) / 60000);
                      return (
                        <div key={cache.eventId} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5">
                          <div>
                            <p className="text-sm text-white font-medium">{cache.eventTitle}</p>
                            <p className="text-xs text-white/40">
                              {count} billets · mis à jour il y a {ageMin < 60 ? `${ageMin} min` : `${Math.round(ageMin / 60)}h`}
                            </p>
                          </div>
                          {isOnline && (
                            <button
                              onClick={() => preloadCache(cache.eventId)}
                              disabled={preloadingEventId === cache.eventId}
                              className="p-2 rounded-lg bg-violet-neon/10 text-violet-neon hover:bg-violet-neon/20 transition-colors disabled:opacity-40"
                              title="Mettre à jour"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${preloadingEventId === cache.eventId ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Télécharger pour un événement */}
                {isOnline && scannerEvents.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Télécharger un cache</p>
                    {scannerEvents.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar className="w-4 h-4 text-violet-neon/60 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">{ev.title}</p>
                            <p className="text-xs text-white/40">
                              {new Date(ev.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              {ev.venueName ? ` · ${ev.venueName}` : ''}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => preloadCache(ev.id)}
                          disabled={preloadingEventId === ev.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-neon/15 text-violet-neon text-xs font-medium hover:bg-violet-neon/25 transition-colors disabled:opacity-40 flex-shrink-0 ml-2"
                        >
                          {preloadingEventId === ev.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                          {preloadingEventId === ev.id ? 'Chargement…' : offlineCaches[ev.id] ? 'Mettre à jour' : 'Télécharger'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!isOnline && Object.values(offlineCaches).length === 0 && (
                  <p className="text-xs text-rose-neon/70 pt-3">
                    Aucun cache disponible. Connectez-vous au réseau avant l'événement et téléchargez un cache.
                  </p>
                )}

                {/* File de synchronisation */}
                {pendingSyncs.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/40 uppercase tracking-widest">
                        Scans hors-ligne ({pendingSyncs.length})
                      </p>
                      {isOnline && (
                        <button
                          onClick={syncPending}
                          disabled={isSyncing}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Sync…' : 'Synchroniser'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {pendingSyncs.slice(0, 8).map(ps => (
                        <div key={ps.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white/[0.03]">
                          <span className={ps.localResult.valid ? 'text-green-400' : 'text-rose-neon/70'}>
                            {ps.localResult.valid ? '✓' : '✗'} {ps.localResult.message}
                          </span>
                          <span className="text-white/30 ml-2 flex-shrink-0">
                            {new Date(ps.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      {pendingSyncs.length > 8 && (
                        <p className="text-xs text-white/30 text-center py-1">+ {pendingSyncs.length - 8} autres</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bannière hors-ligne active ── */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-4">
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-200/80">
            {totalCacheTickets > 0
              ? `Mode hors-ligne actif — ${totalCacheTickets} billets en cache. Scans synchronisés au retour du réseau.`
              : 'Hors-ligne — aucun cache disponible. Reconnectez-vous pour scanner.'
            }
          </p>
        </div>
      )}

      {/* ── QR Scanner ── */}
      <div className="glass-card p-4 mb-4 overflow-hidden">
        <div className="relative rounded-xl overflow-hidden">
          <div id="qr-reader" />
          {scanGlow && (
            <div className="scan-glow-overlay absolute inset-0 rounded-xl pointer-events-none border-2 border-violet-neon" />
          )}
        </div>
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

      {/* ── Bouton principal ── */}
      <button
        onClick={scanning ? stopScanning : startScanning}
        disabled={isVerifying}
        className={`w-full py-4 rounded-2xl font-bebas text-2xl tracking-wider transition-all flex items-center justify-center gap-3 ${
          scanning && !isVerifying
            ? 'bg-rose-neon/20 text-rose-neon border-2 border-rose-neon/40'
            : 'bg-neon-gradient text-white shadow-neon disabled:opacity-60'
        }`}
      >
        <ScanLine size={24} />
        {scanning && !isVerifying ? 'ARRÊTER LA CAMÉRA' : 'SCANNER UN QR CODE'}
      </button>

      {/* ── Overlay : vérification en cours ── */}
      <AnimatePresence>
        {isVerifying && !result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95"
          >
            <div className="w-16 h-16 border-4 border-violet-neon/25 border-t-violet-neon rounded-full animate-spin mb-5" />
            <p className="text-white/50 text-lg tracking-wide">Vérification…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overlay : résultat plein écran ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
            style={{
              background: resultColor === 'green'
                ? 'rgba(0, 18, 6, 0.97)'
                : resultColor === 'orange'
                ? 'rgba(18, 13, 0, 0.97)'
                : 'rgba(20, 0, 6, 0.97)',
            }}
          >
            {/* Icône */}
            <div className={`mb-6 p-5 rounded-full ${
              resultColor === 'green'  ? 'bg-green-500/15 ring-1 ring-green-500/30'
            : resultColor === 'orange' ? 'bg-yellow-400/15 ring-1 ring-yellow-400/30'
            :                            'bg-rose-neon/15 ring-1 ring-rose-neon/30'
            }`}>
              {resultColor === 'red'
                ? <XCircle     size={80} className="text-rose-neon"  strokeWidth={1.5} />
                : <CheckCircle size={80} className={resultColor === 'green' ? 'text-green-400' : 'text-yellow-400'} strokeWidth={1.5} />
              }
            </div>

            {/* Message principal */}
            <p className={`font-bebas text-4xl tracking-wide text-center mb-1 ${styles.text}`}>
              {result.message}
            </p>

            {/* Compteur groupe */}
            {result.data?.totalCount !== undefined && (
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-white/40" />
                <span className={`font-mono text-2xl font-bold ${styles.text}`}>
                  {result.data.usedCount}/{result.data.totalCount}
                </span>
                <span className="text-white/40 text-sm">
                  billet{(result.data.totalCount ?? 1) > 1 ? 's' : ''} utilisé{(result.data.usedCount ?? 0) > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Détails */}
            {result.data && (result.data.buyerName || result.data.category || result.data.event || result.data.usedAt) && (
              <div className="w-full max-w-sm space-y-3 text-sm bg-white/[0.05] rounded-2xl p-4 border border-white/10 mb-6">
                {result.data.buyerName && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Nom</span>
                    <span className="text-white font-semibold text-base">{result.data.buyerName}</span>
                  </div>
                )}
                {result.data.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Catégorie</span>
                    <span className="text-cyan-neon font-medium">{result.data.category}</span>
                  </div>
                )}
                {result.data.event && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Événement</span>
                    <span className="text-white text-right max-w-[60%]">{result.data.event}</span>
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

            {/* Barre de progression auto-retour */}
            <div className="w-full max-w-sm h-1 bg-white/10 rounded-full mb-5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  resultColor === 'green' ? 'bg-green-400' : resultColor === 'orange' ? 'bg-yellow-400' : 'bg-rose-neon'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 60, ease: 'linear' }}
              />
            </div>

            {/* Bouton */}
            <button
              onClick={resumeScanning}
              className="w-full max-w-sm py-4 rounded-2xl font-bebas text-2xl tracking-wider bg-neon-gradient text-white shadow-neon flex items-center justify-center gap-3"
            >
              <ScanLine size={24} />
              SCANNER LE SUIVANT
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
