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
        <p className="text-white/30 text-xs mb-10">Dernière mise à jour : 14 mars 2026</p>

        <div className="glass-card p-8 border border-violet-neon/20">

          <Section title="1. Objet">
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent toutes les transactions effectuées
              sur la plateforme BilletGo entre les acheteurs et les organisateurs d'événements, BilletGo
              agissant en qualité d'intermédiaire technique.
            </p>
          </Section>

          <Section title="2. Prix et frais de service">
            <p>
              Les prix des billets sont fixés par les organisateurs et sont affichés en Francs CFA (XAF).
              Ils sont indiqués toutes taxes comprises (TTC).
            </p>
            <p>
              BilletGo perçoit une commission de <span className="text-white font-semibold">10 %</span> du
              montant de chaque billet vendu, incluse dans le prix affiché. Pour les événements gratuits,
              des frais fixes de service de <span className="text-white font-semibold">500 FCFA</span> par
              billet peuvent s'appliquer.
            </p>
            <p>
              Le prix total à payer est clairement affiché avant toute confirmation d'achat. Aucun frais
              supplémentaire n'est ajouté après validation de la commande.
            </p>
          </Section>

          <Section title="3. Processus d'achat">
            <p>L'achat d'un billet se déroule en trois étapes sur la plateforme :</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Sélection des billets et récapitulatif de la commande.</li>
              <li>Vérification des informations acheteur.</li>
              <li>Paiement via mobile money (Airtel Money ou Moov Money).</li>
            </ol>
            <p>
              La commande est définitivement enregistrée et les billets générés uniquement après confirmation
              du paiement par l'opérateur mobile money.
            </p>
          </Section>

          <Section title="4. Moyens de paiement">
            <p>
              BilletGo accepte uniquement les paiements par mobile money gabonais :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-rose-neon">Airtel Money</span></li>
              <li><span className="text-cyan-neon">Moov Money</span></li>
            </ul>
            <p>
              Les paiements sont traités via la passerelle sécurisée PVit. Aucune donnée bancaire n'est
              stockée sur les serveurs BilletGo. La confirmation de paiement s'effectue directement sur
              votre téléphone via une notification push de votre opérateur.
            </p>
          </Section>

          <Section title="5. Livraison des billets">
            <p>
              Dès confirmation du paiement, vos billets sont générés immédiatement et accessibles dans
              votre espace « Mes Billets » sur la plateforme. Chaque billet est accompagné d'un QR Code
              unique et sécurisé.
            </p>
            <p>
              Les billets peuvent être enregistrés dans la galerie de votre téléphone pour un accès
              hors connexion. Il n'est pas nécessaire d'imprimer le billet — la version numérique est
              acceptée à l'entrée de tous les événements BilletGo.
            </p>
          </Section>

          <Section title="6. Politique d'annulation et de remboursement">
            <p>
              En raison de la nature des billets de spectacles et d'événements, <span className="text-white font-semibold">
              les ventes sont définitives</span>. Aucun remboursement ni échange n'est accordé sauf dans
              les cas suivants :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Annulation officielle de l'événement par l'organisateur.</li>
              <li>Report de l'événement à une date que l'acheteur ne peut honorer (sur demande motivée).</li>
              <li>Erreur technique imputable à BilletGo ayant empêché l'accès à l'événement.</li>
            </ul>
            <p>
              En cas d'annulation d'un événement, les remboursements sont effectués via le même moyen
              de paiement utilisé lors de l'achat, dans un délai de 7 à 14 jours ouvrables.
            </p>
          </Section>

          <Section title="7. Responsabilité de l'organisateur">
            <p>
              L'organisateur est seul responsable du contenu, de l'organisation et du déroulement de son
              événement. BilletGo ne saurait être tenu responsable de l'annulation, du report, de la
              modification ou de la mauvaise exécution d'un événement.
            </p>
            <p>
              En cas de litige avec un organisateur, l'acheteur peut contacter le support BilletGo qui
              agira en tant que médiateur dans la limite de ses possibilités.
            </p>
          </Section>

          <Section title="8. Transfert et revente de billets">
            <p>
              Les billets achetés sur BilletGo sont nominatifs. Toute revente à un prix supérieur au
              prix d'achat (scalping) est formellement interdite et peut entraîner l'annulation du
              billet sans remboursement.
            </p>
          </Section>

          <Section title="9. Droit de rétractation">
            <p>
              Conformément aux usages applicables aux billets d'événements culturels et de loisirs dont
              la date est déterminée, <span className="text-white font-semibold">le droit de rétractation
              ne s'applique pas</span> aux achats effectués sur BilletGo.
            </p>
          </Section>

          <Section title="10. Contact et réclamations">
            <p>
              Pour toute réclamation relative à un achat :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
              {' '}ou par WhatsApp au{' '}
              <a href="https://wa.me/24162557655" className="text-violet-neon hover:underline">+241 62 557 655</a>.
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
