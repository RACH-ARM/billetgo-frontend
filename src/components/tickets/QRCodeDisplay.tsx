import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import toast from 'react-hot-toast';
import { WifiOff, ImageDown } from 'lucide-react';
import { generateTicketCanvas, blobToBase64 } from '../../utils/ticketCanvas';

const CACHE_KEY = (id: string) => `qr-cache-${id}`;

interface Props {
  // Mode groupe (une commande = un QR)
  orderId?: string;
  usedCount?: number;
  totalCount?: number;
  // Mode individuel (legacy)
  ticketId?: string;
  // Infos d'affichage communes
  eventTitle?: string;
  categoryName?: string;
  eventDate?: string;
  venueName?: string;
  coverImageUrl?: string;
  // Désactivé si billet remboursé / annulé
  disabled?: boolean;
}

export default function QRCodeDisplay({
  orderId, usedCount = 0, totalCount = 1,
  ticketId,
  eventTitle, categoryName, eventDate, venueName, coverImageUrl,
  disabled = false,
}: Props) {
  const cacheId = orderId ?? ticketId ?? '';
  const apiPath = orderId ? `/orders/${orderId}/qr` : `/tickets/${ticketId}/qr`;

  const [show, setShow] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (disabled) {
      // Vider le cache localStorage pour empêcher l'affichage hors-ligne
      localStorage.removeItem(CACHE_KEY(cacheId));
      setDataUrl(null);
      setCached(false);
      setShow(false);
      return;
    }
    const saved = localStorage.getItem(CACHE_KEY(cacheId));
    if (saved) { setDataUrl(saved); setCached(true); }
  }, [cacheId, disabled]);

  const handleToggle = async () => {
    if (show) { setShow(false); return; }
    if (dataUrl) { setShow(true); return; }
    setLoading(true);
    try {
      const response = await api.get(apiPath, { responseType: 'blob' });
      const base64 = await blobToBase64(new Blob([response.data], { type: 'image/png' }));
      try {
        localStorage.setItem(CACHE_KEY(cacheId), base64);
        setCached(true);
      } catch {
        // localStorage plein — on affiche quand même le QR, juste sans cache hors ligne
      }
      setDataUrl(base64); setShow(true);
    } catch {
      const saved = localStorage.getItem(CACHE_KEY(cacheId));
      if (saved) {
        setDataUrl(saved); setCached(true); setShow(true);
        toast('QR Code chargé hors ligne', { icon: '📶' });
      } else {
        toast.error('Impossible de charger le QR Code — connexion requise');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImage = async () => {
    if (!dataUrl) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const displayCategoryName = orderId
        ? `${totalCount} billet${totalCount > 1 ? 's' : ''} — ${categoryName || ''}`
        : categoryName;
      await generateTicketCanvas(canvas, dataUrl, {
        ticketId: cacheId,
        eventTitle,
        categoryName: displayCategoryName,
        eventDate,
        venueName,
        coverImageUrl,
      });

      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));
      const file = new File([blob], 'billet-billetgo.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Mon billet – ${eventTitle || 'BilletGo'}` });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'billet-billetgo.png'; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast.success('Image téléchargée');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Erreur lors de la génération');
      }
    } finally {
      setSaving(false);
    }
  };

  // Couleur du compteur
  const counterColor = usedCount >= totalCount
    ? 'text-rose-neon border-rose-neon/30 bg-rose-neon/10'
    : usedCount === totalCount - 1
    ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
    : 'text-green-400 border-green-400/30 bg-green-400/10';

  if (disabled) {
    return (
      <div className="w-48 h-48 bg-bg-secondary rounded-2xl flex items-center justify-center border border-rose-neon/20">
        <span className="text-rose-neon/60 text-sm text-center px-4">Billet remboursé</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative">
        {show && dataUrl ? (
          <div className="bg-white p-4 rounded-2xl">
            <img src={dataUrl} alt="QR Code" className="w-48 h-48" />
          </div>
        ) : (
          <div className="w-48 h-48 bg-bg-secondary rounded-2xl flex items-center justify-center border border-violet-neon/20">
            {loading ? <Spinner size="md" /> : <span className="text-white/30 text-sm">QR Code masqué</span>}
          </div>
        )}

        {/* Compteur X/Y sur le QR (mode groupe uniquement) */}
        {orderId && (
          <div className={`absolute -top-2 -right-2 text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${counterColor}`}>
            {usedCount}/{totalCount}
          </div>
        )}
      </div>

      {/* Label statut */}
      {orderId && (
        <p className={`text-xs font-medium ${usedCount >= totalCount ? 'text-rose-neon' : 'text-white/50'}`}>
          {usedCount >= totalCount
            ? `Billet épuisé — ${totalCount}/${totalCount} utilisés`
            : usedCount === 0
            ? `${totalCount} entrée${totalCount > 1 ? 's' : ''} disponible${totalCount > 1 ? 's' : ''}`
            : `${usedCount}/${totalCount} utilisé${usedCount > 1 ? 's' : ''}`}
        </p>
      )}

      <div className="flex gap-2 flex-wrap justify-center">
        <Button variant="secondary" size="sm" onClick={handleToggle} disabled={loading}>
          {show ? 'Masquer' : 'Afficher le QR Code'}
        </Button>
        {(show || cached) && (
          <Button variant="secondary" size="sm" onClick={handleSaveImage} isLoading={saving} disabled={!dataUrl}>
            <ImageDown className="w-3.5 h-3.5" />
            Enregistrer
          </Button>
        )}
      </div>

      {cached && !show && (
        <p className="flex items-center gap-1.5 text-xs text-green-400/70">
          <WifiOff className="w-3 h-3" />
          Disponible hors ligne
        </p>
      )}
    </div>
  );
}
