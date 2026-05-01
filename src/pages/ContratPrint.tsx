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
          Conditions Générales Organisateur — BilletGab
        </h1>
        <p style={{ margin: '6px 0 0', color: '#555', fontSize: 12 }}>
          Version {CONTRACT_VERSION} — En vigueur depuis le {CONTRACT_DATE} — Imprimé le {now}
        </p>
      </div>

      {/* Préambule */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={h2Style}>Préambule</h2>
        <p>Le présent contrat est conclu entre <strong>BilletGab</strong>, plateforme de billetterie événementielle opérant au Gabon (ci-après « BilletGab »), et toute personne physique ou morale souhaitant utiliser la plateforme en qualité d'organisateur d'événements (ci-après « l'Organisateur »).</p>
        <p>L'acceptation des présentes conditions est obligatoire pour accéder aux fonctionnalités organisateur de BilletGab. Elle constitue une signature électronique au sens de la réglementation gabonaise en vigueur et vaut engagement contractuel pleinement opposable devant les juridictions compétentes de Libreville, Gabon.</p>
      </section>

      {/* Art. 1 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 1 — Objet du contrat</h2>
        <p>Le présent contrat a pour objet de définir les droits et obligations réciproques de BilletGab et de l'Organisateur dans le cadre de l'utilisation de la plateforme BilletGab pour la création, la promotion et la gestion d'événements payants ou gratuits, ainsi que la collecte et le reversement des fonds issus de la vente de billets.</p>
        <p>BilletGab agit exclusivement en qualité de <strong>prestataire technique et financier intermédiaire</strong>. L'Organisateur demeure seul responsable de l'organisation, du déroulement et de la légalité de ses événements.</p>
      </section>

      {/* Art. 2 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 2 — Inscription et accès à la plateforme</h2>
        <p>L'accès aux fonctionnalités organisateur est conditionné à :</p>
        <ul style={ulStyle}>
          <li>La création d'un compte BilletGab avec des informations exactes et à jour ;</li>
          <li>L'acceptation des présentes Conditions Générales Organisateur (CGO) ;</li>
          <li>La fourniture d'un nom de structure ou d'entreprise valide ;</li>
          <li>La vérification de l'identité par soumission de documents KYC à la demande de BilletGab.</li>
        </ul>
        <p>L'Organisateur garantit l'exactitude des informations fournies et s'engage à les maintenir à jour. Toute fausse déclaration peut entraîner la suspension immédiate du compte sans indemnité.</p>
        <p>L'horodatage et la version du présent contrat acceptés sont enregistrés de façon immuable sur les serveurs de BilletGab et constituent preuve de signature électronique.</p>
      </section>

      {/* Art. 3 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 3 — Publication d'événements</h2>
        <p>L'Organisateur peut créer et publier des événements sur la plateforme BilletGab. Il est seul responsable de :</p>
        <ul style={ulStyle}>
          <li>L'exactitude des informations publiées (date, lieu, programme, prix) ;</li>
          <li>La détention des autorisations administratives nécessaires à l'organisation de l'événement ;</li>
          <li>La conformité de l'événement avec la législation gabonaise ;</li>
          <li>La sécurité et le bon déroulement de l'événement ;</li>
          <li>L'information des acheteurs en cas de modification ou d'annulation.</li>
        </ul>
        <p>BilletGab se réserve le droit de refuser ou de dépublier tout événement qui contreviendrait à ses politiques internes, à la loi gabonaise ou aux bonnes mœurs, sans obligation de justification ni indemnité.</p>
      </section>

      {/* Art. 4 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 4 — Commission et frais de service</h2>
        <p>En contrepartie des services rendus, BilletGab prélève :</p>
        <ul style={ulStyle}>
          <li><strong>10 % du prix HT</strong> sur chaque billet payant vendu ;</li>
          <li><strong>500 FCFA de frais fixes</strong> par billet gratuit émis ;</li>
          <li>Les <strong>frais de traitement Mobile Money (PVit)</strong> appliqués lors des reversements, à la charge exclusive de l'Organisateur.</li>
        </ul>
        <p>Ces frais sont prélevés directement sur les montants reversés. BilletGab se réserve le droit de modifier ses taux avec un préavis de 30 jours.</p>
      </section>

      {/* Art. 5 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 5 — Versements et gestion des fonds</h2>
        <p>Les fonds collectés lors de la vente de billets sont crédités en temps réel sur la balance de l'Organisateur, au fur et à mesure de chaque achat. L'Organisateur peut initier un reversement à tout moment depuis son tableau de bord.</p>
        <p>Les versements sont effectués par Mobile Money (Airtel Money ou Moov Money) via PVit, dans la limite de 500 000 FCFA par opération et des plafonds journaliers opérateurs (Airtel : 1 500 000 FCFA/jour ; Moov : 3 000 000 FCFA/jour — comptes non vérifiés). La commission BilletGab et les frais de traitement Mobile Money sont déduits avant chaque reversement.</p>
        <p>BilletGab se réserve le droit de suspendre tout versement en cas d'activité frauduleuse suspectée, de litige ou plainte en cours, de procédure judiciaire ou de non-conformité aux exigences KYC. En cas de litige avéré, les fonds concernés peuvent être retenus jusqu'à 90 jours calendaires.</p>
      </section>

      {/* Art. 6 */}
      <section style={{ marginBottom: 20, pageBreakBefore: 'always' }}>
        <h2 style={h2Style}>Article 6 — Annulation d'événement — Responsabilité financière de l'Organisateur</h2>
        <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
          <strong>Clause essentielle.</strong> Le non-respect de cet article engage la responsabilité civile et pénale de l'Organisateur.
        </div>

        <p>Les fonds issus de la vente de billets étant reversés à l'Organisateur au fur et à mesure des achats, l'Organisateur est <strong>seul responsable du remboursement des acheteurs</strong> en cas d'annulation de l'événement. BilletGab agit exclusivement en qualité d'intermédiaire technique et n'est pas responsable de la relation financière entre l'Organisateur et les acheteurs.</p>

        <p><strong>6.1 Obligation de remboursement</strong><br />
        En cas d'annulation, l'Organisateur s'engage à rembourser intégralement chaque acheteur dans un délai de <strong>7 jours calendaires</strong> suivant la date d'annulation, à contacter directement les acheteurs, et à fournir à BilletGab, sur demande, la preuve des remboursements effectués.</p>

        <p><strong>6.2 Caractère de l'obligation</strong><br />
        L'obligation de remboursement de l'Organisateur envers les acheteurs est une <strong>obligation personnelle, directe et de résultat</strong>, indépendante du rôle de BilletGab. BilletGab ne peut être tenu solidairement responsable des remboursements dus par l'Organisateur.</p>

        <p><strong>6.3 Mesures conservatoires en cas de défaillance</strong><br />
        Si l'Organisateur ne procède pas aux remboursements dans les délais, BilletGab peut : suspendre le compte, retenir les fonds d'autres événements en compensation, signaler l'Organisateur aux opérateurs Mobile Money, facturer des pénalités de 1,5 % par semaine sur les montants dus, engager une procédure devant le Tribunal de Commerce de Libreville.</p>

        <p><strong>6.4 Force majeure</strong><br />
        En cas de catastrophe naturelle officielle, décision gouvernementale ou pandémie déclarée, les parties conviennent d'un plan de remboursement amiable. La force majeure aménage les délais mais ne dispense pas l'Organisateur de son obligation de remboursement.</p>
      </section>

      {/* Art. 7 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 7 — Annulation d'événement — Procédure obligatoire</h2>
        <p>En cas d'annulation ou de report, l'Organisateur doit notifier BilletGab par email à <strong>support@billetgab.com</strong> dans les <strong>24 heures</strong> suivant la décision, et utiliser la fonctionnalité « Annuler l'événement » depuis son tableau de bord.</p>
        <p>Les remboursements des acheteurs sont de la <strong>seule responsabilité de l'Organisateur</strong> (article 6). BilletGab n'intervient pas dans les remboursements financiers entre l'Organisateur et ses acheteurs. Toute annulation non signalée ou tentative de détournement sera poursuivie pénalement sur le fondement de l'abus de confiance (article 247 du Code pénal gabonais).</p>
      </section>

      {/* Art. 8 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 8 — Obligations de l'Organisateur</h2>
        <p>L'Organisateur s'engage notamment à fournir des informations exactes, détenir toutes les autorisations légales, respecter la capacité d'accueil et les normes de sécurité, honorer ses engagements envers les acheteurs, utiliser les fonds versés exclusivement pour financer l'événement concerné, et ne pas utiliser la plateforme à des fins frauduleuses ou illicites.</p>
      </section>

      {/* Art. 9 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 9 — Obligations de BilletGab</h2>
        <p>BilletGab s'engage à mettre à disposition une plateforme sécurisée, traiter les paiements via PVit, mettre à disposition les fonds collectés pour reversement selon les modalités définies à l'article 5, fournir un système de scan QR, assurer la confidentialité des données, informer l'Organisateur de toute modification tarifaire avec un préavis de 30 jours, et mettre à disposition les informations nécessaires à la gestion des remboursements. BilletGab n'est pas responsable des remboursements dus par l'Organisateur aux acheteurs. La responsabilité de BilletGab est limitée au montant des commissions perçues sur l'événement concerné.</p>
      </section>

      {/* Art. 10 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 10 — Données personnelles et confidentialité</h2>
        <p>BilletGab traite les données personnelles conformément à la loi n° 001/2011 du 25 septembre 2011 relative à la protection des données à caractère personnel au Gabon. L'Organisateur s'interdit toute utilisation commerciale ou revente des données personnelles des acheteurs.</p>
      </section>

      {/* Art. 11 */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={h2Style}>Article 11 — Résiliation</h2>
        <p>Le contrat peut être résilié par l'Organisateur à tout moment sous réserve d'absence de dette et d'événement actif, ou par BilletGab en cas de violation des CGO (effet immédiat) ou par convenance avec préavis de 30 jours. En cas de résiliation, les fonds retenus sont reversés déduction faite des commissions dues et créances de BilletGab.</p>
      </section>

      {/* Art. 12 */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={h2Style}>Article 12 — Droit applicable et juridiction compétente</h2>
        <p>Le présent contrat est régi par le <strong>droit gabonais</strong> et les textes OHADA applicables au Gabon. En cas de litige non résolu amiablement dans un délai de 30 jours, le litige sera soumis à la compétence exclusive du <strong>Tribunal de Commerce de Libreville</strong>.</p>
      </section>

      {/* Bloc signature */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '16px 20px', marginTop: 32 }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Signature électronique de l'Organisateur</p>
        <p style={{ color: '#444', marginBottom: 12 }}>Par l'acceptation des présentes lors de l'inscription sur BilletGab, l'Organisateur déclare avoir lu, compris et accepté l'intégralité des présentes Conditions Générales Organisateur — Version {CONTRACT_VERSION} du {CONTRACT_DATE}.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
          <div style={{ borderTop: '1px solid #999', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#555' }}>Pour BilletGab</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>BilletGab — billetgab.com</p>
          </div>
          <div style={{ borderTop: '1px solid #999', paddingTop: 8 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#555' }}>L'Organisateur (signature électronique)</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Date et heure d'acceptation : enregistrées sur les serveurs BilletGab</p>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: '#888', textAlign: 'center' }}>
        BilletGab — support@billetgab.com — billetgab.com — Document généré le {now}
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

