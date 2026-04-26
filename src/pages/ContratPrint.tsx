import { useEffect } from 'react';
import { CONTRACT_VERSION, CONTRACT_DATE } from './ContratOrganisateur';

// ─── Page d'impression épurée — pas de Navbar / Footer ───────────────────────
// Ouverte dans un nouvel onglet via le bouton "Télécharger PDF" du contrat.
// L'impression est déclenchée automatiquement à l'ouverture.

export default function ContratPrint() {
  useEffect(() => {
    // Petit délai pour que le DOM soit rendu avant d'ouvrir la boîte d'impression
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#111', background: '#fff', maxWidth: 800, margin: '0 auto', padding: '40px 48px', fontSize: 13, lineHeight: 1.7 }}>

      {/* En-tête */}
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
          Conditions Générales Organisateur — BilletGo
        </h1>
        <p style={{ margin: '6px 0 0', color: '#555', fontSize: 12 }}>
          Version {CONTRACT_VERSION} — En vigueur depuis le {CONTRACT_DATE} — Imprimé le {now}
        </p>
      </div>

      {/* Préambule */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={h2Style}>Préambule</h2>
        <p>Le présent contrat est conclu entre <strong>BilletGo</strong>, plateforme de billetterie événementielle opérant au Gabon (ci-après « BilletGo »), et toute personne physique ou morale souhaitant utiliser la plateforme en qualité d'organisateur d'événements (ci-après « l'Organisateur »).</p>
        <p>L'acceptation des présentes conditions est obligatoire pour accéder aux fonctionnalités organisateur de BilletGo. Elle constitue une signature électronique au sens de la réglementation gabonaise en vigueur et vaut engagement contractuel pleinement opposable devant les juridictions compétentes de Libreville, Gabon.</p>
      </section>

      {/* Art. 1 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 1 — Objet du contrat</h2>
        <p>Le présent contrat a pour objet de définir les droits et obligations réciproques de BilletGo et de l'Organisateur dans le cadre de l'utilisation de la plateforme BilletGo pour la création, la promotion et la gestion d'événements payants ou gratuits, ainsi que la collecte et le reversement des fonds issus de la vente de billets.</p>
        <p>BilletGo agit exclusivement en qualité de <strong>prestataire technique et financier intermédiaire</strong>. L'Organisateur demeure seul responsable de l'organisation, du déroulement et de la légalité de ses événements.</p>
      </section>

      {/* Art. 2 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 2 — Inscription et accès à la plateforme</h2>
        <p>L'accès aux fonctionnalités organisateur est conditionné à :</p>
        <ul style={ulStyle}>
          <li>La création d'un compte BilletGo avec des informations exactes et à jour ;</li>
          <li>L'acceptation des présentes Conditions Générales Organisateur (CGO) ;</li>
          <li>La fourniture d'un nom de structure ou d'entreprise valide ;</li>
          <li>La vérification de l'identité par soumission de documents KYC à la demande de BilletGo.</li>
        </ul>
        <p>L'Organisateur garantit l'exactitude des informations fournies et s'engage à les maintenir à jour. Toute fausse déclaration peut entraîner la suspension immédiate du compte sans indemnité.</p>
        <p>L'horodatage et la version du présent contrat acceptés sont enregistrés de façon immuable sur les serveurs de BilletGo et constituent preuve de signature électronique.</p>
      </section>

      {/* Art. 3 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 3 — Publication d'événements</h2>
        <p>L'Organisateur peut créer et publier des événements sur la plateforme BilletGo. Il est seul responsable de :</p>
        <ul style={ulStyle}>
          <li>L'exactitude des informations publiées (date, lieu, programme, prix) ;</li>
          <li>La détention des autorisations administratives nécessaires à l'organisation de l'événement ;</li>
          <li>La conformité de l'événement avec la législation gabonaise ;</li>
          <li>La sécurité et le bon déroulement de l'événement ;</li>
          <li>L'information des acheteurs en cas de modification ou d'annulation.</li>
        </ul>
        <p>BilletGo se réserve le droit de refuser ou de dépublier tout événement qui contreviendrait à ses politiques internes, à la loi gabonaise ou aux bonnes mœurs, sans obligation de justification ni indemnité.</p>
      </section>

      {/* Art. 4 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 4 — Commission et frais de service</h2>
        <p>En contrepartie des services rendus, BilletGo prélève :</p>
        <ul style={ulStyle}>
          <li><strong>10 % du prix HT</strong> sur chaque billet payant vendu ;</li>
          <li><strong>500 FCFA de frais fixes</strong> par billet gratuit émis ;</li>
          <li>Les <strong>frais de traitement Mobile Money (PVit)</strong> appliqués lors des reversements, à la charge exclusive de l'Organisateur.</li>
        </ul>
        <p>Ces frais sont prélevés directement sur les montants reversés. BilletGo se réserve le droit de modifier ses taux avec un préavis de 30 jours.</p>
      </section>

      {/* Art. 5 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 5 — Système de versements par tranches</h2>
        <p>BilletGo applique un système de versements progressifs. Les pourcentages selon le niveau de l'Organisateur sont :</p>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={thStyle}>Niveau</th>
              <th style={thStyle}>T1 — J−14</th>
              <th style={thStyle}>T2 — J−3</th>
              <th style={thStyle}>T3 — J+7</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={tdStyle}>Nouveau</td><td style={tdStyle}>—</td><td style={tdStyle}>70 %</td><td style={tdStyle}>100 %</td></tr>
            <tr style={{ background: '#fafafa' }}><td style={tdStyle}>Approuvé</td><td style={tdStyle}>40 %</td><td style={tdStyle}>80 %</td><td style={tdStyle}>100 %</td></tr>
            <tr><td style={tdStyle}>Certifié</td><td style={tdStyle}>60 %</td><td style={tdStyle}>90 %</td><td style={tdStyle}>100 %</td></tr>
            <tr style={{ background: '#fafafa' }}><td style={tdStyle}>Premium</td><td style={tdStyle}>80 %</td><td style={tdStyle}>95 %</td><td style={tdStyle}>100 %</td></tr>
          </tbody>
        </table>
        <p>Chaque tranche donne accès aux fonds collectés depuis le début des ventes jusqu'à la date de la tranche. Les ventes postérieures à la date J−14 appartiennent à la tranche T2. Les versements sont effectués par Mobile Money (Airtel Money ou Moov Money) via PVit, dans la limite de 500 000 FCFA par opération et des plafonds journaliers opérateurs (Airtel : 1 500 000 FCFA/jour ; Moov : 3 000 000 FCFA/jour — comptes non vérifiés).</p>
      </section>

      {/* Art. 6 */}
      <section style={{ marginBottom: 20, pageBreakBefore: 'always' }}>
        <h2 style={h2Style}>Article 6 — Protection anti-annulation — Obligations de remboursement</h2>
        <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
          <strong>Clause essentielle.</strong> Le non-respect de cet article engage la responsabilité civile et pénale de l'Organisateur.
        </div>

        <p><strong>6.1 Annulation avant tout versement</strong><br />
        Si l'événement est annulé avant tout versement, BilletGo procède au remboursement intégral des acheteurs. L'Organisateur ne doit aucun montant à BilletGo sauf les frais de traitement déjà engagés.</p>

        <p><strong>6.2 Annulation après versement partiel ou total</strong><br />
        Si l'événement est annulé après qu'une ou plusieurs tranches ont été versées, l'Organisateur s'engage à :</p>
        <ul style={ulStyle}>
          <li>Rembourser à BilletGo l'intégralité des fonds reçus dans un délai de <strong>7 jours calendaires</strong> ;</li>
          <li>Verser ces fonds sur le compte Mobile Money BilletGo indiqué par notification ;</li>
          <li>Couvrir les frais de remboursement des acheteurs pris en charge par BilletGo.</li>
        </ul>

        <p><strong>6.3 Caractère de la créance</strong><br />
        L'Organisateur reconnaît que sa dette envers BilletGo en cas d'annulation post-versement est une <strong>créance certaine, liquide et exigible</strong> au sens de l'article 30 de l'Acte Uniforme OHADA portant organisation des procédures simplifiées de recouvrement (AUPSRVE). Cette qualification permet à BilletGo d'engager une procédure d'injonction de payer sans assignation au fond préalable.</p>

        <p><strong>6.4 Mesures conservatoires</strong><br />
        En cas de non-remboursement dans les délais, BilletGo peut : suspendre le compte, retenir les fonds d'autres événements en compensation, signaler l'Organisateur aux opérateurs Mobile Money, facturer des pénalités de 1,5 % par semaine, engager une procédure devant le Tribunal de Commerce de Libreville.</p>

        <p><strong>6.5 Force majeure</strong><br />
        En cas de catastrophe naturelle officielle, décision gouvernementale ou pandémie déclarée, les parties conviennent d'un plan de remboursement amiable. La force majeure aménage les délais mais ne dispense pas l'Organisateur de son obligation de remboursement.</p>
      </section>

      {/* Art. 7 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 7 — Annulation d'événement — Procédure obligatoire</h2>
        <p>En cas d'annulation ou de report, l'Organisateur doit notifier BilletGo par email à <strong>support@billetgab.com</strong> dans les <strong>24 heures</strong> suivant la décision, et utiliser la fonctionnalité « Annuler l'événement » depuis son tableau de bord.</p>
        <p>BilletGo procède au remboursement des acheteurs dans un délai de 5 à 10 jours ouvrables. Toute annulation non signalée ou tentative de détournement sera poursuivie pénalement sur le fondement de l'abus de confiance (article 247 du Code pénal gabonais).</p>
      </section>

      {/* Art. 8 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 8 — Obligations de l'Organisateur</h2>
        <p>L'Organisateur s'engage notamment à fournir des informations exactes, détenir toutes les autorisations légales, respecter la capacité d'accueil et les normes de sécurité, honorer ses engagements envers les acheteurs, utiliser les fonds versés exclusivement pour financer l'événement concerné, et ne pas utiliser la plateforme à des fins frauduleuses ou illicites.</p>
      </section>

      {/* Art. 9 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 9 — Obligations de BilletGo</h2>
        <p>BilletGo s'engage à mettre à disposition une plateforme sécurisée, traiter les paiements via PVit, reverser les fonds selon le calendrier défini, fournir un système de scan QR, assurer la confidentialité des données, et informer l'Organisateur de toute modification tarifaire avec un préavis de 30 jours. La responsabilité de BilletGo est limitée au montant des commissions perçues sur l'événement concerné.</p>
      </section>

      {/* Art. 10 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 10 — Données personnelles et confidentialité</h2>
        <p>BilletGo traite les données personnelles conformément à la loi n° 001/2011 du 25 septembre 2011 relative à la protection des données à caractère personnel au Gabon. L'Organisateur s'interdit toute utilisation commerciale ou revente des données personnelles des acheteurs.</p>
      </section>

      {/* Art. 11 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 11 — Résiliation</h2>
        <p>Le contrat peut être résilié par l'Organisateur à tout moment sous réserve d'absence de dette et d'événement actif, ou par BilletGo en cas de violation des CGO (effet immédiat) ou par convenance avec préavis de 30 jours. En cas de résiliation, les fonds retenus sont reversés déduction faite des commissions dues et créances de BilletGo.</p>
      </section>

      {/* Art. 12 */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={h2Style}>Article 12 — Droit applicable et juridiction compétente</h2>
        <p>Le présent contrat est régi par le <strong>droit gabonais</strong> et les textes OHADA applicables au Gabon. En cas de litige non résolu amiablement dans un délai de 30 jours, le litige sera soumis à la compétence exclusive du <strong>Tribunal de Commerce de Libreville</strong>.</p>
      </section>

      {/* Bloc signature */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '16px 20px', marginTop: 32 }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Signature électronique de l'Organisateur</p>
        <p style={{ color: '#444', marginBottom: 12 }}>Par l'acceptation des présentes lors de l'inscription sur BilletGo, l'Organisateur déclare avoir lu, compris et accepté l'intégralité des présentes Conditions Générales Organisateur — Version {CONTRACT_VERSION} du {CONTRACT_DATE}.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <div style={{ borderTop: '1px solid #999', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#555' }}>Pour BilletGo</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>BilletGo — billetgab.com</p>
          </div>
          <div style={{ borderTop: '1px solid #999', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#555' }}>L'Organisateur (signature électronique)</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Date et heure d'acceptation : enregistrées sur les serveurs BilletGo</p>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: '#888', textAlign: 'center' }}>
        BilletGo — support@billetgab.com — billetgab.com — Document généré le {now}
      </p>
    </div>
  );
}

// ─── Styles inline (pas de Tailwind sur cette page) ───────────────────────────

const h2Style: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '1px solid #ddd',
  paddingBottom: 4,
  marginBottom: 10,
  marginTop: 0,
};

const ulStyle: React.CSSProperties = {
  paddingLeft: 20,
  margin: '8px 0',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '10px 0',
  fontSize: 12,
};

const thStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '6px 10px',
  textAlign: 'left',
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '5px 10px',
};
