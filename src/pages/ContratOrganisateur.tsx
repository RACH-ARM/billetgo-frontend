import { motion } from 'framer-motion';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, Download, AlertTriangle, ShieldCheck, Banknote, Calendar, RefreshCw, Scale, Lock, Loader2 } from 'lucide-react';
import api from '../services/api';

export const CONTRACT_VERSION = '2.0';
export const CONTRACT_DATE    = '18 avril 2026';

// ─── Section helper ───────────────────────────────────────────────────────────

function Section({ num, title, icon: Icon, children }: {
  num: string; title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-2 border-b border-white/[0.07]">
        <div className="w-8 h-8 rounded-xl bg-violet-neon/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-violet-neon" />
        </div>
        <h2 className="font-bebas text-xl tracking-wider text-white leading-none">
          Article {num} — {title}
        </h2>
      </div>
      <div className="space-y-2 text-sm text-white/60 leading-relaxed pl-11">
        {children}
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="ml-4 list-disc">{children}</li>;
}

function Important({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/80 text-xs leading-relaxed">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContratOrganisateur() {

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/utils/contrat-organisateur.pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contrat-organisateur-billetgab.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux — l'erreur est peu probable et ne nécessite pas de feedback bloquant
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Helmet>
        <title>Contrat Organisateur (CGO) | BilletGab</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* En-tête */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-bebas text-4xl tracking-wider text-gradient leading-none">
              CONDITIONS GÉNÉRALES ORGANISATEUR
            </h1>
            <p className="text-white/40 text-sm mt-1">BilletGab — Version {CONTRACT_VERSION} — En vigueur depuis le {CONTRACT_DATE}</p>
          </div>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {downloading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />
            }
            {downloading ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>

        <div className="glass-card p-5 border border-violet-neon/20 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-neon" />
            <p className="text-xs font-semibold text-violet-neon uppercase tracking-widest">Préambule</p>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            Le présent contrat est conclu entre <span className="text-white font-semibold">BilletGab</span>, plateforme de billetterie
            événementielle opérant au Gabon (ci-après « BilletGab »), et toute personne physique ou morale
            souhaitant utiliser la plateforme en qualité d'organisateur d'événements (ci-après « l'Organisateur »).
          </p>
          <p className="text-sm text-white/60 leading-relaxed">
            L'acceptation des présentes conditions est obligatoire pour accéder aux fonctionnalités organisateur de BilletGab.
            Elle constitue une signature électronique au sens de la réglementation gabonaise en vigueur et vaut engagement contractuel
            pleinement opposable devant les juridictions compétentes de Libreville, Gabon.
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="space-y-8">

        {/* Art. 1 */}
        <Section num="1" title="Objet du contrat" icon={FileText}>
          <P>Le présent contrat a pour objet de définir les droits et obligations réciproques de BilletGab et de l'Organisateur dans le cadre de l'utilisation de la plateforme BilletGab pour la création, la promotion et la gestion d'événements payants ou gratuits, ainsi que la collecte et le reversement des fonds issus de la vente de billets.</P>
          <P>BilletGab agit exclusivement en qualité de <span className="text-white">prestataire technique et financier intermédiaire</span>. L'Organisateur demeure seul responsable de l'organisation, du déroulement et de la légalité de ses événements.</P>
        </Section>

        {/* Art. 2 */}
        <Section num="2" title="Inscription et accès à la plateforme" icon={Lock}>
          <P>L'accès aux fonctionnalités organisateur est conditionné à :</P>
          <ul className="space-y-1">
            <Li>La création d'un compte BilletGab avec des informations exactes et à jour ;</Li>
            <Li>L'acceptation des présentes Conditions Générales Organisateur (CGO) ;</Li>
            <Li>La fourniture d'un nom de structure ou d'entreprise valide ;</Li>
            <Li>La vérification de l'identité par soumission de documents KYC à la demande de BilletGab.</Li>
          </ul>
          <P><span className="text-white font-semibold">2.1 Vérification d'identité (KYC)</span><br />
          BilletGab peut exiger, à tout moment et sans préavis, la fourniture de tout ou partie des documents suivants :</P>
          <ul className="space-y-1">
            <Li>Pièce d'identité nationale, passeport ou carte de résident en cours de validité ;</Li>
            <Li>Justificatif de domicile datant de moins de 3 mois ;</Li>
            <Li>Numéro RCCM ou tout autre identifiant légal de structure pour les personnes morales ;</Li>
            <Li>Numéro de téléphone Mobile Money vérifié au nom de l'Organisateur ;</Li>
            <Li>Tout document complémentaire jugé nécessaire par BilletGab pour l'évaluation du risque.</Li>
          </ul>
          <P><span className="text-white font-semibold">2.2 Droit de refus et de suspension</span><br />
          BilletGab se réserve le droit de <span className="text-white">refuser ou de révoquer l'accès organisateur sans obligation de justification</span>, notamment en cas de doute sur l'identité, la solvabilité ou les intentions de l'Organisateur. Ce refus ne peut faire l'objet d'aucune réclamation en dommages-intérêts.</P>
          <P>L'Organisateur garantit l'exactitude des informations fournies et s'engage à les maintenir à jour. Toute fausse déclaration peut entraîner la suspension immédiate du compte sans indemnité.</P>
          <P>L'horodatage et la version du présent contrat acceptés sont enregistrés de façon immuable sur les serveurs de BilletGab et constituent preuve de signature électronique.</P>
        </Section>

        {/* Art. 3 */}
        <Section num="3" title="Publication d'événements" icon={Calendar}>
          <P>L'Organisateur peut créer et publier des événements sur la plateforme BilletGab. Il est seul responsable de :</P>
          <ul className="space-y-1">
            <Li>L'exactitude des informations publiées (date, lieu, programme, prix) ;</Li>
            <Li>La détention des autorisations administratives nécessaires à l'organisation de l'événement ;</Li>
            <Li>La conformité de l'événement avec la législation gabonaise ;</Li>
            <Li>La sécurité et le bon déroulement de l'événement ;</Li>
            <Li>L'information des acheteurs en cas de modification ou d'annulation.</Li>
          </ul>
          <P>BilletGab se réserve le droit de refuser ou de dépublier tout événement qui contreviendrait à ses politiques internes, à la loi gabonaise ou aux bonnes mœurs, sans obligation de justification ni indemnité.</P>
        </Section>

        {/* Art. 4 */}
        <Section num="4" title="Commission et frais de service" icon={Banknote}>
          <P>En contrepartie des services rendus, BilletGab prélève :</P>
          <ul className="space-y-1">
            <Li><span className="text-white font-semibold">10 % du prix HT</span> sur chaque billet payant vendu (taux standard, modifiable par accord particulier) ;</Li>
            <Li><span className="text-white font-semibold">500 FCFA de frais fixes</span> par billet gratuit émis, à la charge de l'Organisateur ;</Li>
            <Li>Les <span className="text-white font-semibold">frais de traitement Mobile Money (PVit)</span> appliqués lors des reversements, à la charge exclusive de l'Organisateur : environ 1 % via Airtel Money, environ 1 % via Moov Money (taux susceptibles d'évoluer selon les tarifs opérateurs).</Li>
          </ul>
          <P>Ces frais sont prélevés directement sur les montants reversés à l'Organisateur. Aucun frais n'est facturé séparément. L'Organisateur reçoit le montant net après déduction.</P>
          <P>BilletGab se réserve le droit de modifier ses taux de commission avec un préavis de 30 jours notifié par email. Les taux en vigueur au moment de la création d'un événement s'appliquent jusqu'à sa clôture.</P>
        </Section>

        {/* Art. 5 */}
        <Section num="5" title="Versements et gestion des fonds" icon={RefreshCw}>
          <P>Les fonds collectés lors de la vente de billets sont crédités en temps réel sur la balance de l'Organisateur, au fur et à mesure de chaque achat. L'Organisateur peut initier un reversement à tout moment depuis son tableau de bord, sous réserve des conditions décrites ci-après.</P>
          <P>Les versements sont effectués exclusivement par virement Mobile Money (Airtel Money ou Moov Money au Gabon) via l'opérateur PVit, dans la limite des plafonds journaliers suivants pour les comptes non vérifiés :</P>
          <ul className="space-y-1">
            <Li>Airtel Money : 500 000 FCFA par opération, 1 500 000 FCFA par jour ;</Li>
            <Li>Moov Money : 500 000 FCFA par opération, 3 000 000 FCFA par jour.</Li>
          </ul>
          <P>Les montants supérieurs à 500 000 FCFA sont automatiquement découpés en plusieurs virements successifs. En cas d'échec partiel, les fonds déjà transférés sont acquis et le solde reste disponible pour un retrait ultérieur.</P>
          <P>La commission BilletGab (article 4) et les frais de traitement Mobile Money sont déduits avant chaque reversement. L'Organisateur reçoit le montant net.</P>
          <P><span className="text-white font-semibold">5.1 Conditions de blocage des versements</span><br />
          Indépendamment de la disponibilité des fonds, BilletGab se réserve le droit de suspendre ou de bloquer tout versement dans les cas suivants :</P>
          <ul className="space-y-1">
            <Li>Suspicion d'activité frauduleuse ou comportement inhabituel détecté sur le compte ;</Li>
            <Li>Signalement ou plainte d'acheteur en cours d'investigation ;</Li>
            <Li>Procédure judiciaire ou administrative impliquant l'Organisateur ou l'événement ;</Li>
            <Li>Demande d'une autorité compétente (justice, administration fiscale, autorité de régulation) ;</Li>
            <Li>Non-conformité aux exigences KYC de l'article 2.</Li>
          </ul>
          <P><span className="text-white font-semibold">5.2 Délai de rétention en cas de litige</span><br />
          En cas de litige avéré ou de procédure judiciaire initiée par un tiers ou par BilletGab, les fonds concernés peuvent être retenus <span className="text-white font-semibold">jusqu'à 90 jours calendaires</span> à compter de la date de blocage, ou jusqu'à résolution du litige si celle-ci intervient plus tôt. Cette rétention ne génère aucun intérêt au bénéfice de l'Organisateur.</P>
        </Section>

        {/* Art. 6 */}
        <Section num="6" title="Annulation d'événement — Responsabilité financière de l'Organisateur" icon={AlertTriangle}>
          <Important>
            Cet article constitue l'engagement le plus important du présent contrat. Son non-respect engage la responsabilité civile et pénale de l'Organisateur.
          </Important>
          <P>Les fonds issus de la vente de billets étant reversés à l'Organisateur au fur et à mesure des achats, l'Organisateur est <span className="text-white font-semibold">seul responsable du remboursement des acheteurs</span> en cas d'annulation de l'événement. BilletGab agit exclusivement en qualité d'intermédiaire technique et n'est pas responsable de la relation financière entre l'Organisateur et les acheteurs.</P>

          <P><span className="text-white font-semibold">6.1 Obligation de remboursement</span><br />
          En cas d'annulation de l'événement, l'Organisateur s'engage formellement à :</P>
          <ul className="space-y-1">
            <Li>Rembourser intégralement chaque acheteur dans un délai de <span className="text-white font-semibold">7 jours calendaires</span> suivant la date d'annulation ;</Li>
            <Li>Contacter directement les acheteurs et les informer des modalités et délais de remboursement ;</Li>
            <Li>Fournir à BilletGab, sur demande, la preuve des remboursements effectués.</Li>
          </ul>

          <P><span className="text-white font-semibold">6.2 Caractère de l'obligation</span><br />
          L'Organisateur reconnaît expressément que son obligation de remboursement envers les acheteurs est une <span className="text-white">obligation personnelle, directe et de résultat</span>, indépendante du rôle de BilletGab. BilletGab ne peut être tenu solidairement responsable des remboursements dus par l'Organisateur.</P>

          <P><span className="text-white font-semibold">6.3 Mesures conservatoires en cas de défaillance</span><br />
          Si BilletGab est informé ou constate que l'Organisateur ne procède pas aux remboursements dans les délais impartis, BilletGab se réserve le droit de :</P>
          <ul className="space-y-1">
            <Li>Suspendre immédiatement le compte organisateur et bloquer tous les versements futurs ;</Li>
            <Li>Retenir les fonds des événements en cours au titre de compensation ;</Li>
            <Li>Signaler l'Organisateur défaillant aux opérateurs Mobile Money (Airtel, Moov) ;</Li>
            <Li>Engager une procédure judiciaire devant le Tribunal de Commerce de Libreville ;</Li>
            <Li>Facturer des pénalités de retard de 1,5 % par semaine sur le montant dû aux acheteurs.</Li>
          </ul>

          <P><span className="text-white font-semibold">6.4 Force majeure</span><br />
          Sont considérés comme cas de force majeure : catastrophe naturelle officielle, décision gouvernementale de fermeture, pandémie déclarée. Dans ces cas, l'Organisateur et les acheteurs conviennent d'un plan de remboursement amiable. La force majeure ne dispense pas l'Organisateur de son obligation de remboursement ; elle en aménage seulement les modalités et les délais.</P>
        </Section>

        {/* Art. 7 */}
        <Section num="7" title="Annulation d'événement — Procédure obligatoire" icon={Calendar}>
          <P>En cas d'annulation ou de report d'un événement, l'Organisateur doit impérativement :</P>
          <ul className="space-y-1">
            <Li>Notifier BilletGab par email à <span className="text-violet-neon">support@billetgab.com</span> dans les <span className="text-white font-semibold">24 heures</span> suivant la décision d'annulation ;</Li>
            <Li>Utiliser la fonctionnalité « Annuler l'événement » depuis son tableau de bord ;</Li>
            <Li>Communiquer publiquement l'annulation aux acheteurs via les canaux de l'événement ;</Li>
            <Li>Proposer, en cas de report, une nouvelle date dans un délai maximum de 90 jours.</Li>
          </ul>
          <P>Les remboursements des acheteurs sont de la <span className="text-white font-semibold">seule responsabilité de l'Organisateur</span> (article 6). BilletGab n'intervient pas dans le remboursement des acheteurs. L'Organisateur dispose sur son tableau de bord de la liste des acheteurs et des montants nécessaires à la gestion de ses remboursements.</P>
          <Important>
            Toute annulation non signalée dans les délais, ou tentative de détournement des fonds, sera transmise aux autorités compétentes gabonaises et poursuivie pénalement sur le fondement de l'abus de confiance (article 247 du Code pénal gabonais).
          </Important>
        </Section>

        {/* Art. 8 */}
        <Section num="8" title="Obligations de l'Organisateur" icon={ShieldCheck}>
          <P>L'Organisateur s'engage à :</P>
          <ul className="space-y-1">
            <Li>Fournir des informations exactes, complètes et à jour sur ses événements ;</Li>
            <Li>Disposer de toutes les autorisations légales nécessaires à l'organisation de ses événements ;</Li>
            <Li>Respecter la capacité d'accueil et les normes de sécurité du lieu ;</Li>
            <Li>Honorer ses engagements envers les acheteurs de billets ;</Li>
            <Li>Utiliser les fonds versés par BilletGab exclusivement pour financer l'événement concerné ;</Li>
            <Li>Ne pas revendre les billets à un prix supérieur à celui affiché sur BilletGab ;</Li>
            <Li>Signaler immédiatement tout problème technique ou litige à BilletGab ;</Li>
            <Li>Conserver la confidentialité des données personnelles des acheteurs ;</Li>
            <Li>Ne pas utiliser la plateforme à des fins frauduleuses, illicites ou contraires aux bonnes mœurs.</Li>
          </ul>
          <P><span className="text-white font-semibold">8.1 Comportements strictement interdits</span><br />
          Il est expressément interdit à l'Organisateur de :</P>
          <ul className="space-y-1">
            <Li>Créer un événement fictif ou sans réelle intention de l'organiser (<span className="text-white">événement fantôme</span>) ;</Li>
            <Li>Utiliser une identité, une structure juridique ou des autorisations qui ne lui appartiennent pas ;</Li>
            <Li>Vendre plus de billets que la capacité réelle de l'événement ou du lieu ;</Li>
            <Li>Annuler délibérément un événement après encaissement de tranches, dans l'intention de ne pas rembourser ;</Li>
            <Li>Fournir de faux documents lors de la vérification KYC ;</Li>
            <Li>Utiliser la plateforme pour blanchir des fonds ou réaliser toute opération financière illicite ;</Li>
            <Li>Tenter de contourner ou de manipuler le système de versements ou de remboursements.</Li>
          </ul>
          <P>Tout comportement frauduleux sera signalé aux autorités judiciaires gabonaises compétentes et poursuivi sur les fondements applicables du Code pénal gabonais, notamment l'escroquerie (art. 243), l'abus de confiance (art. 247) et le blanchiment de capitaux (loi n° 35/2021).</P>
        </Section>

        {/* Art. 9 */}
        <Section num="9" title="Obligations de BilletGab" icon={ShieldCheck}>
          <P>BilletGab agit en qualité d'<span className="text-white">intermédiaire technique et financier</span>. À ce titre, BilletGab n'est pas co-organisateur des événements et n'assume aucune responsabilité quant à leur contenu, leur déroulement ou leur légalité. BilletGab s'engage à :</P>
          <ul className="space-y-1">
            <Li>Mettre à disposition une plateforme fonctionnelle, sécurisée et accessible 24h/24 ;</Li>
            <Li>Traiter les paiements des acheteurs de façon sécurisée via l'opérateur agréé PVit ;</Li>
            <Li>Mettre à disposition les fonds collectés pour reversement à l'Organisateur selon les modalités définies à l'article 5, hors cas de blocage ;</Li>
            <Li>Fournir un système de contrôle d'accès (scan QR) opérationnel ;</Li>
            <Li>Assurer la confidentialité des données de l'Organisateur ;</Li>
            <Li>Informer l'Organisateur de toute modification tarifaire avec un préavis de 30 jours ;</Li>
            <Li>Mettre à disposition de l'Organisateur les informations nécessaires à la gestion de ses remboursements (liste des acheteurs, montants) via le tableau de bord.</Li>
          </ul>
          <P><span className="text-white font-semibold">9.1 Droit de suspension et de retrait</span><br />
          BilletGab se réserve le droit, à tout moment et sans préavis, de :</P>
          <ul className="space-y-1">
            <Li>Suspendre ou dépublier tout événement en cas de doute sur sa légalité, sa sécurité ou son authenticité ;</Li>
            <Li>Bloquer les ventes de billets en attente d'investigation ;</Li>
            <Li>Geler les fonds de l'Organisateur à titre conservatoire pendant la durée d'une investigation ;</Li>
            <Li>Résilier le compte organisateur en cas de violation grave ou répétée des présentes CGO.</Li>
          </ul>
          <P>Ces mesures conservatoires ne constituent pas une faute de BilletGab et ne peuvent donner lieu à aucune réclamation en indemnité de la part de l'Organisateur. La responsabilité de BilletGab est en tout état de cause limitée au montant des commissions perçues sur l'événement concerné.</P>
        </Section>

        {/* Art. 10 */}
        <Section num="10" title="Données personnelles et confidentialité" icon={Lock}>
          <P>BilletGab collecte et traite les données personnelles de l'Organisateur (nom, email, téléphone, données bancaires Mobile Money) dans le cadre strict de l'exécution du présent contrat, conformément à la loi n° 001/2011 du 25 septembre 2011 relative à la protection des données à caractère personnel au Gabon.</P>
          <P>L'Organisateur a accès aux données personnelles des acheteurs de ses événements uniquement dans le but de gestion de ses événements. Il s'interdit formellement toute utilisation commerciale, revente ou transmission de ces données à des tiers.</P>
          <P>Les données sont conservées pendant la durée du contrat et 5 ans après sa résiliation à des fins probatoires et comptables.</P>
        </Section>

        {/* Art. 11 */}
        <Section num="11" title="Résiliation" icon={FileText}>
          <P>Le présent contrat peut être résilié :</P>
          <ul className="space-y-1">
            <Li>Par l'Organisateur à tout moment, sous réserve qu'aucun événement actif ne soit en cours et qu'aucune dette envers BilletGab ne subsiste ;</Li>
            <Li>Par BilletGab, en cas de violation des présentes CGO, avec effet immédiat et sans indemnité ;</Li>
            <Li>Par BilletGab, pour convenance, avec un préavis de 30 jours par notification email.</Li>
          </ul>
          <P>En cas de résiliation, les fonds éventuellement retenus sont reversés à l'Organisateur déduction faite des commissions dues, des remboursements en attente et de toute créance de BilletGab. Les événements en cours restent actifs jusqu'à leur date de clôture.</P>
        </Section>

        {/* Art. 12 */}
        <Section num="12" title="Droit applicable et juridiction compétente" icon={Scale}>
          <P>Le présent contrat est régi par le <span className="text-white font-semibold">droit gabonais</span> et par les textes de l'OHADA applicables au Gabon.</P>
          <P>En cas de litige relatif à l'interprétation ou à l'exécution du présent contrat, les parties conviennent de rechercher une solution amiable dans un délai de 30 jours.</P>
          <P>À défaut d'accord amiable, le litige sera soumis à la compétence exclusive du <span className="text-white font-semibold">Tribunal de Commerce de Libreville</span>, nonobstant pluralité de défendeurs ou appel en garantie.</P>
          <P>La nullité d'une clause des présentes CGO n'entraîne pas la nullité de l'ensemble du contrat. Les parties s'engagent à remplacer la clause nulle par une stipulation valable produisant un effet économique équivalent.</P>
        </Section>

        {/* Art. 13 */}
        <Section num="13" title="Conditions de progression de niveau" icon={ShieldCheck}>
          <P>Le niveau de l'Organisateur reflète son historique et sa fiabilité sur la plateforme, et peut déterminer l'accès à certaines fonctionnalités avancées. La progression suit les critères cumulatifs suivants :</P>
          <P><span className="text-white/70 font-semibold">NOUVEAU</span> — Statut attribué automatiquement à l'inscription. Aucun événement complété requis.</P>
          <P><span className="text-cyan-neon/80 font-semibold">APPROUVÉ</span> — Accessible après :</P>
          <ul className="space-y-1">
            <Li>Au minimum 1 événement complété avec succès (sans annulation ni dette) ;</Li>
            <Li>Aucun litige actif ou dette impayée envers BilletGab ;</Li>
            <Li>Soumission des documents KYC de base acceptée ;</Li>
            <Li>Compte actif depuis au moins 30 jours.</Li>
          </ul>
          <P><span className="text-violet-neon/80 font-semibold">CERTIFIÉ</span> — Accessible après :</P>
          <ul className="space-y-1">
            <Li>Au minimum 3 événements complétés sans incident ;</Li>
            <Li>Aucun avertissement ni infraction aux présentes CGO ;</Li>
            <Li>Vérification KYC complète (pièce d'identité + structure vérifiée par BilletGab) ;</Li>
            <Li>Compte actif depuis au moins 90 jours.</Li>
          </ul>
          <P><span className="text-yellow-400/80 font-semibold">PREMIUM</span> — Accessible après :</P>
          <ul className="space-y-1">
            <Li>Au minimum 10 événements complétés avec un historique irréprochable ;</Li>
            <Li>Activité continue sur la plateforme depuis au moins 12 mois ;</Li>
            <Li>Aucun incident de paiement, annulation frauduleuse ou signalement ;</Li>
            <Li>Évaluation et validation manuelle par l'équipe BilletGab.</Li>
          </ul>
          <Important>
            La progression de niveau est accordée discrétionnairement par BilletGab et ne peut être revendiquée comme un droit acquis. Tout comportement contraire aux présentes CGO peut entraîner une rétrogradation immédiate, sans préavis ni indemnité.
          </Important>
        </Section>

        {/* Art. 14 */}
        <Section num="14" title="Détection et traitement des fraudes" icon={AlertTriangle}>
          <P>BilletGab dispose de systèmes automatisés et de procédures manuelles de détection des comportements frauduleux.</P>
          <P><span className="text-white font-semibold">14.1 Fraude organisateur</span><br />
          Sont notamment constitutifs de fraude organisateur :</P>
          <ul className="space-y-1">
            <Li>La création d'événements fictifs dans le but de collecter des fonds sans intention d'organiser ;</Li>
            <Li>L'annulation délibérée après encaissement de tranches, avec refus de remboursement ;</Li>
            <Li>L'usage de fausses identités, de structures inexistantes ou de documents falsifiés ;</Li>
            <Li>La modification frauduleuse des informations d'un événement après la vente de billets.</Li>
          </ul>
          <P><span className="text-white font-semibold">14.2 Fraude acheteur</span><br />
          Sont notamment constitutifs de fraude acheteur :</P>
          <ul className="space-y-1">
            <Li>Les demandes de remboursement abusives ou infondées ;</Li>
            <Li>L'utilisation de moyens de paiement frauduleux ou dont l'acheteur n'est pas le titulaire ;</Li>
            <Li>La tentative de duplication, falsification ou revente non autorisée de billets ;</Li>
            <Li>L'abus des procédures de contestation de paiement (chargeback).</Li>
          </ul>
          <P><span className="text-white font-semibold">14.3 Mesures automatiques</span><br />
          En cas de détection d'une activité suspecte, BilletGab peut, sans préavis :</P>
          <ul className="space-y-1">
            <Li>Déclencher une suspension préventive du compte et des versements ;</Li>
            <Li>Exiger une vérification KYC renforcée avant toute reprise d'activité ;</Li>
            <Li>Annuler les transactions suspectes et rembourser les acheteurs concernés ;</Li>
            <Li>Transmettre les éléments constitutifs de la fraude aux autorités compétentes.</Li>
          </ul>
        </Section>

        {/* Art. 15 */}
        <Section num="15" title="Suspension et bannissement de compte" icon={Lock}>
          <P>BilletGab distingue deux niveaux de sanction :</P>
          <P><span className="text-white font-semibold">15.1 Suspension temporaire</span><br />
          Le compte organisateur peut être suspendu temporairement en cas de :</P>
          <ul className="space-y-1">
            <Li>Non-respect des délais KYC ou refus de fournir un document demandé ;</Li>
            <Li>Plainte d'acheteur en cours d'investigation ;</Li>
            <Li>Suspicion d'activité anormale nécessitant vérification ;</Li>
            <Li>Première infraction mineure aux présentes CGO.</Li>
          </ul>
          <P>La suspension temporaire est levée dès résolution de la situation, sur décision exclusive de BilletGab.</P>
          <P><span className="text-white font-semibold">15.2 Bannissement définitif</span><br />
          Le compte peut être définitivement banni en cas de :</P>
          <ul className="space-y-1">
            <Li>Fraude avérée ou tentative de fraude caractérisée ;</Li>
            <Li>Non-remboursement délibéré après annulation d'événement ;</Li>
            <Li>Fausse déclaration lors du KYC ;</Li>
            <Li>Condamnation judiciaire en lien avec les activités sur BilletGab ;</Li>
            <Li>Infractions répétées malgré avertissements préalables.</Li>
          </ul>
          <Important>
            Le bannissement définitif s'étend à tous les comptes associés à la même personne physique ou morale (même identité, même numéro Mobile Money, même structure juridique). BilletGab se réserve le droit de refuser toute nouvelle inscription émanant de la même entité, sans obligation de justification.
          </Important>
        </Section>

        {/* Signature */}
        <div className="glass-card p-5 border border-violet-neon/20 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-neon" />
            <p className="text-xs font-semibold text-violet-neon uppercase tracking-widest">Signature électronique</p>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">
            En cochant la case d'acceptation lors de votre inscription, vous déclarez avoir lu, compris et accepté l'intégralité des présentes Conditions Générales Organisateur (articles 1 à 15) dans leur version {CONTRACT_VERSION} du {CONTRACT_DATE}.
            Cette acceptation vaut <span className="text-white">signature électronique</span> au sens de la loi gabonaise et est enregistrée avec horodatage serveur sur les serveurs de BilletGab.
          </p>
          <p className="text-xs text-white/30">
            Document généré automatiquement — BilletGab SAS — billetgab.com — support@billetgab.com
          </p>
        </div>

      </motion.div>
    </div>
  );
}
