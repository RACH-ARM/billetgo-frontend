import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Users, ShieldCheck, Zap, MapPin, Heart } from 'lucide-react';

const VALUES = [
  { icon: Zap,        title: 'Simplicité',      desc: 'Acheter un billet en moins de 2 minutes, depuis ton téléphone, sans compte bancaire.' },
  { icon: ShieldCheck,title: 'Sécurité',        desc: 'QR Code unique chiffré, paiement Mobile Money certifié, zéro billet dupliqué.' },
  { icon: Heart,      title: 'Local d\'abord',  desc: 'Une équipe gabonaise, pour les événements gabonais, avec les solutions de paiement locales.' },
  { icon: Users,      title: 'Communauté',      desc: 'On croit en la culture, le sport et la fête à Libreville. On construit ça ensemble.' },
];

const STATS = [
  { value: '500+', label: 'Billets vendus' },
  { value: '20+',  label: 'Événements publiés' },
  { value: '10+',  label: 'Organisateurs partenaires' },
  { value: '100%', label: 'Mobile Money' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 bg-violet-neon/10 border border-violet-neon/30 rounded-full px-4 py-1.5 text-sm text-violet-neon mb-6">
              <MapPin className="w-4 h-4" /> Libreville, Gabon
            </span>
            <h1 className="font-bebas text-5xl sm:text-7xl tracking-wider text-gradient mb-4">
              À propos de BilletGo
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              La première plateforme de billetterie numérique conçue pour le Gabon.
              Notre mission : rendre l'achat de billets simple, sécurisé et accessible à tous.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Notre histoire */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 sm:p-12">
            <h2 className="section-title text-3xl mb-6">Notre histoire</h2>
            <div className="space-y-4 text-white/70 leading-relaxed">
              <p>
                BilletGo est né d'un constat simple : à Libreville, acheter un billet pour un concert ou une soirée
                était encore une aventure — files d'attente, billets papier, risques de contrefaçon,
                et surtout aucun moyen de payer en ligne sans carte bancaire.
              </p>
              <p>
                Nous avons développé une solution 100% locale : paiement Airtel Money et Moov Money,
                billets QR Code sécurisés, et une interface pensée pour les smartphones africains.
              </p>
              <p>
                Aujourd'hui, BilletGo accompagne les organisateurs dans la gestion complète de leurs événements :
                de la création à la validation d'entrée, en passant par le suivi des ventes en temps réel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <motion.div key={s.label} whileHover={{ scale: 1.03 }}
              className="glass-card rounded-xl p-6 text-center border border-violet-neon/20">
              <div className="font-bebas text-4xl text-gradient">{s.value}</div>
              <div className="text-white/50 text-sm mt-1">{s.label}</div>
            </motion.div>
          ))}
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

      {/* Partenaire */}

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Ticket className="w-12 h-12 text-violet-neon mx-auto mb-4" />
          <h2 className="font-bebas text-4xl text-gradient mb-4">Tu veux rejoindre l'aventure ?</h2>
          <p className="text-white/50 mb-8">Organise ton prochain événement avec BilletGo et accède à des milliers d'acheteurs.</p>
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
