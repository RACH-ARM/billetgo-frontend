import { useState } from 'react';
import { Phone, Mail, Send, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { isValidGabonPhone } from '../../utils/phone';

/**
 * Renvoi d'un billet (WhatsApp + email) pour une commande agent POS.
 * Partagé entre l'overlay "Billet succès" (après une vente) et l'overlay
 * "Renvoyer un billet" (depuis l'historique) — même flux, même endpoints.
 */
export default function ResendTicketPanel({ orderId, defaultEmail = '', hideWhatsApp = false }: { orderId: string; defaultEmail?: string; hideWhatsApp?: boolean }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [sendingChannel, setSendingChannel] = useState<'whatsapp' | 'email' | null>(null);
  const [sentPhones, setSentPhones] = useState<string[]>([]);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const phoneError = phone.trim().length >= 2 && !isValidGabonPhone(phone) ? 'Numéro invalide — ex : 060 000 000' : null;

  const sendWhatsApp = async () => {
    const trimmed = phone.trim();
    if (!trimmed || !isValidGabonPhone(trimmed)) return;
    setSendingChannel('whatsapp');
    try {
      await api.post(`/agent/orders/${orderId}/send-whatsapp`, { phone: trimmed });
      setSentPhones((p) => [...p, trimmed]);
      setPhone('');
      toast.success(`Billet envoyé · ${trimmed}`);
    } catch {
      toast.error('Échec de l\'envoi WhatsApp');
    } finally {
      setSendingChannel(null);
    }
  };

  const sendEmail = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setSendingChannel('email');
    try {
      await api.post(`/agent/orders/${orderId}/send-email`, { email: trimmed });
      setSentEmails((e) => [...e, trimmed]);
      setEmail('');
      toast.success(`Billet envoyé à ${trimmed}`);
    } catch {
      toast.error('Échec de l\'envoi email');
    } finally {
      setSendingChannel(null);
    }
  };

  return (
    <>
      {/* WhatsApp */}
      {!hideWhatsApp && (
        <div className="w-full glass-card p-4">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Envoyer le billet sur WhatsApp</p>
          {sentPhones.map((n) => (
            <div key={n} className="flex items-center gap-2 mb-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg px-3 py-1.5">
              <Phone className="w-3 h-3 text-[#25D366]" />
              <span className="text-[#25D366] text-xs font-medium flex-1">{n}</span>
              <span className="text-[#25D366]/60 text-xs">✓ Envoyé</span>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#25D366]/60" />
              <input
                type="tel"
                placeholder="Numéro WhatsApp du client"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendWhatsApp()}
                className={`w-full bg-bg border rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/25 focus:outline-none text-sm transition-colors ${
                  phoneError ? 'border-rose-neon/50 focus:border-rose-neon/70' : 'border-[#25D366]/30 focus:border-[#25D366]/70'
                }`}
              />
            </div>
            <button
              onClick={sendWhatsApp}
              disabled={!phone.trim() || !!phoneError || sendingChannel !== null}
              className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
            >
              {sendingChannel === 'whatsapp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer
            </button>
          </div>
          {phoneError && <p className="text-rose-neon text-xs mt-1.5 pl-1">{phoneError}</p>}
        </div>
      )}

      {/* Email */}
      <div className="w-full glass-card p-4">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Envoyer le billet par email</p>
        {sentEmails.map((e) => (
          <div key={e} className="flex items-center gap-2 mb-2 bg-violet-neon/10 border border-violet-neon/20 rounded-lg px-3 py-1.5">
            <Mail className="w-3 h-3 text-violet-neon" />
            <span className="text-violet-neon text-xs font-medium flex-1 truncate">{e}</span>
            <span className="text-violet-neon/60 text-xs">✓ Envoyé</span>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-neon/60" />
            <input
              type="email"
              placeholder="Email du client"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendEmail()}
              className="w-full bg-bg border border-violet-neon/30 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder:text-white/25 focus:border-violet-neon/70 focus:outline-none text-sm transition-colors"
            />
          </div>
          <button
            onClick={sendEmail}
            disabled={!email.trim() || sendingChannel !== null}
            className="px-4 py-2.5 rounded-xl bg-violet-neon text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            {sendingChannel === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
}
