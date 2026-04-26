import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import api from '../services/api';

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
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/utils/mentions-legales.pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mentions-legales-billetgo.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="flex items-center justify-between gap-4 flex-wrap mb-10">
          <div>
            <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">Mentions Légales</h1>
            <p className="text-white/30 text-xs">Dernière mise à jour : 16 avril 2026</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>

        <div className="glass-card p-8 border border-violet-neon/20 space-y-2">

          <Section title="Éditeur du site">
            <Row label="Nom commercial" value="BilletGo" />
            <Row label="Concepteur / Exploitant" value="Tiamiyou Arèmou" />
            <Row label="Forme juridique" value="[À compléter après immatriculation]" />
            <Row label="N° RCCM" value="[À compléter — Registre du Commerce de Libreville]" />
            <Row label="Siège social" value="Libreville, Gabon" />
            <Row label="Directeur de publication" value="Tiamiyou Arèmou" />
            <Row label="Email de contact" value={<a href="mailto:contact@billetgo.net" className="text-violet-neon hover:underline">contact@billetgo.net</a>} />
            <Row label="Téléphone" value="+241 62 557 655" />
          </Section>

          <Section title="Hébergement du site">
            <p className="text-white/50 text-xs mb-3">
              La plateforme BilletGo est hébergée sur plusieurs infrastructures cloud selon les composants :
            </p>

            <p className="text-white/80 font-medium">Frontend (interface utilisateur)</p>
            <Row label="Hébergeur" value="Vercel Inc." />
            <Row label="Adresse" value="340 Pine Street, Suite 900, San Francisco, CA 94104, États-Unis" />
            <Row label="Site" value={<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">vercel.com</a>} />

            <p className="text-white/80 font-medium mt-4">Backend (API REST)</p>
            <Row label="Hébergeur" value="Railway Corp." />
            <Row label="Adresse" value="340 S Lemon Ave, Suite 4133, Walnut, CA 91789, États-Unis" />
            <Row label="Site" value={<a href="https://railway.app" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">railway.app</a>} />

            <p className="text-white/80 font-medium mt-4">Base de données PostgreSQL</p>
            <Row label="Hébergeur" value="Supabase Inc." />
            <Row label="Adresse" value="970 Toa Payoh North, #07-04, Singapour 318992" />
            <Row label="Site" value={<a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">supabase.com</a>} />

            <p className="text-white/80 font-medium mt-4">Cache et file de tâches</p>
            <Row label="Prestataire" value="Upstash Inc." />
            <Row label="Usage" value="Limitation de débit, cache de session, file de tâches asynchrones" />
            <Row label="Site" value={<a href="https://upstash.com" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">upstash.com</a>} />

            <p className="text-white/80 font-medium mt-4">Stockage de médias et documents KYC</p>
            <Row label="Prestataire" value="Cloudinary Ltd." />
            <Row label="Usage" value="Hébergement des images d'événements, affiches, documents KYC des organisateurs" />
            <Row label="Site" value={<a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-violet-neon hover:underline">cloudinary.com</a>} />
          </Section>

          <Section title="Traitement des paiements">
            <Row label="Passerelle" value="PVit (agrégateur Mobile Money certifié)" />
            <Row label="Opérateurs" value="Airtel Money Gabon, Moov Money Gabon" />
            <p>
              Les paiements sont traités directement par les opérateurs de téléphonie mobile.
              Aucune donnée bancaire ou de paiement n'est stockée sur les serveurs BilletGo.
              Les transactions sont confirmées par notification directe de l'opérateur sur le téléphone
              de l'acheteur.
            </p>
            <p>
              Les versements aux organisateurs sont effectués via Mobile Money (Airtel ou Moov) selon
              le calendrier de versement progressif défini aux CGU.
            </p>
          </Section>

          <Section title="Communications">
            <Row label="Email transactionnel" value="Resend (SMTP) — confirmations, billets, notifications" />
            <Row label="SMS" value="Via opérateurs gabonais (notifications critiques)" />
            <p>
              Les communications envoyées par BilletGo sont exclusivement transactionnelles (confirmations
              d'achat, billets, notifications de remboursement, annulations d'événements). Aucun message
              marketing n'est envoyé sans consentement explicite de l'utilisateur.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Le site billetgo.net, son contenu, son design, ses logos et l'ensemble du code source
              sont la propriété exclusive de Tiamiyou Arèmou, concepteur et exploitant de BilletGo.
              Toute reproduction totale ou partielle est interdite sans autorisation écrite préalable.
            </p>
            <p>
              Les marques et logos des opérateurs de paiement (Airtel Money, Moov Money) ainsi que des
              prestataires techniques sont la propriété de leurs détenteurs respectifs.
            </p>
          </Section>

          <Section title="Limitation de responsabilité">
            <p>
              BilletGo s'efforce d'assurer la disponibilité et l'exactitude des informations diffusées
              sur la plateforme. BilletGo intervient en qualité d'intermédiaire technique et de séquestre
              entre les acheteurs et les organisateurs.
            </p>
            <p>
              BilletGo ne saurait être tenu responsable du contenu des événements, des décisions des
              organisateurs (annulation, report, modification), ni des incidents survenant lors des
              événements. La responsabilité financière de BilletGo en cas d'annulation est limitée aux
              fonds effectivement retenus en séquestre au moment de l'annulation.
            </p>
          </Section>

          <Section title="Droit applicable">
            <p>
              Le présent site et les présentes mentions légales sont soumis au droit de la République
              Gabonaise et, le cas échéant, au droit OHADA. Tout litige sera soumis aux juridictions
              compétentes de Libreville, Gabon.
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
