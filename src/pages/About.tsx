import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  Ticket, Users, ShieldCheck, Zap, MapPin, Heart,
  Clock, Smartphone, TrendingUp, Mic2, Tent, Headphones, Trophy, ArrowRight,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { generateTicketCanvas } from '../utils/ticketCanvas';
import { buildGradientQRDataUrl } from '../utils/qrGradient';
import BilletGabLogo from '../components/common/BilletGabLogo';

const SITE_URL = 'https://billetgab.com';

const VALUES = [
  { icon: Zap,        title: 'Simplicité',      desc: 'Acheter un billet en moins de 2 minutes, depuis ton téléphone, sans compte bancaire.', accent: 'violet' as const },
  { icon: ShieldCheck,title: 'Sécurité',        desc: 'QR Code unique chiffré, paiement Mobile Money certifié, zéro billet dupliqué.', accent: 'cyan' as const },
  { icon: Heart,      title: 'Local d\'abord',  desc: 'Une équipe gabonaise, pour les événements gabonais, avec les solutions de paiement locales.', accent: 'rose' as const },
  { icon: Users,      title: 'Communauté',      desc: 'On croit en la culture, le sport et la fête à Libreville. On construit ça ensemble.', accent: 'violet' as const },
];

const ACCENTS = {
  violet: { text: 'text-violet-neon', bg: 'bg-violet-neon/10', top: 'before:bg-violet-neon' },
  rose:   { text: 'text-rose-neon',   bg: 'bg-rose-neon/10',   top: 'before:bg-rose-neon' },
  cyan:   { text: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   top: 'before:bg-cyan-neon' },
};
const VALUE_ACCENTS = ACCENTS;

// Couleurs choisies pour porter le sens du récit, pas juste en alternance :
// rose = alerte/problème, violet = la marque qui résout, cyan = le présent qui marche.
const STORY = [
  {
    icon: Clock,
    title: 'Le constat',
    desc: "À Libreville, acheter un billet pour un concert ou une soirée était encore une aventure : files d'attente, billets papier, risques de contrefaçon, et aucun moyen de payer en ligne sans carte bancaire.",
    accent: 'rose' as const,
  },
  {
    icon: Smartphone,
    title: 'La solution',
    desc: 'Une plateforme 100% locale : paiement Airtel Money et Moov Money, billets QR Code sécurisés, et une interface pensée pour les smartphones africains.',
    accent: 'violet' as const,
  },
  {
    icon: TrendingUp,
    title: "Aujourd'hui",
    desc: "BilletGab accompagne les organisateurs dans la gestion complète de leurs événements : de la création à la validation d'entrée, en passant par le suivi des ventes en temps réel.",
    accent: 'cyan' as const,
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

function TicketMockup() {
  const { data, isLoading } = useEvents({ limit: 6 });
  const event = useMemo(() => {
    const events = data?.events ?? [];
    if (!events.length) return null;
    return events.find((e) => e.isFeatured) ?? events[0];
  }, [data]);
  const noEvents = !isLoading && (data?.events?.length ?? 0) === 0;

  const cheapestCategory = useMemo(() => {
    if (!event?.ticketCategories?.length) return null;
    return [...event.ticketCategories].sort((a, b) => a.price - b.price)[0];
  }, [event]);

  // Rendu via le même générateur canvas que les vrais billets (utils/ticketCanvas.ts),
  // avec les vraies données de l'événement, et le même style de QR dégradé que la
  // plateforme (utils/qrGradient.ts, port du design réel du backend). Seul le payload
  // du QR diffère : il pointe vers la fiche publique de l'événement au lieu d'encoder
  // un vrai billet scannable — on ne peut pas exposer sur une page publique un code
  // d'entrée réellement utilisable.
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!event) return;
    setReady(false);
    let cancelled = false;
    (async () => {
      try {
        const qrDataUrl = await buildGradientQRDataUrl(`${SITE_URL}/events/${event.id}`, 512);
        if (cancelled || !canvasRef.current) return;
        await generateTicketCanvas(canvasRef.current, qrDataUrl, {
          ticketId: event.id,
          eventTitle: event.title,
          categoryName: cheapestCategory?.name,
          eventDate: event.eventDate,
          venueName: event.venueName,
          coverImageUrl: event.coverImageUrl ?? undefined,
          price: cheapestCategory?.price,
        });
        if (!cancelled) setReady(true);
      } catch {
        // silencieux — le skeleton reste affiché si la génération échoue
      }
    })();
    return () => { cancelled = true; };
  }, [event, cheapestCategory]);

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
        className="relative aspect-[900/380]"
      >
        {/* Face avant — vrai rendu du billet (même générateur que les billets achetés) */}
        <div style={{ backfaceVisibility: 'hidden' }} className="absolute inset-0 rounded-2xl overflow-hidden shadow-neon">
          {noEvents ? (
            <div className="absolute inset-0 glass-card border border-violet-neon/30 flex flex-col items-center justify-center gap-2 text-center p-4">
              <Ticket className="w-8 h-8 text-violet-neon/50" />
              <p className="text-white/40 text-sm">Ton billet s'affichera ici dès le premier événement publié</p>
            </div>
          ) : (
            <>
              {!ready && <div className="absolute inset-0 bg-bg-secondary animate-pulse rounded-2xl border border-violet-neon/20" />}
              <canvas
                ref={canvasRef}
                className={`w-full h-full rounded-2xl transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
              />
            </>
          )}
        </div>

        {/* Face arrière */}
        <div
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 glass-card rounded-2xl p-5 border border-violet-neon/30 shadow-neon flex flex-col items-center justify-center gap-3 text-center"
        >
          <BilletGabLogo height={32} />
          <p className="text-white/50 text-sm max-w-[240px]">Ton événement. Ton ticket. Maintenant.</p>
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

      {/* Notre histoire */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="section-title mb-12 text-center">Notre histoire</h2>
          <div className="space-y-12">
            {STORY.map(({ icon: Icon, title, desc, accent }, i) => {
              const c = ACCENTS[accent];
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: i * 0.1 }}
                  className="grid grid-cols-[auto_1fr] gap-4 sm:gap-7 items-start"
                >
                  <span className={`font-bebas text-6xl sm:text-7xl leading-[0.8] ${c.text} opacity-25 select-none`}>
                    0{i + 1}
                  </span>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${c.text}`} />
                      <h3 className="font-bebas text-2xl sm:text-3xl tracking-wide text-white">{title}</h3>
                    </div>
                    <p className="text-white/60 text-sm sm:text-base leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-3xl mb-10 text-center">Nos valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map(({ icon: Icon, title, desc, accent }, i) => {
              const c = VALUE_ACCENTS[accent];
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6, rotate: i % 2 === 0 ? -1 : 1 }}
                  className={`relative overflow-hidden rounded-2xl p-6 bg-bg-card/80 backdrop-blur-md before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] ${c.top}`}
                  style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.25)' }}
                >
                  <Icon className={`absolute -right-5 -bottom-5 w-32 h-32 ${c.text} opacity-[0.06] rotate-12 pointer-events-none`} />
                  <div className={`relative w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="relative font-bebas text-2xl tracking-wide text-white mb-2">{title}</h3>
                  <p className="relative text-white/55 text-sm leading-relaxed max-w-[85%]">{desc}</p>
                </motion.div>
              );
            })}
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
