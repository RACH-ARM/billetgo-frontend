import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-bebas text-2xl tracking-wider text-violet-neon mb-3">{title}</h2>
    <div className="text-white/60 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function CGV() {
  return (
    <div className="min-h-screen bg-bg py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">Conditions Générales de Vente</h1>
        <p className="text-white/30 text-xs mb-10">Dernière mise à jour : 23 mars 2026</p>

        <div className="glass-card p-8 border border-violet-neon/20">

          <Section title="1. Objet">
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des transactions
              réalisées sur la plateforme BilletGo entre les acheteurs et les organisateurs d'événements.
              BilletGo intervient en qualité d'intermédiaire technique et de séquestre (escrow) : les fonds
              des acheteurs sont collectés et détenus par BilletGo, puis reversés progressivement aux
              organisateurs selon les conditions définies aux CGU.
            </p>
            <p>
              Toute commande passée sur BilletGo implique l'acceptation pleine et entière des présentes CGV
              ainsi que des Conditions Générales d'Utilisation (CGU).
            </p>
          </Section>

          <Section title="2. Prix et frais de service">
            <p>
              Les prix des billets sont fixés librement par les organisateurs et sont exprimés en Francs CFA
              (XAF), toutes taxes comprises (TTC).
            </p>
            <p>
              BilletGo perçoit une commission sur chaque billet vendu, incluse dans le prix affiché à
              l'acheteur (l'acheteur ne paie pas de frais supplémentaires). Pour les billets gratuits, des
              frais fixes de service de <span className="text-white font-semibold">500 FCFA</span> par billet
              peuvent s'appliquer selon décision de l'organisateur ou de l'administration BilletGo.
            </p>
            <p>
              Le montant total à régler est clairement indiqué dans le récapitulatif de commande avant toute
              confirmation. Aucun frais caché n'est ajouté après validation.
            </p>
          </Section>

          <Section title="3. Processus d'achat">
            <p>L'achat d'un ou plusieurs billets se déroule en quatre étapes successives :</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Sélection des billets et des catégories souhaitées.</li>
              <li>Récapitulatif de commande et vérification des informations acheteur.</li>
              <li>Choix de l'opérateur mobile money et saisie du numéro de paiement.</li>
              <li>Confirmation du paiement sur votre téléphone via la notification de votre opérateur.</li>
            </ol>
            <p>
              La commande est définitivement enregistrée et les billets générés uniquement après confirmation
              effective du paiement par l'opérateur mobile money. En l'absence de confirmation dans le délai
              imparti, la commande est automatiquement annulée sans frais.
            </p>
          </Section>

          <Section title="4. Moyens de paiement">
            <p>
              BilletGo accepte uniquement les paiements par mobile money via les opérateurs gabonais :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white">Airtel Money</span></li>
              <li><span className="text-white">Moov Money</span></li>
            </ul>
            <p>
              Les paiements sont traités via une passerelle sécurisée. Aucune donnée de paiement n'est
              stockée sur les serveurs BilletGo. La confirmation de paiement s'effectue directement sur
              votre téléphone via une notification de votre opérateur.
            </p>
          </Section>

          <Section title="5. Livraison des billets">
            <p>
              Dès confirmation du paiement, vos billets sont générés instantanément et accessibles dans votre
              espace « Mes Billets » sur la plateforme. Chaque billet est associé à un QR Code unique, signé
              cryptographiquement (HMAC-SHA256), permettant sa validation à l'entrée de l'événement.
            </p>
            <p>
              Vos billets peuvent être enregistrés dans votre galerie photo pour un accès hors connexion.
              La version numérique est acceptée à l'entrée — l'impression n'est pas requise.
            </p>
            <p>
              Une confirmation de commande est également envoyée par email et/ou SMS selon les coordonnées
              renseignées lors de votre inscription.
            </p>
          </Section>

          <Section title="6. Politique de remboursement">
            <p>
              En raison de la nature des billets d'événements culturels et de loisirs à date déterminée,
              <span className="text-white font-semibold"> les ventes sont en principe définitives</span>.
              Toutefois, deux mécanismes de remboursement existent :
            </p>

            <p className="text-white/80 font-medium mt-2">Remboursement volontaire (à la demande de l'acheteur)</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>L'acheteur peut soumettre une demande de remboursement depuis son espace « Mes Billets ».</li>
              <li>La demande est soumise à approbation par l'équipe BilletGo.</li>
              <li>En cas d'approbation, la commission BilletGo est retenue et seul le montant net reversé à l'organisateur est remboursé.</li>
              <li>Le remboursement est effectué via mobile money dans un délai de 7 à 14 jours ouvrables.</li>
              <li>Une demande précédemment refusée peut être soumise à nouveau.</li>
            </ul>

            <p className="text-white/80 font-medium mt-2">Remboursement en cas d'annulation officielle</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>En cas d'annulation officielle d'un événement par l'organisateur, BilletGo procède au remboursement intégral du prix d'achat à tous les acheteurs concernés.</li>
              <li>Le remboursement est garanti dans la limite des fonds retenus en séquestre par BilletGo au moment de l'annulation.</li>
              <li>Pour les montants excédant les fonds en séquestre (si des tranches avaient déjà été versées à l'organisateur), la responsabilité de l'indemnisation incombe à l'organisateur.</li>
              <li>Les notifications d'annulation et de remboursement sont envoyées automatiquement par email, SMS et notification in-app.</li>
            </ul>
          </Section>

          <Section title="7. Transfert de billets">
            <p>
              BilletGo permet à l'acheteur de transférer un billet à une autre personne via la fonctionnalité
              de transfert disponible dans l'espace « Mes Billets ». Le transfert invalide l'ancien QR Code et
              génère un nouveau QR Code au nom du destinataire.
            </p>
            <p>
              Toute revente de billets à un prix supérieur au prix d'achat (scalping) est formellement interdite
              et peut entraîner l'annulation du billet sans remboursement, conformément aux CGU.
            </p>
          </Section>

          <Section title="8. Liste d'attente">
            <p>
              Lorsqu'un événement est complet (sold-out), les utilisateurs peuvent s'inscrire sur une liste
              d'attente en fournissant leur email et/ou numéro de téléphone. En cas de libération d'une place
              (remboursement ou transfert annulé), les inscrits sont notifiés par ordre d'inscription (FIFO).
              BilletGo ne garantit pas l'obtention d'un billet aux personnes inscrites sur liste d'attente.
            </p>
          </Section>

          <Section title="9. Responsabilité de l'organisateur">
            <p>
              L'organisateur est seul responsable du contenu, de l'organisation, du déroulement et du respect
              de la réglementation applicable à son événement (autorisations administratives, sécurité, etc.).
              BilletGo ne saurait être tenu responsable de l'annulation, du report, de la modification ou de la
              mauvaise exécution d'un événement par un organisateur.
            </p>
            <p>
              En cas d'annulation après qu'une ou plusieurs tranches de versement ont été libérées à
              l'organisateur, celui-ci s'engage à rembourser à BilletGo les sommes nécessaires à
              l'indemnisation intégrale des acheteurs, conformément au droit OHADA et aux engagements
              contractuels signés lors de son inscription.
            </p>
          </Section>

          <Section title="10. Droit de rétractation">
            <p>
              Conformément aux usages applicables aux services d'accès à des événements culturels et de loisirs
              dont la date est déterminée, <span className="text-white font-semibold">le droit de rétractation
              ne s'applique pas</span> aux achats effectués sur BilletGo. L'acheteur est invité à vérifier
              soigneusement les informations de l'événement avant de confirmer sa commande.
            </p>
          </Section>

          <Section title="11. Droit applicable et juridiction">
            <p>
              Les présentes CGV sont soumises au droit gabonais et, le cas échéant, au droit OHADA.
              Tout litige relatif à leur interprétation ou exécution sera soumis aux tribunaux compétents
              de Libreville, Gabon.
            </p>
          </Section>

          <Section title="12. Contact et réclamations">
            <p>
              Pour toute réclamation relative à un achat :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
              {' '}ou par téléphone au +241 62 557 655.
            </p>
            <p>Nos équipes vous répondent du lundi au samedi de 08h00 à 20h00 (heure de Libreville).</p>
          </Section>

        </div>

        <div className="mt-8 flex gap-4 text-sm text-white/30 flex-wrap">
          <Link to="/cgu" className="hover:text-white transition-colors">CGU</Link>
          <Link to="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
          <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
        </div>
      </div>
    </div>
  );
}
