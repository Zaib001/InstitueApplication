# 🎓 Monsieur Fanyi

> Plateforme d'excellence et de confiance pour le soutien scolaire et les cours particuliers à domicile & en ligne en Guinée.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4.16-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Render](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?logo=render)](https://render.com/)

---

## 🌟 Fonctionnalités Clés

- **Tableaux de bord thématiques clairs** :
  - **Espace Parent** : Gestion des élèves/enfants, demandes de tutorat sur-mesure, suivi des cours, facturation.
  - **Espace Enseignant / Répétiteur** : Onboarding en 4 étapes, soumission des pièces justificatives (CNI, diplômes), disponibilités hebdomadaires, gestion des offres tarifaires.
  - **Espace Administrateur** : Validation KYC des tuteurs avec visionneuse de documents sécurisée, gestion des utilisateurs, journalisation des audits.
- **Sécurité & Authentification RBAC** :
  - Sessions sécurisées HTTP-only avec jetons JWT signés via `jose`.
  - Hachage cryptographique fort avec `bcryptjs` (facteur 12).
  - Réinitialisation de mot de passe par jetons à usage unique avec expiration.
  - Stockage privé des pièces justificatives hors de la racine web publique.
- **Moteur Financier & Séquestre** :
  - Modèle de commission plateforme paramétrable (15% par défaut).
  - Validation bilatérale des séances de cours (Enseignant -> Parent -> Validation financière).
  - Mock d'intégration paiements mobiles guinéens (Orange Money, MTN Mobile Money).
- **Internationalisation & Contexte Local** :
  - Support bilingue Français (fr-GN) et Anglais (en).
  - Monnaie en Franc Guinéen (GNF) formatée selon les standards locaux.
  - Niveaux scolaires alignés sur le système éducatif guinéen (Primaire, Collège, Lycée, Supérieur).

---

## 🚀 Déploiement en Production sur Render (Free Tier)

Le projet est pré-configuré pour un déploiement gratuit sans friction sur **Render**.

### Déploiement en 1 Clic (Render Blueprint)
1. Forkez ou connectez ce dépôt : `https://github.com/Zaib001/InstitueApplication.git`
2. Dans [Render Dashboard](https://dashboard.render.com/), cliquez sur **New +** > **Blueprint**.
3. Sélectionnez le dépôt `InstitueApplication`.
4. Renseignez l'URL de votre application (`NEXT_PUBLIC_APP_URL`) et cliquez sur **Apply**.
5. Render instancie la base PostgreSQL, exécute les migrations et démarre le serveur.

Pour le guide détaillé et les instructions de configuration manuelle, consultez [RENDER_DEPLOY.md](./RENDER_DEPLOY.md).

---

## 💻 Développement Local

### Prérequis
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **PostgreSQL** en cours d'exécution localement ou via Docker

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration des variables d'environnement
Copiez le fichier `.env.example` en `.env` :
```bash
cp .env.example .env
```
Renseignez votre chaîne de connexion `DATABASE_URL` et votre clé secrète `AUTH_SECRET`.

### 3. Synchronisation de la base de données
```bash
# Générer le client Prisma
npm run db:generate

# Synchroniser le schéma avec votre PostgreSQL
npm run db:push

# Initialiser les matières et classes de référence (Guinée)
npx tsx scripts/seed-master-data.ts

# (Optionnel) Créer un administrateur initial
npm run db:seed:admin

# (Optionnel) Peupler avec un jeu de données de test complet tous rôles
npm run db:seed:all
```

### 4. Démarrage du serveur de développement
```bash
npm run dev
```
L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## 🧪 Tests & Qualité du Code

```bash
# Exécuter les tests unitaires et d'intégration
npm run test

# Vérification stricte des types TypeScript
npm run typecheck

# Linter le code
npm run lint

# Compiler le build de production
npm run build
```

---

## 📁 Structure du Projet

```
├── prisma/
│   └── schema.prisma        # Modèle de données PostgreSQL complet
├── public/                  # Fichiers statiques et médias
├── scripts/
│   ├── start-production.mjs # Script d'amorçage et démarrage pour Render
│   ├── seed-master-data.ts  # Données de référence (matières & classes)
│   ├── bootstrap-admin.ts   # Amorçage de l'administrateur
│   └── seed-all-roles.ts    # Données de démonstration multi-rôles
├── src/
│   ├── app/                 # Routes Next.js App Router (auth, parent, teacher, admin, api)
│   ├── components/          # Composants UI React
│   ├── lib/                 # Utilitaires (auth, db, validation, config, i18n, money, storage)
│   └── messages/            # Traductions i18n (fr.json, en.json)
├── storage/                 # Dossier local sécurisé pour pièces justificatives privées
├── tests/                   # Suites de tests Vitest (unitaires et intégration)
├── render.yaml              # Spécification Infrastructure-as-Code pour Render
└── RENDER_DEPLOY.md         # Guide pas-à-pas de déploiement Render Free Tier
```

---

## 📄 Licence

Propriétaire — Tous droits réservés.
