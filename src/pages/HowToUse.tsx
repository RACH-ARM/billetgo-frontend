import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Ticket, Smartphone, Clock, Mail, BookOpen, ScanLine,
  ChevronDown, ArrowRight, WifiOff, ImageDown,
} from 'lucide-react';

// ─── StepCard ─────────────────────────────────────────────────────────────────
interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  cta?: { label: string; to: string };
}

function StepCard({ stepNumber, title, description, Icon, cta }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (stepNumber - 1) * 0.06 }}
      className="glass-card p-6 border border-violet-neon/10 relative"
    >
      {/* Numéro d'étape */}
      <div className="absolute -top-3.5 -left-3.5 w-8 h-8 bg-neon-gradient rounded-full flex items-center justify-center shadow-neon">
        <span className="text-white font-bebas text-sm leading-none">{stepNumber}</span>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-violet-neon/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-violet-neon" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bebas text-lg tracking-wider text-white mb-1">{title}</h3>
          <p className="text-white/50 text-sm leading-relaxed">{description}</p>
          {cta && (
            <Link
              to={cta.to}
              className="inline-flex items-center gap-1.5 mt-3 text-violet-neon text-sm font-semibold hover:underline"
            >
              {cta.label} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Et si je perds mon téléphone ?',
    answer:
      "Vos billets sont enregistrés dans votre compte BilletGab, pas sur votre téléphone. Il vous suffit de vous reconnecter depuis n'importe quel autre appareil — téléphone, tablette ou ordinateur — pour retrouver tous vos billets.",
  },
  {
    question: 'Est-ce que quelqu\'un peut utiliser mon billet à ma place ?',
    answer:
      'Chaque QR code est unique et personnel. Il ne peut être scanné qu\'une seule fois. Dès qu\'il est validé à l\'entrée, il est automatiquement invalidé — personne d\'autre ne peut entrer avec ce même billet.',
  },
  {
    question: "Et si l'événement est annulé ?",
    answer:
      "Les billets sont non remboursables. En cas d'annulation de l'événement, contactez directement l'organisateur pour toute demande de remboursement. BilletGab n'intervient pas dans le traitement des indemnisations entre acheteurs et organisateurs.",
  },
];

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="glass-card border border-violet-neon/10 overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left gap-4"
          >
            <span className="font-sora font-semibold text-white text-sm">{item.question}</span>
            <motion.div
              animate={{ rotate: openIndex === i ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronDown className="w-5 h-5 text-violet-neon" />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-white/50 text-sm leading-relaxed border-t border-white/5 pt-3">
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── Steps data ───────────────────────────────────────────────────────────────
const STEPS: Omit<StepCardProps, 'stepNumber'>[] = [
  {
    title: 'Choisir votre événement',
    Icon: Search,
    description:
      "Parcourez les événements sur la page d'accueil ou la page Événements. Cliquez sur une carte pour voir l'affiche, la description, le lieu, la date et les catégories de billets disponibles avec leurs tarifs.",
    cta: { label: 'Voir les événements', to: '/evenements' },
  },
  {
    title: 'Sélectionner vos billets',
    Icon: Ticket,
    description:
      "Sur la page de l'événement, choisissez votre catégorie (Standard, VIP, Carré Or…) et la quantité souhaitée. Le montant total se met à jour en temps réel dans le récapitulatif.",
  },
  {
    title: 'Payer via Mobile Money',
    Icon: Smartphone,
    description:
      "Choisissez Airtel Money ou Moov Money, entrez votre numéro de téléphone et vous recevez une notification de confirmation directement sur votre appareil. Validez avec votre code secret Mobile Money. Aucune information bancaire n'est saisie sur BilletGab — le paiement passe entièrement par votre opérateur.",
  },
  {
    title: 'Attendre la confirmation',
    Icon: Clock,
    description:
      "Après validation, une page de confirmation s'affiche et vérifie automatiquement que le paiement a bien été reçu. Cela prend généralement moins d'une minute. Ne fermez pas cette page pendant ce temps.",
  },
  {
    title: 'Recevoir vos billets',
    Icon: Mail,
    description:
      'Dès la confirmation du paiement, vos billets sont générés automatiquement et disponibles immédiatement dans "Mes billets". Ouvrez votre QR code au moins une fois avec internet — il sera sauvegardé sur votre téléphone pour être accessible même hors connexion.',
  },
  {
    title: 'Enregistrer votre billet en image',
    Icon: ImageDown,
    description:
      'Dans "Mes billets", affichez votre QR code puis appuyez sur "Enregistrer". Votre billet est sauvegardé directement dans votre galerie photo — accessible même sans connexion.',
    cta: { label: 'Mes billets', to: '/mes-billets' },
  },
  {
    title: "Le jour de l'événement",
    Icon: ScanLine,
    description:
      "Ouvrez BilletGab, allez dans \"Mes billets\" et appuyez sur \"Afficher le QR code\". L'agent scanne le code directement sur votre écran — résultat vert (valide) ou rouge (déjà utilisé). Pas d'internet ? Le QR code s'affiche quand même grâce au cache local.",
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HowToUse() {
  return (
    <main className="min-h-screen bg-bg pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-xs text-violet-neon uppercase tracking-widest font-semibold mb-3">
            Guide
          </p>
          <h1 className="font-bebas text-5xl sm:text-6xl tracking-wider text-gradient mb-3">
            Comment utiliser vos billets ?
          </h1>
          <p className="text-white/50 font-sora text-base max-w-xl mx-auto">
            Du choix de l'événement jusqu'à l'entrée le jour J — tout ce que vous devez savoir
            pour profiter de BilletGab sereinement.
          </p>
        </div>

        {/* Étapes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {STEPS.map((step, i) => (
            <StepCard key={i} stepNumber={i + 1} {...step} />
          ))}
        </div>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="font-bebas text-3xl tracking-wider text-white mb-6">
            Questions fréquentes
          </h2>
          <FaqAccordion items={FAQ_ITEMS} />
        </section>

        {/* Boutons de navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/mes-billets" className="neon-button text-center py-3 px-8 text-sm">
            Voir mes billets
          </Link>
          <Link
            to="/evenements"
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl border border-violet-neon/30 text-white/70 hover:text-white hover:border-violet-neon/60 transition-all text-sm font-semibold"
          >
            Voir les événements
          </Link>
        </div>

      </div>
    </main>
  );
}
