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
        <p className="text-white/30 text-xs mb-10">Dernière mise à jour : 23 mars 2026</p>

        <div className="glass-card p-8 border border-violet-neon/20">

          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données personnelles collectées sur BilletGo est{' '}
              <span className="text-white">Tiamiyou Arèmou</span>, concepteur et exploitant de la plateforme,
              basé à Libreville, Gabon.
            </p>
            <p>
              Contact :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
            </p>
          </Section>

          <Section title="2. Données collectées">
            <p>BilletGo collecte les données suivantes selon le profil et les actions de l'utilisateur :</p>

            <p className="text-white/80 font-medium mt-2">Lors de l'inscription (tous les utilisateurs)</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Prénom et nom de famille</li>
              <li>Adresse email (optionnelle si numéro de téléphone fourni)</li>
              <li>Numéro de téléphone (optionnel si email fourni)</li>
              <li>Mot de passe (stocké sous forme hachée avec bcrypt, inaccessible même par BilletGo)</li>
              <li>Nom de la société ou de l'organisation (pour les comptes organisateurs)</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Lors de la procédure KYC (organisateurs uniquement)</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Document d'identité officiel (CNI, passeport ou extrait RCCM) — stocké de façon sécurisée via Cloudinary</li>
              <li>Numéro Mobile Money pour la réception des versements (Airtel ou Moov)</li>
              <li>Date de soumission du dossier KYC</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Lors d'un achat</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Détail de la commande (événement, catégorie, quantité, montant)</li>
              <li>Numéro de téléphone mobile money utilisé pour le paiement</li>
              <li>Référence de transaction fournie par l'opérateur mobile money</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Lors de la validation d'un billet (scan)</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Identifiant du billet et date/heure de validation</li>
              <li>Identifiant du scanner ayant effectué la validation</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Lors d'une inscription sur liste d'attente</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Adresse email et/ou numéro de téléphone</li>
              <li>Date et heure d'inscription (pour le classement FIFO)</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Données techniques et journaux</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Adresse IP lors des connexions</li>
              <li>Journaux d'accès à l'API (conservés 30 jours via Upstash Redis)</li>
              <li>Journaux d'audit des actions administratives (création, modification, libération de versement, etc.)</li>
              <li>Logs de notifications envoyées (email, SMS, in-app)</li>
            </ul>
          </Section>

          <Section title="3. Finalités du traitement">
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>La création et la gestion de votre compte utilisateur.</li>
              <li>La vérification d'identité des organisateurs (KYC) avant publication d'événements.</li>
              <li>Le traitement de vos commandes et la génération de vos billets.</li>
              <li>L'envoi de vos billets, confirmations de paiement et notifications de remboursement.</li>
              <li>La gestion des listes d'attente et la notification en cas de disponibilité.</li>
              <li>La validation des billets à l'entrée des événements (scan).</li>
              <li>La gestion des versements progressifs aux organisateurs.</li>
              <li>La prévention de la fraude et la sécurité de la plateforme.</li>
              <li>Le support client et la médiation en cas de litige.</li>
              <li>L'envoi de communications liées à vos achats (pas de marketing sans consentement explicite).</li>
            </ul>
          </Section>

          <Section title="4. Partage des données">
            <p>
              BilletGo ne vend jamais vos données personnelles à des tiers. Vos données peuvent être
              partagées uniquement dans les cas suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <span className="text-white">Organisateurs d'événements</span> — reçoivent les informations
                de base (nom, contact) des acheteurs de leurs événements, pour les besoins de gestion de
                l'événement uniquement.
              </li>
              <li>
                <span className="text-white">Opérateurs de paiement</span> (Airtel Money, Moov Money) —
                reçoivent le numéro de téléphone et le montant pour traiter le paiement ou le remboursement.
              </li>
              <li>
                <span className="text-white">Prestataires techniques</span> — Vercel (frontend), Railway (API),
                Supabase (base de données), Cloudinary (stockage des documents KYC et médias), Upstash Redis
                (cache et file d'attente), tous soumis à des obligations contractuelles de confidentialité.
              </li>
              <li>
                <span className="text-white">Autorités compétentes</span> — uniquement sur réquisition
                judiciaire ou obligation légale gabonaise.
              </li>
            </ul>
          </Section>

          <Section title="5. Durée de conservation">
            <p>Vos données sont conservées pour les durées suivantes :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Données de compte : pendant toute la durée de vie du compte, puis 3 ans après suppression.</li>
              <li>Documents KYC des organisateurs : durée de vie du compte organisateur + 5 ans.</li>
              <li>Données de commande et de paiement : 5 ans à compter de la transaction (obligations comptables et fiscales).</li>
              <li>Données de scan (validation de billets) : 1 an après la date de l'événement.</li>
              <li>Données de liste d'attente : jusqu'à la fin de l'événement concerné.</li>
              <li>Journaux d'accès API : 30 jours (Redis).</li>
              <li>Journaux d'audit administratif : 2 ans.</li>
            </ul>
          </Section>

          <Section title="6. Sécurité des données">
            <p>
              BilletGo met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Hachage des mots de passe avec bcrypt (coût 12).</li>
              <li>QR codes signés cryptographiquement (HMAC-SHA256) pour prévenir la falsification.</li>
              <li>Communications chiffrées en HTTPS/TLS sur l'ensemble de la plateforme.</li>
              <li>Authentification JWT à durée limitée (15 minutes) avec mécanisme de rotation des tokens (refresh).</li>
              <li>Verrouillage de compte après plusieurs tentatives de connexion échouées.</li>
              <li>Stockage des documents KYC sur Cloudinary avec accès restreint et URLs signées.</li>
              <li>Base de données hébergée sur infrastructure sécurisée (Supabase PostgreSQL).</li>
              <li>Journaux d'audit de toutes les actions sensibles (administrateur, libération de versement).</li>
            </ul>
          </Section>

          <Section title="7. Vos droits">
            <p>
              Conformément aux principes de protection des données personnelles, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white">Droit d'accès</span> — consulter les données que nous détenons sur vous.</li>
              <li><span className="text-white">Droit de rectification</span> — corriger des données inexactes ou incomplètes.</li>
              <li><span className="text-white">Droit à l'effacement</span> — demander la suppression de votre compte et de vos données (sous réserve des obligations légales de conservation : commandes, paiements).</li>
              <li><span className="text-white">Droit d'opposition</span> — vous opposer à certains traitements non essentiels.</li>
              <li><span className="text-white">Droit à la portabilité</span> — recevoir vos données dans un format structuré et lisible.</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>.
              Nous répondons dans un délai de 30 jours.
            </p>
          </Section>

          <Section title="8. Cookies et stockage local">
            <p>
              BilletGo n'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de ciblage.
              Le stockage local du navigateur (localStorage) est utilisé exclusivement pour maintenir votre
              session de connexion (token JWT) et vos préférences de panier. Ces données restent sur votre
              appareil et ne sont pas transmises à des tiers.
            </p>
          </Section>

          <Section title="9. Modifications de la politique">
            <p>
              Cette politique de confidentialité peut être mise à jour pour refléter les évolutions de la
              plateforme ou les exigences légales. En cas de modification substantielle, les utilisateurs
              seront informés par email ou notification sur la plateforme.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question relative à la protection de vos données personnelles :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
              {' '}ou par téléphone au +241 62 557 655.
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
