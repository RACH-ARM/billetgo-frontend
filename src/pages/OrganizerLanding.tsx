import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import {
  Smartphone, QrCode, BarChart2, Users, Download, ShieldCheck,
  CheckCircle, ArrowRight, CalendarDays, Settings, Share2, ScanLine,
  Zap, Banknote,
} from 'lucide-react';

// ── Features ──────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: Smartphone,
    title: 'Paiement Mobile Money natif',
    desc: 'Airtel Money et Moov Money intégrés directement. Zéro friction — vos clients paient en 10 secondes depuis leur téléphone, sans carte bancaire.',
    color: 'rose' as const,
  },
  {
    Icon: QrCode,
    title: 'Billets sécurisés anti-fraude',
    desc: 'Chaque billet génère un QR code HMAC unique, impossible à dupliquer. Zéro faux billet, zéro perte de revenus à l\'entrée.',
    color: 'violet' as const,
  },
  {
    Icon: BarChart2,
    title: 'Dashboard en temps réel',
    desc: 'Suivez vos ventes, revenus et taux de remplissage au fur et à mesure. Prenez les bonnes décisions au bon moment.',
    color: 'cyan' as const,
  },
  {
    Icon: Users,
    title: 'Gestion des agents de scan',
    desc: 'Créez des comptes dédiés pour vos contrôleurs d\'entrée. Chaque agent est verrouillé sur son événement — aucun risque de débordement.',
    color: 'green' as const,
  },
  {
    Icon: Download,
    title: 'Export instantané des acheteurs',
    desc: 'Téléchargez la liste complète de vos acheteurs en CSV en un clic — noms, téléphones, emails, montants, modes de paiement.',
    color: 'violet' as const,
  },
  {
    Icon: ShieldCheck,
    title: 'Commission transparente, rien de caché',
    desc: 'Commission unique à 10% sur chaque billet vendu. 0 FCFA tant que vous ne vendez pas. Pas d\'abonnement, pas de frais cachés.',
    color: 'rose' as const,
  },
] as const;

// ── Steps ─────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    Icon: CalendarDays,
    title: 'Créez votre événement',
    desc: 'Renseignez vos infos, téléchargez votre affiche et configurez vos catégories de billets (Standard, VIP, VIIP…) en moins de 5 minutes.',
    color: 'violet' as const,
  },
  {
    num: '02',
    Icon: Settings,
    title: 'Définissez vos prix et capacités',
    desc: 'Prix libre, quantités, max par commande. Vous gardez le contrôle total sur votre tarification.',
    color: 'rose' as const,
  },
  {
    num: '03',
    Icon: Share2,
    title: 'Publiez et vendez immédiatement',
    desc: 'Votre événement est live sur BilletGab. Partagez le lien sur vos réseaux et regardez les ventes décoller.',
    color: 'cyan' as const,
  },
  {
    num: '04',
    Icon: ScanLine,
    title: 'Gérez le jour J sans stress',
    desc: 'Vos agents scannent les QR codes à l\'entrée via l\'app dédiée. Les entrées remontent en temps réel sur votre dashboard.',
    color: 'green' as const,
  },
] as const;

type ColorKey = 'rose' | 'violet' | 'cyan' | 'green';

const COLORS: Record<ColorKey, { text: string; bg: string; border: string }> = {
  violet: { text: 'text-violet-neon', bg: 'bg-violet-neon/10', border: 'border-violet-neon/20' },
  rose:   { text: 'text-rose-neon',   bg: 'bg-rose-neon/10',   border: 'border-rose-neon/20' },
  cyan:   { text: 'text-cyan-neon',   bg: 'bg-cyan-neon/10',   border: 'border-cyan-neon/20' },
  green:  { text: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20' },
};

// ── Stats ─────────────────────────────────────────────────────
const STATS = [
  { value: '10%', label: 'de commission fixe', sub: 'sur chaque billet vendu' },
  { value: '< 30s', label: 'pour payer', sub: 'via Mobile Money' },
  { value: '100%', label: 'sécurisé', sub: 'QR code anti-fraude HMAC' },
  { value: '0 FCFA', label: 'à l\'avance', sub: 'aucun abonnement' },
];

// ── Component ─────────────────────────────────────────────────
export default function OrganizerLanding() {
  const { isAuthenticated, user } = useAuthStore();
  const isOrganizer = isAuthenticated && user?.role === 'ORGANIZER';
  const ctaPath = isOrganizer ? '/dashboard' : '/register?role=organizer';
  const ctaLabelPrimary = isOrganizer ? 'Accéder à mon dashboard' : 'Devenir partenaire';
  const ctaLabelFinal = isOrganizer ? 'Accéder à mon dashboard' : 'Créer mon compte organisateur';

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-neon/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-neon/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-neon/10 border border-violet-neon/20 text-violet-neon text-xs font-semibold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" />
              Plateforme N°1 au Gabon
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-bebas text-4xl sm:text-5xl lg:text-6xl tracking-wider text-white leading-none mb-4"
          >
            Vendez plus de billets.{' '}
            <span className="text-gradient">Gagnez plus d'argent.</span>{' '}
            Sans prise de tête.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/50 text-base max-w-2xl mx-auto mb-7 leading-relaxed"
          >
            BilletGab transforme la gestion de vos événements : billetterie en ligne, paiement Mobile Money instantané, contrôle des entrées par QR code. Tout ce qu'il vous faut pour remplir vos salles au Gabon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={ctaPath}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-neon-gradient text-white font-sora font-semibold rounded-xl shadow-neon-rose hover:shadow-neon text-base transition-shadow flex items-center gap-2"
              >
                {ctaLabelPrimary}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-white/5 border border-violet-neon/30 text-white font-sora font-semibold rounded-xl hover:border-violet-neon/60 hover:bg-white/10 text-base transition-all"
              >
                Voir les événements
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <p className="font-bebas text-3xl sm:text-4xl text-gradient leading-none mb-0.5">{s.value}</p>
              <p className="text-white text-sm font-semibold">{s.label}</p>
              <p className="text-white/30 text-xs">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-xs text-rose-neon uppercase tracking-widest font-semibold mb-3">La plateforme complète</p>
            <h2 className="font-bebas text-3xl sm:text-4xl tracking-wider text-white mb-2">Tout ce dont vous avez besoin</h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">Une solution pensée de A à Z pour les organisateurs d'événements au Gabon — pas un outil générique importé d'ailleurs.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => {
              const c = COLORS[feat.color];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`glass-card p-4 border ${c.border} flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg}`}>
                    <feat.Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div>
                    <h3 className="font-bebas text-xl tracking-wider text-white mb-1">{feat.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-xs text-cyan-neon uppercase tracking-widest font-semibold mb-3">De la création au jour J</p>
            <h2 className="font-bebas text-3xl sm:text-4xl tracking-wider text-white mb-2">Comment ça marche ?</h2>
            <p className="text-white/40 text-sm">Simple, rapide, efficace — vous serez opérationnel en moins d'une heure.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => {
              const c = COLORS[step.color];
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`glass-card p-4 border ${c.border} flex flex-col items-center text-center`}
                >
                  <span className={`font-bebas text-4xl leading-none opacity-20 select-none ${c.text} mb-3`}>{step.num}</span>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} mb-4`}>
                    <step.Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="font-bebas text-xl tracking-wider text-white mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Commission unique ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-7"
          >
            <p className="text-xs text-violet-neon uppercase tracking-widest font-semibold mb-3">Tarification</p>
            <h2 className="font-bebas text-3xl sm:text-4xl tracking-wider text-white mb-2">Une seule commission. Tout inclus.</h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">Pas d'abonnement. Pas de frais de création. Pas de niveaux confus. Une règle simple : BilletGab perçoit 10% uniquement sur les billets que vous vendez.</p>
          </motion.div>

          <div className="glass-card border border-violet-neon/30 overflow-hidden">
            {/* Header */}
            <div className="p-5 sm:p-6 bg-violet-neon/5 border-b border-violet-neon/20 text-center">
              <div className="inline-flex items-baseline gap-2 mb-2">
                <span className="font-mono text-5xl font-bold text-violet-neon">10%</span>
                <span className="text-white/50 text-base">de commission</span>
              </div>
              <p className="text-white/40 text-sm">Déduit automatiquement au moment du versement. Vous recevez le reste.</p>
            </div>

            {/* Inclus */}
            <div className="p-5 sm:p-6">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Tout ce qui est inclus dans ces 10%</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Page événement dédiée avec affiche HD, description, lieu et compte à rebours',
                  'Vente de billets en ligne 24h/24 via Airtel Money et Moov Money',
                  'Multi-catégories : Standard, VIP, VIIP, Gratuit',
                  'QR Code unique HMAC sécurisé généré automatiquement par billet',
                  'Application de scan illimitée pour le contrôle d\'entrée Jour J',
                  'Dashboard en temps réel avec export CSV des acheteurs',
                  'Notifications automatiques aux acheteurs (confirmation + rappels)',
                  'Versement sécurisé directement sur votre Mobile Money',
                  'Mise en relation avec des influenceurs et créateurs de contenu locaux via notre réseau',
                  'Support technique disponible avant et pendant votre événement',
                ].map((perk, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-violet-neon flex-shrink-0 mt-0.5" />
                    {perk}
                  </div>
                ))}
              </div>
            </div>

            {/* Exemple */}
            <div className="px-5 sm:px-6 pb-4 sm:pb-5">
              <div className="bg-bg-secondary rounded-2xl p-5">
                <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Exemple concret — 500 billets à 15 000 FCFA</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-mono text-2xl text-white font-bold">7 500 000</p>
                    <p className="text-white/30 text-xs mt-1">FCFA — ventes totales</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl text-red-400 font-bold">− 750 000</p>
                    <p className="text-white/30 text-xs mt-1">FCFA — commission BilletGab (10%)</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl text-green-400 font-bold">6 750 000</p>
                    <p className="text-white/30 text-xs mt-1">FCFA — vous recevez</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="px-5 sm:px-6 pb-4 sm:pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-white/60 text-center">
                {[
                  { Icon: CalendarDays, text: 'Commission par événement — aucun abonnement annuel' },
                  { Icon: Banknote,     text: 'Versement organisé directement par BilletGab en Mobile Money' },
                  { Icon: BarChart2,    text: 'Relevé de ventes disponible en temps réel dans votre dashboard' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-violet-neon/10 flex items-center justify-center">
                      <item.Icon className="w-4 h-4 text-violet-neon" />
                    </div>
                    <span className="text-xs">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 sm:px-6 pb-6 text-center">
              <Link to={ctaPath}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 bg-neon-gradient text-white font-sora font-bold rounded-xl shadow-neon-rose hover:shadow-neon text-base transition-shadow inline-flex items-center gap-2"
                >
                  {ctaLabelPrimary}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Réseau Disick Man Show ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card border border-rose-neon/30 p-5 sm:p-7 overflow-hidden relative"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-neon/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-neon/10 border border-rose-neon/20 text-rose-neon text-xs font-semibold uppercase tracking-widest">
                    Réseau partenaire
                  </span>
                </div>
                <h2 className="font-bebas text-3xl sm:text-4xl tracking-wider text-white mb-3 leading-none">
                  Accédez au réseau{' '}
                  <span className="text-rose-neon">Disick Man Show</span>
                </h2>
                <p className="text-white/50 text-sm leading-relaxed mb-4">
                  BilletGab est connecté à Disick Man Show (DMS), le collectif événementiel le plus actif au Gabon. Si vous souhaitez travailler avec leurs influenceurs et créateurs de contenu pour promouvoir votre événement, BilletGab peut vous mettre directement en contact.
                </p>
                <p className="text-white/40 text-xs leading-relaxed mb-4">
                  DMS et leurs influenceurs restent indépendants — ils définissent leurs propres tarifs et conditions. BilletGab facilite uniquement la mise en relation. Ce que vous négociez avec eux vous appartient.
                </p>

                <ul className="space-y-3">
                  {[
                    'Mise en relation directe avec l\'équipe DMS via BilletGab',
                    'Accès à des créateurs de contenu actifs dans l\'événementiel gabonais',
                    'Collaboration sur Instagram, TikTok et réseaux communautaires locaux',
                    'Conditions et tarifs négociés directement entre vous et les influenceurs',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                      <ArrowRight className="w-4 h-4 text-rose-neon flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* DMS badge */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-rose-neon/20 to-violet-neon/10 border border-rose-neon/40 flex flex-col items-center justify-center gap-1">
                  <span className="font-bebas text-3xl tracking-widest text-white leading-none">DMS</span>
                  <span className="font-bebas text-sm tracking-widest text-rose-neon">DISICK MAN SHOW</span>
                </div>
                <span className="text-xs text-white/30 text-center max-w-[180px]">Réseau influenceurs — mise en contact via BilletGab</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-3 leading-none">
              Prêt à remplir votre prochain événement ?
            </h2>
            <p className="text-white/40 text-sm mb-7">
              Rejoignez les organisateurs qui font confiance à BilletGab. Inscription gratuite, premier événement en ligne en moins d'une heure.
            </p>
            <Link to={ctaPath}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-neon-gradient text-white font-sora font-bold rounded-xl shadow-neon-rose hover:shadow-neon text-base transition-shadow inline-flex items-center gap-2"
              >
                {ctaLabelFinal}
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <p className="mt-4 text-white/20 text-xs">Aucun abonnement · 0 FCFA à l'avance · Commission uniquement sur les ventes</p>
          </motion.div>
        </div>
      </section>

      {/* Footer links */}
      <div className="border-t border-violet-neon/10 py-6 px-4 text-center text-sm text-white/30 flex flex-wrap items-center justify-center gap-4">
        <Link to="/" className="hover:text-white/70 transition-colors">Événements</Link>
        <span>·</span>
        <Link to="/a-propos" className="hover:text-white/70 transition-colors">À propos</Link>
        <span>·</span>
        <Link to="/contact" className="hover:text-white/70 transition-colors">Contact</Link>
        <span>·</span>
        <span>BilletGab © 2026</span>
      </div>

    </div>
  );
}
