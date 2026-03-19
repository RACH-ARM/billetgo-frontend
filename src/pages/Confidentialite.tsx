import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-bebas text-2xl tracking-wider text-violet-neon mb-3">{title}</h2>
    <div className="text-white/60 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-bg py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">Politique de Confidentialité</h1>
        <p className="text-white/30 text-xs mb-10">Dernière mise à jour : 14 mars 2026</p>

        <div className="glass-card p-8 border border-violet-neon/20">

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées sur BilletGo est
              {' '}<span className="text-white">Tiamiyou Arèmou</span>,
              concepteur et exploitant de la plateforme, basé à Libreville, Gabon.
            </p>
            <p>
              Contact DPO :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>BilletGo collecte les données suivantes selon les actions de l'utilisateur :</p>

            <p className="text-white/80 font-medium mt-2">Lors de l'inscription :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Prénom et nom de famille</li>
              <li>Adresse email (optionnelle si téléphone fourni)</li>
              <li>Numéro de téléphone (optionnel si email fourni)</li>
              <li>Mot de passe (stocké sous forme chiffrée, inaccessible même par BilletGo)</li>
              <li>Nom de la société (pour les organisateurs)</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Lors d'un achat :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Détail de la commande (événement, catégorie, quantité, montant)</li>
              <li>Numéro de téléphone mobile money utilisé pour le paiement</li>
              <li>Référence de transaction fournie par l'opérateur mobile money</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Lors du scan d'un billet :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Identifiant du billet et date/heure de validation</li>
              <li>Adresse IP du scanner</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Données techniques :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Adresse IP lors des connexions</li>
              <li>Journaux d'accès à l'API (conservés 30 jours)</li>
            </ul>
          </Section>

          <Section title="3. Finalités du traitement">
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>La création et la gestion de votre compte utilisateur.</li>
              <li>Le traitement de vos commandes et la génération de vos billets.</li>
              <li>La communication de vos billets et confirmations de paiement.</li>
              <li>La prévention de la fraude et la sécurité de la plateforme.</li>
              <li>Le support client.</li>
              <li>L'envoi de communications liées à vos achats (pas de marketing sans consentement explicite).</li>
            </ul>
          </Section>

          <Section title="4. Partage des données">
            <p>
              BilletGo ne vend jamais vos données personnelles à des tiers. Vos données peuvent être
              partagées dans les cas suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <span className="text-white">Organisateurs d'événements</span> — reçoivent le nom et les
                informations de contact des acheteurs de leurs événements, dans le cadre de la gestion de
                l'événement uniquement.
              </li>
              <li>
                <span className="text-white">Opérateurs de paiement</span> (Airtel Money, Moov Money via PVit) —
                reçoivent le numéro de téléphone et le montant pour traiter le paiement.
              </li>
              <li>
                <span className="text-white">Prestataires techniques</span> — hébergeurs (Railway, Vercel, Supabase)
                soumis à des obligations contractuelles de confidentialité.
              </li>
              <li>
                <span className="text-white">Autorités compétentes</span> — uniquement sur réquisition judiciaire
                ou obligation légale.
              </li>
            </ul>
          </Section>

          <Section title="5. Durée de conservation">
            <p>
              Vos données sont conservées pour les durées suivantes :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Données de compte : pendant toute la durée de vie du compte, puis 3 ans après suppression.</li>
              <li>Données de commande : 5 ans à compter de la transaction (obligations comptables et fiscales).</li>
              <li>Données de connexion/journaux : 30 jours.</li>
              <li>Données de paiement : 5 ans (obligations légales).</li>
            </ul>
          </Section>

          <Section title="6. Sécurité des données">
            <p>
              BilletGo met en œuvre des mesures techniques et organisationnelles pour protéger vos données :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Chiffrement des mots de passe avec bcrypt (coût 12).</li>
              <li>QR codes signés cryptographiquement (HMAC-SHA256).</li>
              <li>Communications chiffrées en HTTPS/TLS.</li>
              <li>Authentification JWT à durée limitée (15 minutes) avec rotation des tokens.</li>
              <li>Verrouillage de compte après 5 tentatives de connexion échouées.</li>
              <li>Base de données hébergée sur infrastructure sécurisée (Supabase, Gabarit UE/US).</li>
            </ul>
          </Section>

          <Section title="7. Vos droits">
            <p>
              Conformément aux principes de protection des données personnelles, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white">Droit d'accès</span> — consulter les données que nous détenons sur vous.</li>
              <li><span className="text-white">Droit de rectification</span> — corriger des données inexactes.</li>
              <li><span className="text-white">Droit à l'effacement</span> — demander la suppression de votre compte et de vos données (sous réserve des obligations légales de conservation).</li>
              <li><span className="text-white">Droit d'opposition</span> — vous opposer à certains traitements.</li>
              <li><span className="text-white">Droit à la portabilité</span> — recevoir vos données dans un format structuré.</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>.
              Nous répondons dans un délai de 30 jours.
            </p>
          </Section>

          <Section title="8. Cookies et traceurs">
            <p>
              BilletGo n'utilise pas de cookies publicitaires ou de tracking tiers. Seuls des cookies
              techniques strictement nécessaires au fonctionnement de la plateforme sont utilisés
              (authentification, préférences de session).
            </p>
          </Section>

          <Section title="9. Modifications de la politique">
            <p>
              Cette politique de confidentialité peut être mise à jour. En cas de modification substantielle,
              les utilisateurs seront informés par email ou notification sur la plateforme.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question relative à la protection de vos données :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
              {' '}ou par WhatsApp au{' '}
              <a href="https://wa.me/24162557655" className="text-violet-neon hover:underline">+241 62 557 655</a>.
            </p>
          </Section>

        </div>

        <div className="mt-8 flex gap-4 text-sm text-white/30 flex-wrap">
          <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
          <Link to="/cgv" className="hover:text-white transition-colors">CGV</Link>
          <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
        </div>
      </div>
    </div>
  );
}
