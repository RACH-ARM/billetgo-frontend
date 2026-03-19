import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="font-bebas text-2xl tracking-wider text-violet-neon mb-3">{title}</h2>
    <div className="text-white/60 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

export default function CGU() {
  return (
    <div className="min-h-screen bg-bg py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <h1 className="font-bebas text-5xl tracking-wider text-gradient mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-white/30 text-xs mb-10">Dernière mise à jour : 14 mars 2026</p>

        <div className="glass-card p-8 border border-violet-neon/20">

          <Section title="1. Présentation de la plateforme">
            <p>
              BilletGo est une plateforme de billetterie événementielle en ligne conçue et exploitée par
              {' '}<span className="text-white">Tiamiyou Arèmou</span>,
              basée à Libreville, Gabon. Elle permet aux utilisateurs d'acheter des billets pour des événements
              organisés au Gabon, aux organisateurs de créer et gérer leurs événements, et aux scanners de valider
              les billets à l'entrée.
            </p>
            <p>
              L'accès à la plateforme est disponible à l'adresse billetgo.ga et via l'application mobile.
            </p>
          </Section>

          <Section title="2. Acceptation des CGU">
            <p>
              L'utilisation de BilletGo implique l'acceptation pleine et entière des présentes Conditions Générales
              d'Utilisation. Toute personne qui ne les accepte pas doit s'abstenir d'utiliser la plateforme.
            </p>
            <p>
              En cochant la case prévue à cet effet lors de l'inscription, l'utilisateur reconnaît avoir lu,
              compris et accepté les présentes CGU.
            </p>
          </Section>

          <Section title="3. Inscription et comptes utilisateurs">
            <p>
              L'inscription est ouverte à toute personne physique âgée de 18 ans ou plus. L'utilisateur s'engage à
              fournir des informations exactes, complètes et à jour lors de la création de son compte.
            </p>
            <p>
              Quatre types de comptes existent sur la plateforme :
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><span className="text-white">Acheteur (BUYER)</span> — peut acheter des billets et accéder à ses commandes.</li>
              <li><span className="text-white">Organisateur (ORGANIZER)</span> — peut créer des événements après validation par l'équipe BilletGo.</li>
              <li><span className="text-white">Scanner</span> — peut valider les billets à l'entrée des événements auxquels il est assigné.</li>
              <li><span className="text-white">Administrateur (ADMIN)</span> — gère la plateforme (usage interne uniquement).</li>
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
              <li>Toute tentative de falsification ou de duplication des QR codes.</li>
              <li>Le contournement des mécanismes de sécurité de la plateforme.</li>
              <li>L'utilisation automatisée (bots, scripts) sans autorisation écrite préalable.</li>
              <li>La diffusion de contenus illicites, diffamatoires ou portant atteinte aux droits des tiers.</li>
            </ul>
          </Section>

          <Section title="5. Propriété intellectuelle">
            <p>
              L'ensemble des éléments de la plateforme BilletGo (logo, design, textes, code source, base de données)
              est la propriété exclusive de Tiamiyou Arèmou, concepteur et exploitant de BilletGo.
              Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
            </p>
          </Section>

          <Section title="6. Disponibilité du service">
            <p>
              BilletGo s'efforce d'assurer la disponibilité de la plateforme 24h/24 et 7j/7. Toutefois,
              des interruptions pour maintenance ou pour des raisons techniques peuvent survenir. BilletGo ne
              saurait être tenu responsable des conséquences d'une interruption de service.
            </p>
          </Section>

          <Section title="7. Responsabilité">
            <p>
              BilletGo agit en tant qu'intermédiaire technique entre les acheteurs et les organisateurs.
              BilletGo ne saurait être tenu responsable du contenu des événements, des annulations décidées
              par les organisateurs, ni des problèmes survenant lors des événements eux-mêmes.
            </p>
            <p>
              La responsabilité de BilletGo est limitée au montant des frais de service perçus sur la commande concernée.
            </p>
          </Section>

          <Section title="8. Modifications des CGU">
            <p>
              BilletGo se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
              informés de toute modification significative. La poursuite de l'utilisation de la plateforme après
              notification vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section title="9. Droit applicable">
            <p>
              Les présentes CGU sont soumises au droit gabonais. Tout litige relatif à leur interprétation ou
              exécution sera soumis aux tribunaux compétents de Libreville, Gabon.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Pour toute question relative aux présentes CGU :{' '}
              <a href="mailto:contact@billetgo.ga" className="text-violet-neon hover:underline">contact@billetgo.ga</a>
              {' '}ou par WhatsApp au{' '}
              <a href="https://wa.me/24162557655" className="text-violet-neon hover:underline">+241 62 557 655</a>.
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
