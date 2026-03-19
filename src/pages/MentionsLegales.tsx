import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-bebas text-2xl tracking-wider text-violet-neon mb-3">{title}</h2>
    <div className="text-white/60 text-sm leading-relaxed space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex gap-4 py-2 border-b border-white/5 last:border-0">
    <span className="text-white/30 w-40 flex-shrink-0">{label}</span>
    <span className="text-white/70">{value}</span>
  </div>
);

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-bg py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">Mentions Légales</h1>
        <p className="text-white/30 text-xs mb-10">Dernière mise à jour : 14 mars 2026</p>

        <div className="glass-card p-8 border border-violet-neon/20 space-y-2">

          <Section title="Éditeur du site">
            <Row label="Nom commercial" value="BilletGo" />
            <Row label="Concepteur / Exploitant" value="Tiamiyou Arèmou" />
            <Row label="Forme juridique" value="[À COMPLÉTER après immatriculation]" />
            <Row label="N° RCCM" value="[À COMPLÉTER — Registre du Commerce de Libreville]" />
            <Row label="Siège social" value="Libreville, Gabon" />
            <Row label="Directeur de publication" value="Tiamiyou Arèmou" />
            <Row label="Email de contact" value={<a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>} />
            <Row label="WhatsApp" value={<a href="https://wa.me/24162557655" className="text-violet-neon hover:underline">+241 62 557 655</a>} />
          </Section>

          <Section title="Hébergement du site">
            <p className="text-white/50 text-xs mb-3">
              La plateforme BilletGo est hébergée sur plusieurs infrastructures cloud selon les composants :
            </p>
            <p className="text-white/80 font-medium">Frontend (interface utilisateur)</p>
            <Row label="Hébergeur" value="Vercel Inc." />
            <Row label="Adresse" value="340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis" />
            <Row label="Site" value={<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">vercel.com</a>} />

            <p className="text-white/80 font-medium mt-4">Backend (API)</p>
            <Row label="Hébergeur" value="Railway Corp." />
            <Row label="Adresse" value="340 S Lemon Ave, Suite 4133, Walnut, CA 91789, États-Unis" />
            <Row label="Site" value={<a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">railway.app</a>} />

            <p className="text-white/80 font-medium mt-4">Base de données</p>
            <Row label="Hébergeur" value="Supabase Inc." />
            <Row label="Adresse" value="970 Toa Payoh North, #07-04, Singapour 318992" />
            <Row label="Site" value={<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">supabase.com</a>} />
          </Section>

          <Section title="Traitement des paiements">
            <Row label="Prestataire" value="PVit (passerelle de paiement mobile)" />
            <Row label="Opérateurs" value="Airtel Money Gabon, Moov Money Gabon" />
            <p>
              Aucune donnée bancaire ou de paiement n'est stockée sur les serveurs BilletGo.
              Les transactions sont entièrement traitées par les opérateurs de téléphonie mobile.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Le site billetgo.ga, son contenu, son design, ses logos et l'ensemble du code source
              sont la propriété exclusive de Tiamiyou Arèmou, concepteur et exploitant de BilletGo.
              Toute reproduction totale ou partielle est interdite sans autorisation écrite préalable.
            </p>
            <p>
              Les marques et logos des opérateurs de paiement (Airtel Money, Moov Money) sont la
              propriété de leurs détenteurs respectifs.
            </p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>
              BilletGo s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur
              le site. Toutefois, BilletGo ne peut garantir l'exactitude, la complétude ou l'actualité
              des informations mises à disposition.
            </p>
            <p>
              BilletGo ne saurait être tenu responsable des dommages directs ou indirects résultant de
              l'utilisation ou de l'impossibilité d'utilisation du site.
            </p>
          </Section>

          <Section title="Droit applicable">
            <p>
              Le présent site et les présentes mentions légales sont soumis au droit de la République
              Gabonaise. Tout litige relatif au site sera soumis à la juridiction compétente de Libreville, Gabon.
            </p>
          </Section>

        </div>

        <div className="mt-8 flex gap-4 text-sm text-white/30 flex-wrap">
          <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
          <Link to="/cgv" className="hover:text-white transition-colors">CGV</Link>
          <Link to="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
        </div>
      </div>
    </div>
  );
}
