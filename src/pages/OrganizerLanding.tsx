import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import {
  Smartphone, QrCode, BarChart2, Users, Download, ShieldCheck,
  CheckCircle, ArrowRight, CalendarDays, Settings, Share2, ScanLine,
  Zap, Flame, Star, Ticket, Banknote,
} from 'lucide-react';

// ── Plans ──────────────────────────────────────────────────────
const PLANS = [
  {
    value: 'STANDARD',
    Icon: Ticket,
    label: 'Standard',
    commission: '10%',
    tagline: 'Publication & Infrastructure',
    subtitle: 'L\'essentiel pour démarrer',
    accent: 'border-violet-neon/40',
    accentBg: 'bg-violet-neon/10',
    accentText: 'text-violet-neon',
    badge: null as ReactNode,
    perks: [
      'Page événement dédiée avec affiche HD, description, lieu, compte à rebours',
      'Vente de billets en ligne 24h/24 via Airtel Money et Moov Money',
      'Multi-catégories : Standard, VIP, Carré Or, Gratuit',
      'QR Code unique HMAC sécurisé généré automatiquement par billet',
      'Ticket PDF généré instantanément et disponible dans le compte acheteur',
      'Application de scan QR illimitée pour le contrôle d\'entrée Jour J',
      'Dashboard : ventes en temps réel, liste acheteurs, export CSV',
      'Notifications automatiques aux acheteurs (confirmation + rappel J-1)',
      'Support technique via la plateforme',
    ],
    example: { ticket: '5 000 FCFA', organizer: '4 500 FCFA', platform: '500 FCFA' },
    popular: false,
  },
  {
    value: 'INTERMEDIAIRE',
    Icon: Zap,
    label: 'Intermédiaire',
    commission: '15%',
    tagline: 'Publication + Visibilité + Promotion',
    subtitle: 'Tout Standard + Promotion active',
    accent: 'border-rose-neon/60',
    accentBg: 'bg-rose-neon/10',
    accentText: 'text-rose-neon',
    badge: <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-neon/20 text-rose-neon font-bold border border-rose-neon/40"><Flame className="w-3 h-3" /> HOT</span>,
    perks: [
      'Tout ce qui est inclus dans Standard',
      'Mise en avant dans la section "ÉVÉNEMENTS TENDANCE HOT"',
      'Badge HOT visible sur la carte événement dans toutes les listes',
      'Publication affiche + lien d\'achat sur les réseaux BilletGo',
      'Story Instagram avec lien vers la page d\'achat',
      'Contenu teaser sur TikTok et réseaux partenaires',
      'Rapport analytique post-événement : vues, taux de conversion, pic de ventes',
      'Support prioritaire via la plateforme',
    ],
    example: { ticket: '5 000 FCFA', organizer: '4 250 FCFA', platform: '750 FCFA' },
    popular: true,
  },
  {
    value: 'PREMIUM',
    Icon: Star,
    label: 'Premium',
    commission: '20%',
    tagline: 'Visibilité maximale + Terrain',
    subtitle: 'Tout Standard et Intermédiaire + Campagne physique',
    accent: 'border-yellow-400/60',
    accentBg: 'bg-yellow-400/10',
    accentText: 'text-yellow-400',
    badge: <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-400/20 text-yellow-400 font-bold border border-yellow-400/40"><Star className="w-3 h-3" /> À la une</span>,
    perks: [
      'Tout ce qui est inclus dans Standard et Intermédiaire',
      'Section "À LA UNE" : 1er visible dès l\'arrivée sur la plateforme (Hero exclusif)',
      'Campagne d\'affichage physique dans Libreville (bars, clubs, universités, marchés)',
      'Collaboration avec les influenceurs gabonais les plus suivis',
      'Community manager dédié à votre événement',
      'Couverture médias locaux partenaires : presse en ligne, radios web gabonaises',
      'Notification push aux abonnés BilletGo de la catégorie de l\'événement',
      'Rapport analytique complet + bilan campagne terrain avec photos sous J+5',
      'Support VIP : ligne dédiée 7j/7 via la plateforme',
    ],
    example: { ticket: '5 000 FCFA', organizer: '4 000 FCFA', platform: '1 000 FCFA' },
    popular: false,
  },
];

// ── Features ──────────────────────────────────────────────────
const FEATURES = [
  {
    Icon: Smartphone,
    title: 'Paiement Mobile Money natif',
    desc: 'Airtel Money et Moov Money intégrés directement. Zéro friction — vos clients paient en 10 secondes depuis leur téléphone, sans carte bancaire.',
    color: 'rose',
  },
  {
    Icon: QrCode,
    title: 'Billets sécurisés anti-fraude',
    desc: 'Chaque billet génère un QR code HMAC unique, impossible à dupliquer. Zéro faux billet, zéro perte de revenus à l\'entrée.',
    color: 'violet',
  },
  {
    Icon: BarChart2,
    title: 'Dashboard en temps réel',
    desc: 'Suivez vos ventes, revenus et taux de remplissage au fur et à mesure. Prenez les bonnes décisions au bon moment.',
    color: 'cyan',
  },
  {
    Icon: Users,
    title: 'Gestion des agents de scan',
    desc: 'Créez des comptes dédiés pour vos contrôleurs d\'entrée. Chaque agent est verrouillé sur son événement — aucun risque de débordement.',
    color: 'green',
  },
  {
    Icon: Download,
    title: 'Export instantané des acheteurs',
    desc: 'Téléchargez la liste complète de vos acheteurs en CSV en un clic — noms, téléphones, emails, montants, modes de paiement.',
    color: 'violet',
  },
  {
    Icon: ShieldCheck,
    title: 'Commission transparente, rien de caché',
    desc: 'Commission dès 10% (Standard) jusqu\'à 20% (Premium). 0 FCFA tant que vous ne vendez pas. Pas d\'abonnement, pas de frais cachés.',
    color: 'rose',
  },
] as const;

// ── Steps ─────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    Icon: CalendarDays,
    title: 'Créez votre événement',
    desc: 'Renseignez vos infos, téléchargez votre affiche et configurez vos catégories de billets (Standard, VIP, Carré Or…) en moins de 5 minutes.',
    color: 'violet',
  },
  {
    num: '02',
    Icon: Settings,
    title: 'Définissez vos prix et capacités',
    desc: 'Prix libre, quantités, max par commande. Vous gardez le contrôle total sur votre tarification.',
    color: 'rose',
  },
  {
    num: '03',
    Icon: Share2,
    title: 'Publiez et vendez immédiatement',
    desc: 'Votre événement est live sur BilletGo. Partagez le lien sur vos réseaux et regardez les ventes décoller.',
    color: 'cyan',
  },
  {
    num: '04',
    Icon: ScanLine,
    title: 'Gérez le jour J sans stress',
    desc: 'Vos agents scannent les QR codes à l\'entrée via l\'app dédiée. Les entrées remontent en temps réel sur votre dashboard.',
    color: 'green',
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
  { value: '10%', label: 'de commission Standard', sub: 'et jusqu\'à 20% Premium' },
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
  const ctaLabelPlan = isOrganizer ? 'Accéder au dashboard' : undefined;

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-28 pb-20 sm:pt-36 sm:pb-28">
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
            className="font-bebas text-5xl sm:text-7xl lg:text-8xl tracking-wider text-white leading-none mb-6"
          >
            Vendez plus de billets.{' '}
            <span className="text-gradient">Gagnez plus d'argent.</span>{' '}
            Sans prise de tête.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            BilletGo transforme la gestion de vos événements : billetterie en ligne, paiement Mobile Money instantané, contrôle des entrées par QR code. Tout ce qu'il vous faut pour remplir vos salles au Gabon.
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
      <section className="px-4 sm:px-6 lg:px-8 py-10 border-y border-white/5">
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
              <p className="font-bebas text-4xl sm:text-5xl text-gradient leading-none mb-1">{s.value}</p>
              <p className="text-white text-sm font-semibold">{s.label}</p>
              <p className="text-white/30 text-xs">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs text-rose-neon uppercase tracking-widest font-semibold mb-3">La plateforme complète</p>
            <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-3">Tout ce dont vous avez besoin</h2>
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
                  className={`glass-card p-6 border ${c.border} flex flex-col gap-4`}
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
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs text-cyan-neon uppercase tracking-widest font-semibold mb-3">De la création au jour J</p>
            <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-3">Comment ça marche ?</h2>
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
                  className={`glass-card p-6 border ${c.border} flex flex-col items-center text-center`}
                >
                  <span className={`font-bebas text-6xl leading-none opacity-20 select-none ${c.text} mb-3`}>{step.num}</span>
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

      {/* ── Plans / Offres ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs text-yellow-400 uppercase tracking-widest font-semibold mb-3">Nos offres</p>
            <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-3">Choisissez votre niveau de visibilité</h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">Une offre par événement — aucun abonnement. Vous choisissez le niveau de promotion adapté à chaque show.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.value}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative glass-card flex flex-col border-2 ${plan.accent} ${plan.popular ? 'scale-[1.02]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-4 py-1 bg-neon-gradient text-white text-xs font-bold rounded-full shadow-neon-rose"><Star className="w-3 h-3" /> Le plus populaire</span>
                  </div>
                )}

                {/* Header */}
                <div className={`p-6 border-b border-white/5 ${plan.accentBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.accentBg}`}>
                      <plan.Icon className={`w-5 h-5 ${plan.accentText}`} />
                    </div>
                    {plan.badge}
                  </div>
                  <h3 className="font-bebas text-3xl tracking-wider text-white">{plan.label}</h3>
                  <p className={`text-xs font-semibold ${plan.accentText} uppercase tracking-widest mb-1`}>{plan.tagline}</p>
                  <p className="text-white/40 text-xs">{plan.subtitle}</p>
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <span className={`font-mono text-5xl font-bold ${plan.accentText}`}>{plan.commission}</span>
                    <span className="text-white/40 text-sm">de commission</span>
                  </div>
                </div>

                {/* Perks */}
                <div className="p-6 flex-1">
                  <ul className="space-y-3">
                    {plan.perks.map((perk, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-white/70">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.accentText}`} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Example */}
                <div className="px-6 pb-4">
                  <div className="bg-bg-secondary rounded-xl p-3 text-xs space-y-1.5">
                    <p className="text-white/30 uppercase tracking-widest text-[10px] mb-2">Exemple sur un billet à {plan.example.ticket}</p>
                    <div className="flex justify-between">
                      <span className="text-white/50">Vous recevez</span>
                      <span className="text-green-400 font-bold font-mono">{plan.example.organizer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/30">Commission BilletGo</span>
                      <span className="text-white/40 font-mono">{plan.example.platform}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="p-6 pt-2">
                  <Link to={ctaPath} className="block">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                        plan.popular
                          ? 'bg-neon-gradient text-white shadow-neon-rose'
                          : `border ${plan.accent} ${plan.accentText} hover:${plan.accentBg}`
                      }`}
                    >
                      {ctaLabelPlan ?? `Démarrer avec ${plan.label}`}
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Conditions communes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 glass-card p-6 border border-white/5"
          >
            <p className="text-xs text-white/40 uppercase tracking-widest text-center mb-4">Conditions communes aux 3 offres</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-white/60 text-center">
              {[
                { Icon: CalendarDays, text: 'Offre choisie par événement — aucun abonnement annuel' },
                { Icon: Banknote,     text: 'Versement organisé directement par BilletGo en Mobile Money' },
                { Icon: BarChart2,    text: 'Relevé de ventes disponible en temps réel dans votre tableau de bord' },
                { Icon: Ticket,       text: 'Billets gratuits : 500 FCFA de frais fixes par billet' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-violet-neon/10 flex items-center justify-center">
                    <item.Icon className="w-4 h-4 text-violet-neon" />
                  </div>
                  <span className="text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Mobile Money section ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 sm:p-12 border border-violet-neon/20 flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              <p className="text-xs text-violet-neon uppercase tracking-widest font-semibold mb-3">Paiement local</p>
              <h2 className="font-bebas text-4xl sm:text-5xl tracking-wider text-white mb-4 leading-none">
                Vos clients paient comme ils le font déjà — avec leur téléphone.
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-6">
                Fini les files d'attente aux guichets, les billets perdus et les faux billets. BilletGo s'appuie sur Airtel Money et Moov Money — les solutions que vos clients utilisent déjà chaque jour.
              </p>
              <ul className="space-y-3">
                {[
                  'Confirmation instantanée du paiement',
                  'Billet disponible immédiatement dans le compte acheteur',
                  'Zéro carte bancaire requise',
                  'Reversement sur votre compte après l\'événement',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Logos Mobile Money */}
            <div className="flex flex-row lg:flex-col gap-4 flex-shrink-0">
              {[
                { name: 'Airtel Money', color: 'from-rose-neon/20 to-rose-neon/5', border: 'border-rose-neon/30', text: 'text-rose-neon' },
                { name: 'Moov Money', color: 'from-cyan-neon/20 to-cyan-neon/5', border: 'border-cyan-neon/30', text: 'text-cyan-neon' },
              ].map((p) => (
                <div
                  key={p.name}
                  className={`w-40 h-20 rounded-2xl bg-gradient-to-br ${p.color} border ${p.border} flex items-center justify-center`}
                >
                  <span className={`font-bebas text-xl tracking-wider ${p.text}`}>{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-bebas text-5xl sm:text-6xl tracking-wider text-white mb-4 leading-none">
              Prêt à remplir votre prochain événement ?
            </h2>
            <p className="text-white/40 text-lg mb-10">
              Rejoignez les organisateurs qui font confiance à BilletGo. Inscription gratuite, premier événement en ligne en moins d'une heure.
            </p>
            <Link to={ctaPath}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 bg-neon-gradient text-white font-sora font-bold rounded-xl shadow-neon-rose hover:shadow-neon text-lg transition-shadow inline-flex items-center gap-2"
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
        <span>BilletGo © 2026</span>
      </div>

    </div>
  );
}
