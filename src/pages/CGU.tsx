import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import api from '../services/api';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-bebas text-2xl tracking-wider text-violet-neon mb-3">{title}</h2>
    <div className="text-white/60 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function CGU() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/utils/cgu.pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cgu-billetgo.pdf';
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
            <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">Conditions Générales d'Utilisation</h1>
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

        <div className="glass-card p-8 border border-violet-neon/20">

          <Section title="1. Présentation de la plateforme">
            <p>
              BilletGo est une plateforme de billetterie événementielle en ligne conçue et exploitée par{' '}
              <span className="text-white">Tiamiyou Arèmou</span>, basée à Libreville, Gabon.
              Elle permet aux utilisateurs d'acheter des billets pour des événements organisés au Gabon,
              aux organisateurs de créer et gérer leurs événements, et aux scanners de valider les billets à l'entrée.
            </p>
            <p>
              BilletGo agit en qualité d'intermédiaire technique et de séquestre (escrow) entre les acheteurs
              et les organisateurs d'événements. Les fonds collectés auprès des acheteurs sont détenus par
              BilletGo et reversés progressivement aux organisateurs selon les conditions définies aux présentes.
            </p>
            <p>
              L'accès à la plateforme est disponible à l'adresse billetgo.net et via l'application web progressive (PWA).
            </p>
          </Section>

          <Section title="2. Acceptation des CGU">
            <p>
              L'utilisation de BilletGo implique l'acceptation pleine et entière des présentes Conditions Générales
              d'Utilisation. Toute personne qui ne les accepte pas doit s'abstenir d'utiliser la plateforme.
            </p>
            <p>
              En cochant la case prévue à cet effet lors de l'inscription ou en acceptant les conditions lors de
              la création d'un événement, l'utilisateur reconnaît avoir lu, compris et accepté les présentes CGU
              ainsi que les Conditions Générales de Vente (CGV).
            </p>
          </Section>

          <Section title="3. Inscription et comptes utilisateurs">
            <p>
              L'inscription est ouverte à toute personne physique âgée de 18 ans ou plus. L'utilisateur s'engage à
              fournir des informations exactes, complètes et à jour lors de la création de son compte.
            </p>
            <p>Quatre types de comptes existent sur la plateforme :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white">Acheteur (BUYER)</span> — peut acheter des billets, accéder à ses commandes, demander des remboursements ou transférer ses billets.</li>
              <li><span className="text-white">Organisateur (ORGANIZER)</span> — peut créer des événements après validation KYC et approbation par l'équipe BilletGo.</li>
              <li><span className="text-white">Scanner</span> — peut valider les billets à l'entrée des événements auxquels il est assigné par un organisateur ou un administrateur.</li>
              <li><span className="text-white">Administrateur (ADMIN)</span> — gère la plateforme, valide les événements, traite les remboursements et libère les versements (usage interne uniquement).</li>
            </ul>
            <p>
              Chaque utilisateur est responsable de la confidentialité de ses identifiants. Tout accès effectué
              avec ses identifiants est réputé effectué par lui.
            </p>
          </Section>

          <Section title="4. Utilisation de la plateforme">
            <p>L'utilisateur s'engage à utiliser BilletGo de manière loyale et conforme aux lois en vigueur au Gabon. Sont notamment interdits :</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>La revente de billets à des prix supérieurs au prix d'achat (scalping).</li>
              <li>La création de comptes fictifs ou l'utilisation d'identités usurpées.</li>
              <li>Toute tentative de falsification, duplication ou contrefaçon des QR codes sécurisés.</li>
              <li>Le contournement des mécanismes de sécurité de la plateforme.</li>
              <li>L'utilisation automatisée (bots, scripts) sans autorisation écrite préalable.</li>
              <li>La diffusion de contenus illicites, diffamatoires ou portant atteinte aux droits des tiers.</li>
              <li>Toute tentative de fraude au paiement ou de remboursement abusif.</li>
            </ul>
          </Section>

          <Section title="5. Conditions spécifiques aux organisateurs">
            <p>
              Pour devenir organisateur sur BilletGo, toute personne physique ou morale doit :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Soumettre un document d'identité valide (CNI, passeport ou RCCM) via la procédure KYC de la plateforme.</li>
              <li>Fournir un numéro Mobile Money valide (Airtel ou Moov) pour la réception des versements.</li>
              <li>Accepter les présentes CGU et les CGV, y compris les conditions de versement progressif.</li>
            </ul>
            <p>
              Tout compte organisateur est soumis à validation par l'équipe BilletGo avant d'être autorisé à publier
              des événements. BilletGo se réserve le droit de refuser ou de suspendre tout compte organisateur
              sans justification préalable, notamment en cas de suspicion de fraude ou de non-conformité.
            </p>
            <p>
              L'organisateur est seul responsable du contenu, de l'exactitude des informations de son événement,
              de son organisation, de son déroulement et du respect de la réglementation en vigueur (autorisations
              administratives, sécurité, etc.).
            </p>
          </Section>

          <Section title="6. Validation et publication des événements">
            <p>
              Tout événement créé sur BilletGo est soumis à une procédure de validation avant publication :
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>L'organisateur soumet l'événement (statut : En révision).</li>
              <li>L'équipe BilletGo examine l'événement dans un délai de 24 à 72 heures.</li>
              <li>L'événement est approuvé, publié ou retourné pour modifications.</li>
            </ol>
            <p>
              BilletGo se réserve le droit de refuser tout événement contraire aux lois gabonaises,
              aux bonnes mœurs, ou aux présentes CGU. La publication différée (date programmée) est disponible
              pour les organisateurs approuvés.
            </p>
          </Section>

          <Section title="7. Séquestre et versements progressifs">
            <p>
              BilletGo collecte l'intégralité des fonds des acheteurs et les conserve en qualité de séquestre
              (escrow) jusqu'au reversement à l'organisateur selon un calendrier progressif défini par le
              niveau de confiance (tier) de l'organisateur :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white">Nouveau</span> — jusqu'à 70% à J-3, solde à J+7.</li>
              <li><span className="text-white">Approuvé</span> — jusqu'à 40% à J-14, 80% à J-3, 100% à J+7.</li>
              <li><span className="text-white">Certifié</span> — jusqu'à 60% à J-14, 90% à J-3, 100% à J+7.</li>
              <li><span className="text-white">Premium</span> — jusqu'à 80% à J-14, 95% à J-3, 100% à J+7.</li>
            </ul>
            <p>
              Les montants de chaque versement sont calculés sur la base des ventes réelles au moment
              du versement, déduction faite des tranches précédemment versées. BilletGo se réserve le droit
              de retarder ou de suspendre un versement en cas de litige, de demandes de remboursement en cours,
              ou de suspicion de fraude.
            </p>
            <p>
              En cas d'annulation d'un événement par l'organisateur après qu'une ou plusieurs tranches ont
              été versées, l'organisateur s'engage à rembourser BilletGo des sommes nécessaires à l'indemnisation
              complète des acheteurs. BilletGo se réserve le droit de poursuivre l'organisateur par toute voie
              de droit pour recouvrer les sommes dues, conformément au droit OHADA.
            </p>
          </Section>

          <Section title="8. Remboursements et transferts de billets">
            <p>
              Les acheteurs peuvent, selon les conditions définies aux CGV :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Soumettre une demande de remboursement volontaire, soumise à approbation par BilletGo.</li>
              <li>Transférer un billet à une autre personne via la fonctionnalité de transfert de la plateforme.</li>
            </ul>
            <p>
              En cas d'annulation officielle d'un événement par l'organisateur, BilletGo génère automatiquement
              les demandes de remboursement pour tous les acheteurs concernés et les notifie immédiatement.
              Le remboursement intégral du prix d'achat est garanti dans la limite des fonds retenus en séquestre.
            </p>
          </Section>

          <Section title="9. Liste d'attente">
            <p>
              Pour les événements complets (sold-out), les utilisateurs peuvent s'inscrire sur une liste d'attente
              en fournissant leur email et/ou numéro de téléphone. En cas de libération d'une place, les personnes
              inscrites sur la liste d'attente sont notifiées par ordre d'inscription (FIFO). BilletGo ne garantit
              pas l'obtention d'un billet aux inscrits sur liste d'attente.
            </p>
          </Section>

          <Section title="10. QR Codes et sécurité des billets">
            <p>
              Chaque billet généré sur BilletGo est associé à un QR Code unique, signé cryptographiquement
              par un algorithme HMAC-SHA256. Tout QR Code falsifié, dupliqué ou altéré sera détecté lors du
              scan à l'entrée et le billet correspondant sera invalide. BilletGo ne saurait être tenu responsable
              de l'accès refusé résultant d'un billet frauduleux ou partagé à des tiers.
            </p>
            <p>
              Les tokens de session (refresh tokens) sont hachés en SHA-256 en base de données — aucune donnée
              d'authentification n'est stockée en clair. La vérification des QR codes utilise une comparaison
              résistante aux attaques temporelles (timing-safe).
            </p>
          </Section>

          <Section title="11. Propriété intellectuelle">
            <p>
              L'ensemble des éléments de la plateforme BilletGo (logo, design, textes, code source, base de données)
              est la propriété exclusive de Tiamiyou Arèmou, concepteur et exploitant de BilletGo.
              Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
            </p>
          </Section>

          <Section title="12. Disponibilité du service">
            <p>
              BilletGo s'efforce d'assurer la disponibilité de la plateforme 24h/24 et 7j/7. Toutefois,
              des interruptions pour maintenance ou pour des raisons techniques peuvent survenir. BilletGo ne
              saurait être tenu responsable des conséquences d'une interruption de service.
            </p>
          </Section>

          <Section title="13. Responsabilité">
            <p>
              BilletGo agit en tant qu'intermédiaire technique et séquestre entre les acheteurs et les organisateurs.
              BilletGo ne saurait être tenu responsable du contenu des événements, des annulations décidées
              par les organisateurs, ni des problèmes survenant lors des événements eux-mêmes (incidents,
              blessures, force majeure, etc.).
            </p>
            <p>
              En cas d'annulation d'événement imputable à un organisateur, la responsabilité financière
              de BilletGo est limitée aux fonds effectivement retenus en séquestre au moment de l'annulation.
              Pour toute somme excédentaire, la responsabilité incombe exclusivement à l'organisateur.
            </p>
          </Section>

          <Section title="14. Modifications des CGU">
            <p>
              BilletGo se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
              informés de toute modification significative par notification sur la plateforme ou par email.
              La poursuite de l'utilisation de la plateforme après notification vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="15. Droit applicable et juridiction">
            <p>
              Les présentes CGU sont soumises au droit gabonais et, le cas échéant, au droit OHADA
              (Organisation pour l'Harmonisation en Afrique du Droit des Affaires). Tout litige relatif
              à leur interprétation ou exécution sera soumis aux tribunaux compétents de Libreville, Gabon.
            </p>
          </Section>

          <Section title="16. Contact">
            <p>
              Pour toute question relative aux présentes CGU :{' '}
              <a href="mailto:contact@billetgo.net" className="text-violet-neon hover:underline">contact@billetgo.net</a>
              {' '}ou par téléphone au +241 62 557 655.
            </p>
          </Section>

        </div>

        <div className="mt-8 flex gap-4 text-sm text-white/30 flex-wrap">
          <Link to="/cgv" className="hover:text-white transition-colors">CGV</Link>
          <Link to="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
        </div>
      </div>
    </div>
  );
}
