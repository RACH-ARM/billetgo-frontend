# BilletGab — Frontend

Interface web de la plateforme de billetterie événementielle BilletGab.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Langage | TypeScript 5 |
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router v6 |
| State | Zustand |
| Data fetching | TanStack Query (React Query) |
| UI / styles | Tailwind CSS + classes custom |
| Animations | Framer Motion |
| Charts | Recharts |
| QR scan | html5-qrcode |
| Tests | Vitest + Testing Library |
| Hébergement | Vercel |

## Prérequis

- Node.js 18+
- npm 9+
- Backend BilletGab démarré sur `http://localhost:3000`

## Démarrage en développement

```bash
npm install
npm run dev
```

L'app démarre sur `http://localhost:5173`.

Le proxy Vite redirige automatiquement `/api/*` vers `http://localhost:3000` — aucune configuration CORS nécessaire en local.

## Variables d'environnement

Créer un fichier `.env` à la racine (déjà présent en local) :

| Variable | Valeur dev | Description |
|----------|------------|-------------|
| `VITE_API_URL` | `/api/v1` | Préfixe API (proxy Vite en dev, chemin direct en prod) |
| `VITE_BACKEND_URL` | `http://localhost:3000` | URL complète du backend |
| `VITE_APP_NAME` | `BilletGab` | Nom de l'app |
| `VITE_APP_URL` | `http://localhost:5173` | URL frontend |

## Scripts disponibles

```bash
npm run dev          # Démarrage Vite avec proxy
npm run build        # Compilation TypeScript + bundle production
npm run preview      # Prévisualisation du build production
npm run type-check   # Vérification TypeScript sans compiler
npm run lint         # ESLint
npm test             # Tests Vitest
npm run test:watch   # Tests en mode watch
npm run test:coverage # Rapport de couverture
```

## Structure du projet

```
src/
├── pages/           # Pages par rôle et fonctionnalité
│   ├── Home.tsx              # Catalogue événements (public)
│   ├── EventDetail.tsx       # Page événement + achat
│   ├── Checkout.tsx          # Tunnel de paiement Mobile Money
│   ├── MesEvenements.tsx     # Dashboard organisateur
│   ├── AdminBackoffice.tsx   # Backoffice admin
│   ├── InfluencerDashboard.tsx
│   ├── AgentPOS.tsx          # Vente physique (Point de vente)
│   ├── ScannerApp.tsx        # Scan QR codes entrée
│   ├── OrganizerLanding.tsx  # Page d'accueil organisateurs
│   ├── ContratOrganisateur.tsx # CGU organisateurs
│   ├── CGU.tsx / CGV.tsx     # Conditions générales
│   └── ...
├── components/      # Composants réutilisables
├── services/        # Appels API (axios)
├── stores/          # Stores Zustand (auth, cart)
├── hooks/           # Hooks personnalisés
├── types/           # Types TypeScript
└── lib/             # Utilitaires (sentry, etc.)
```

## Rôles et routes protégées

| Rôle | Route principale |
|------|-----------------|
| `BUYER` | `/mes-billets`, `/compte` |
| `ORGANIZER` | `/mes-evenements`, `/versements`, `/compte` |
| `SCANNER` | `/scanner` |
| `AGENT` | `/agent-pos` |
| `INFLUENCER` | `/influencer` |
| `ADMIN` | `/admin` |

## Déploiement

Hébergé sur **Vercel** (billetgab.com).

```bash
npm run build   # tsc + vite build
```

Variables d'environnement à configurer dans le dashboard Vercel. En production, `VITE_API_URL` pointe vers l'URL complète du backend Render.

## Tests

```bash
npm test   # 107 tests — auth, commandes, formulaires, services
```
