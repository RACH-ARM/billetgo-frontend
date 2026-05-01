import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, MessageSquare, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const WHATSAPP_HREF = 'https://wa.me/24162557655';

const CONTACT_INFO = [
  { icon: Mail,    label: 'Email',     value: 'contact@billetgab.com',    href: 'mailto:contact@billetgab.com' },
  { icon: MapPin,  label: 'Adresse',   value: 'Libreville, Gabon',      href: null },
];

const SUBJECTS = [
  'Problème avec un billet',
  'Question sur un paiement',
  'Devenir organisateur',
  'Signaler un bug',
  'Partenariat',
  'Autre',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erreur lors de l\'envoi — réessayez dans quelques instants');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="pt-28 pb-12 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 bg-cyan-neon/10 border border-cyan-neon/30 rounded-full px-4 py-1.5 text-sm text-cyan-neon mb-6">
            <MessageSquare className="w-4 h-4" /> On te répond sous 24h
          </span>
          <h1 className="font-bebas text-5xl sm:text-7xl tracking-wider text-gradient mb-4">Contact</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Une question, un problème, une idée ? L'équipe BilletGab est là.
          </p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Infos contact */}
        <div className="lg:col-span-2 space-y-4">

          {/* WhatsApp card */}
          <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer"
            className="glass-card rounded-xl p-5 border border-green-500/30 flex items-center gap-4 group hover:border-green-500/60 transition-all">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/25 transition-colors">
              <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-white/40 text-xs mb-0.5">WhatsApp</div>
              <div className="text-green-400 font-semibold text-sm group-hover:text-green-300 transition-colors">
                Ouvrir la conversation →
              </div>
            </div>
          </a>

          {/* Email + Adresse */}
          {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="glass-card rounded-xl p-5 border border-violet-neon/20 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-violet-neon" />
              </div>
              <div>
                <div className="text-white/40 text-xs mb-0.5">{label}</div>
                {href ? (
                  <a href={href} className="text-white font-medium hover:text-violet-neon transition-colors">{value}</a>
                ) : (
                  <span className="text-white font-medium">{value}</span>
                )}
              </div>
            </div>
          ))}

          <div className="glass-card rounded-xl p-5 border border-rose-neon/20">
            <h3 className="font-semibold text-white mb-2 text-sm">Horaires du support</h3>
            <p className="text-white/50 text-sm">Lundi — Samedi</p>
            <p className="text-white font-mono text-sm">08h00 — 20h00</p>
            <p className="text-white/30 text-xs mt-2">Heure de Libreville (WAT)</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-3">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-10 border border-cyan-neon/30 text-center h-full flex flex-col items-center justify-center gap-4">
              <CheckCircle className="w-16 h-16 text-cyan-neon" />
              <h2 className="font-bebas text-3xl text-gradient">Message envoyé !</h2>
              <p className="text-white/60">On te répondra dans les 24 heures. Merci de ta confiance.</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                className="mt-4 px-6 py-2 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm transition-colors">
                Envoyer un autre message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 sm:p-8 border border-violet-neon/20 space-y-5">
              <h2 className="font-semibold text-white text-lg mb-2">Envoie-nous un message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Nom complet *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jean Dupont"
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-neon/60 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Téléphone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+241 XX XXX XXX"
                    className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-neon/60 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ton@email.com"
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-neon/60 transition-colors" />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Sujet *</label>
                <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-neon/60 transition-colors appearance-none">
                  <option value="">Choisir un sujet…</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Message *</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Décris ton problème ou ta question…"
                  className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-neon/60 transition-colors resize-none" />
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-400 text-sm">{error}</p>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="neon-button w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? 'Envoi en cours...' : 'Envoyer le message'}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
