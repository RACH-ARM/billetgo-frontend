import { motion } from 'framer-motion';
import { MapPin, MessageSquare } from 'lucide-react';

const CHANNELS = [
  {
    label: 'WhatsApp',
    cta: 'Ouvrir la conversation →',
    href: 'https://wa.me/24162557655',
    border: 'border-green-500/30 hover:border-green-500/60',
    bg: 'bg-green-500/10 group-hover:bg-green-500/20',
    text: 'text-green-400 group-hover:text-green-300',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    cta: 'Voir notre profil →',
    href: 'https://instagram.com/billetgab',
    border: 'border-rose-neon/30 hover:border-rose-neon/60',
    bg: 'bg-rose-neon/10 group-hover:bg-rose-neon/20',
    text: 'text-rose-neon group-hover:text-rose-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    cta: 'Voir notre profil →',
    href: 'https://tiktok.com/@billetgab',
    border: 'border-cyan-neon/30 hover:border-cyan-neon/60',
    bg: 'bg-cyan-neon/10 group-hover:bg-cyan-neon/20',
    text: 'text-cyan-neon group-hover:text-cyan-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    cta: 'Voir notre page →',
    href: 'https://facebook.com/billetgab',
    border: 'border-violet-neon/30 hover:border-violet-neon/60',
    bg: 'bg-violet-neon/10 group-hover:bg-violet-neon/20',
    text: 'text-violet-neon group-hover:text-violet-400',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

export default function Contact() {
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
            Une question, un problème, une idée ? Retrouve-nous sur nos réseaux.
          </p>
        </motion.div>
      </section>

      <div className="max-w-lg mx-auto px-4 pb-20 space-y-4">

        {/* Cards réseaux sociaux */}
        {CHANNELS.map(({ label, cta, href, border, bg, text, icon }, i) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card rounded-xl p-5 border ${border} flex items-center gap-4 group transition-all`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} transition-colors`}>
              <span className={text}>{icon}</span>
            </div>
            <div className="flex-1">
              <div className="text-white/40 text-xs mb-0.5">{label}</div>
              <div className={`font-semibold text-sm transition-colors ${text}`}>{cta}</div>
            </div>
          </motion.a>
        ))}

        {/* Adresse + Horaires */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="glass-card rounded-xl p-5 border border-violet-neon/20 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-violet-neon" />
          </div>
          <div>
            <div className="text-white/40 text-xs mb-0.5">Adresse</div>
            <div className="text-white font-medium text-sm">Libreville, Gabon</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="glass-card rounded-xl p-5 border border-rose-neon/20"
        >
          <h3 className="font-semibold text-white mb-2 text-sm">Horaires du support</h3>
          <p className="text-white/50 text-sm">Lundi — Samedi</p>
          <p className="text-white font-mono text-sm">08h00 — 20h00</p>
          <p className="text-white/30 text-xs mt-2">Heure de Libreville (WAT)</p>
        </motion.div>

      </div>
    </div>
  );
}
