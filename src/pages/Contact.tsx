import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const CONTACT_INFO = [
  { icon: Phone,   label: 'WhatsApp',  value: '+241 62 557 655',         href: 'https://wa.me/24162557655' },
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
            Une question, un problème, une idée ? L'équipe BilletGo est là.
          </p>
        </motion.div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Infos contact */}
        <div className="lg:col-span-2 space-y-4">
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
