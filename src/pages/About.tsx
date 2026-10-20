import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Ticket, Users, ShieldCheck, Zap, MapPin, Heart,
  Clock, Smartphone, TrendingUp, Mic2, Tent, Headphones, Trophy, ArrowRight,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { formatPrice } from '../utils/formatPrice';
import BilletGabLogo from '../components/common/BilletGabLogo';

const VALUES = [
  { icon: Zap,        title: 'Simplicité',      desc: 'Acheter un billet en moins de 2 minutes, depuis ton téléphone, sans compte bancaire.' },
  { icon: ShieldCheck,title: 'Sécurité',        desc: 'QR Code unique chiffré, paiement Mobile Money certifié, zéro billet dupliqué.' },
  { icon: Heart,      title: 'Local d\'abord',  desc: 'Une équipe gabonaise, pour les événements gabonais, avec les solutions de paiement locales.' },
  { icon: Users,      title: 'Communauté',      desc: 'On croit en la culture, le sport et la fête à Libreville. On construit ça ensemble.' },
];

const STORY = [
  {
    icon: Clock,
    title: 'Le constat',
    desc: "À Libreville, acheter un billet pour un concert ou une soirée était encore une aventure : files d'attente, billets papier, risques de contrefaçon, et aucun moyen de payer en ligne sans carte bancaire.",
  },
  {
    icon: Smartphone,
    title: 'La solution',
    desc: 'Une plateforme 100% locale : paiement Airtel Money et Moov Money, billets QR Code sécurisés, et une interface pensée pour les smartphones africains.',
  },
  {
    icon: TrendingUp,
    title: "Aujourd'hui",
    desc: "BilletGab accompagne les organisateurs dans la gestion complète de leurs événements : de la création à la validation d'entrée, en passant par le suivi des ventes en temps réel.",
  },
];

// Catégories mises en avant — fond en dégradé pour l'instant. À remplacer par une
// vraie photo de catégorie dès qu'on en a (même ratio carré, même overlay de texte).
const CATEGORY_TILES = [
  { value: 'CONCERT', label: 'Concerts', Icon: Mic2, gradient: 'from-violet-neon via-violet-neon/60 to-transparent' },
  { value: 'FESTIVAL', label: 'Festivals', Icon: Tent, gradient: 'from-rose-neon via-rose-neon/50 to-transparent' },
  { value: 'CLUB', label: 'Soirées', Icon: Headphones, gradient: 'from-cyan-neon via-cyan-neon/40 to-transparent' },
  { value: 'SPORT', label: 'Sport', Icon: Trophy, gradient: 'from-violet-light via-rose-neon/40 to-transparent' },
];

// Le QR est un motif décoratif (jamais un vrai code scannable) — on affiche
// de vraies données d'événement mais pas un billet réellement acheté, pour
// ne jamais exposer un QR utilisable ni les infos d'un acheteur.
const DECORATIVE_QR_CELLS = [1, 2, 4, 5, 7, 8, 10, 13, 14];

function TicketMockup() {
  const { data } = useEvents({ limit: 6 });
  const event = useMemo(() => {
    const events = data?.events ?? [];
    if (!events.length) return null;
    return events.find((e) => e.isFeatured) ?? events[0];
  }, [data]);

  const cheapestCategory = useMemo(() => {
    if (!event?.ticketCategories?.length) return null;
    return [...event.ticketCategories].sort((a, b) => a.price - b.price)[0];
  }, [event]);

  const title = event?.title ?? 'Festival Ogooué';
  const dateLabel = event
    ? new Date(event.eventDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()
    : '14 DÉC';
  const city = event?.venueCity ?? 'Libreville';
  const categoryName = cheapestCategory?.name ?? 'VIP';
  const priceLabel = cheapestCategory ? formatPrice(cheapestCategory.price) : '25 000 FCFA';

  // Flip au scroll — une rotation complète sur les 1400 premiers px de la page.
  const { scrollY } = useScroll();
  const scrollRotateY = useTransform(scrollY, [0, 1400], [0, 360], { clamp: true });

  // Léger tilt au survol du curseur (desktop) — s'additionne au flip de scroll.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springTiltX = useSpring(tiltX, { stiffness: 150, damping: 15 });
  const springTiltY = useSpring(tiltY, { stiffness: 150, damping: 15 });
  const tiltRotateX = useTransform(springTiltX, (v) => v * -8);
  const tiltRotateY = useTransform(springTiltY, (v) => v * 8);
  const rotateY = useTransform([scrollRotateY, tiltRotateY], ([a, b]: number[]) => a + b);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    tiltY.set((e.clientX - rect.left) / rect.width - 0.5);
    tiltX.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <div className="relative mx-auto w-full max-w-sm" style={{ perspective: 1200 }}>
      <div className="absolute inset-0 bg-neon-gradient opacity-25 blur-3xl rounded-full pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: tiltRotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Face avant */}
        <div
          style={{ backfaceVisibility: 'hidden' }}
          className="glass-card rounded-2xl p-5 border border-violet-neon/30 shadow-neon"
        >
          <div className="flex items-center justify-between mb-5">
            <span className="font-bebas text-lg text-gradient tracking-wider">BILLETGAB</span>
            <Ticket className="w-5 h-5 text-cyan-neon" />
          </div>
          <p className="font-bebas text-2xl text-white tracking-wide leading-tight line-clamp-1">{title}</p>
          <p className="text-white/40 text-xs mt-1 font-mono">{dateLabel} · {city.toUpperCase()}, GABON</p>
          <div className="border-t border-dashed border-white/15 my-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest">Catégorie</p>
              <p className="text-white text-sm font-semibold">{categoryName}</p>
              <p className="text-cyan-neon text-xs font-mono mt-1">{priceLabel}</p>
            </div>
            <div className="w-16 h-16 rounded-lg bg-white grid grid-cols-4 grid-rows-4 gap-[2px] p-2 flex-shrink-0">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={`rounded-[1px] ${DECORATIVE_QR_CELLS.includes(i) ? 'bg-bg' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Face arrière */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 glass-card rounded-2xl p-5 border border-violet-neon/30 shadow-neon flex flex-col items-center justify-center gap-4 text-center"
        >
          <BilletGabLogo height={36} />
          <p className="text-white/50 text-sm max-w-[220px]">Ton événement. Ton ticket. Maintenant.</p>
        </div>
      </motion.div>
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <Helmet>
        <title>À propos — BilletGab, la billetterie événementielle du Gabon</title>
        <meta name="description" content="BilletGab est la billetterie pensée pour le Gabon. Notre mission : rendre l'accès aux événements simple, sécurisé et local." />
        <link rel="canonical" href="https://billetgab.com/a-propos" />
        <meta property="og:title" content="À propos — BilletGab" />
        <meta property="og:description" content="La billetterie événementielle pensée pour le Gabon. Simple, sécurisée, locale." />
        <meta property="og:url" content="https://billetgab.com/a-propos" />
        <meta property="og:image" content="https://billetgab.com/og-default.jpg" />
      </Helmet>

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-violet-neon/10 border border-violet-neon/30 rounded-full px-4 py-1.5 text-sm text-violet-neon mb-6">
              <MapPin className="w-4 h-4" /> Libreville, Gabon
            </span>
            <h1 className="font-bebas text-5xl sm:text-7xl tracking-wider text-gradient mb-4">
              À propos de BilletGab
            </h1>
            <p className="text-white/60 text-lg max-w-xl mx-auto lg:mx-0">
              La billetterie numérique pensée pour le Gabon.
              Notre mission : rendre l'achat de billets simple, sécurisé et accessible à tous.
            </p>
            <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
              <Link to="/organisateurs" className="neon-button">Devenir organisateur</Link>
              <Link to="/" className="px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:border-violet-neon/50 hover:text-white transition-all">
                Voir les événements
              </Link>
            </div>
          </motion.div>
          <TicketMockup />
        </div>
      </section>

      {/* Notre histoire — timeline */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title mb-10 text-center">Notre histoire</h2>
          <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-violet-neon via-rose-neon to-cyan-neon hidden sm:block" />
            <div className="space-y-8">
              {STORY.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex gap-5 sm:gap-6"
                >
                  <div className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-bg-card border border-violet-neon/40 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-violet-neon" />
                  </div>
                  <div className="glass-card rounded-2xl p-5 sm:p-6 flex-1">
                    <h3 className="font-semibold text-white mb-2">{title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-3xl mb-10 text-center">Nos valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-6 border border-violet-neon/20 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-violet-neon" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories d'événements — slot photo prêt (voir commentaire plus haut) */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-3xl mb-3 text-center">Ce que tu trouveras sur BilletGab</h2>
          <p className="text-white/50 text-center mb-10 max-w-xl mx-auto">
            Des concerts aux soirées, en passant par le sport : découvre les événements qui font vibrer Libreville.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORY_TILES.map(({ value, label, Icon, gradient }, i) => (
              <motion.div key={value} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link
                  to={`/?category=${value}`}
                  className="group relative block aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-violet-neon/40 transition-colors"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.18] group-hover:opacity-[0.3] transition-opacity`} />
                  <div className="absolute inset-0 bg-dark-card" style={{ opacity: 0.6 }} />
                  <div className="relative h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                    <span className="font-semibold text-white text-sm sm:text-base">{label}</span>
                  </div>
                  <ArrowRight className="absolute bottom-3 right-3 w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Ticket className="w-12 h-12 text-violet-neon mx-auto mb-4" />
          <h2 className="font-bebas text-4xl text-gradient mb-4">Tu veux rejoindre l'aventure ?</h2>
          <p className="text-white/50 mb-8">Organise ton prochain événement avec BilletGab et accède à des milliers d'acheteurs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/organisateurs" className="neon-button">Devenir organisateur</Link>
            <Link to="/contact" className="px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:border-violet-neon/50 hover:text-white transition-all">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
