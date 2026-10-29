# Guide de Déploiement Render (Free Instance) — Monsieur Fanyi

Ce guide détaille la mise en production de **Monsieur Fanyi** sur l'infrastructure gratuite (**Free Tier**) de **Render** avec base de données **PostgreSQL**.

---

## ⚡ Option 1 : Déploiement en 1 Clic via Blueprint (Recommandé)

Le projet inclut un fichier `render.yaml` prêt à l'emploi qui configure automatiquement :
1. Le service Web Next.js (Free tier, Node.js 20)
2. La base de données PostgreSQL managée (Free tier)
3. La génération des secrets de sécurité (`AUTH_SECRET`, mots de passe administrateur)
4. L'initialisation automatique de la base (`prisma db push` + données de référence Guinée)

### Étapes :
1. Connectez-vous sur [dashboard.render.com](https://dashboard.render.com/).
2. Cliquez sur le bouton bleu **New +** en haut à droite, puis sélectionnez **Blueprint**.
3. Associez votre compte GitHub et choisissez le dépôt :
   `https://github.com/Zaib001/InstitueApplication.git`
4. Render lira automatiquement le fichier `render.yaml` :
   - Service Web : `monsieur-fanyi`
   - Base de données : `monsieur-fanyi-db`
5. Renseignez la variable requise :
   - `NEXT_PUBLIC_APP_URL` : L'URL de votre application Render (ex: `https://monsieur-fanyi.onrender.com`).
6. Cliquez sur **Apply**.
7. Render provisionne la base de données PostgreSQL, compile Next.js et démarre l'application.

---

## 🛠️ Option 2 : Déploiement Manuel sur Render

Si vous préférez créer les services manuellement ou utiliser une base PostgreSQL externe (ex: Supabase, Neon, Neon Tech, Railway) :

### Étape 1 : Créer la Base de Données PostgreSQL
1. Sur Render, cliquez sur **New +** > **PostgreSQL**.
2. Nommez votre base (ex: `monsieur-fanyi-db`).
3. Choisissez la région (ex: `Frankfurt` ou `Oregon`) et le plan **Free**.
4. Cliquez sur **Create Database**.
5. Une fois créée, copiez la chaîne de connexion **Internal Database URL** (si vous déployez sur Render) ou **External Database URL**.

### Étape 2 : Créer le Web Service
1. Cliquez sur **New +** > **Web Service**.
2. Connectez le dépôt `https://github.com/Zaib001/InstitueApplication.git` (branche `main`).
3. Renseignez les paramètres suivants :
   - **Name** : `monsieur-fanyi`
   - **Region** : Même région que votre base (ex: `Frankfurt`)
   - **Branch** : `main`
   - **Runtime** : `Node`
   - **Build Command** :
     ```bash
     npm install --include=dev && npx prisma generate && npm run build
     ```
   - **Start Command** :
     ```bash
     npm run render:start
     ```
   - **Instance Type** : `Free`
   - **Health Check Path** : `/api/health`

### Étape 3 : Variables d'Environnement
Dans l'onglet **Environment** de votre Web Service, ajoutez les variables suivantes :

| Variable | Exemple / Valeur | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Active le mode production Next.js |
| `NODE_VERSION` | `20.18.0` | Assure l'utilisation de Node 20 LTS |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Chaîne de connexion PostgreSQL |
| `AUTH_SECRET` | *(Chaîne aléatoire de 32+ caractères)* | Clé de signature JWT & sessions |
| `NEXT_PUBLIC_APP_URL` | `https://monsieur-fanyi.onrender.com` | URL publique de votre app |
| `SESSION_MAX_AGE_SECONDS`| `604800` | Durée de vie d'une session (7 jours) |
| `DEFAULT_PLATFORM_COMMISSION_PERCENT` | `15` | Taux de commission plateforme (15%) |
| `PAYMENT_MOCK_ENABLED` | `true` | Simulation paiements Orange Money / MTN |
| `STORAGE_PROVIDER` | `local` | Stockage des justificatifs |
| `UPLOAD_MAX_FILE_SIZE_MB` | `5` | Taille max par document (5 Mo) |
| `ADMIN_BOOTSTRAP_EMAIL` | `admin@monsieurfanyi.gn` | Email de l'administrateur initial |
| `ADMIN_BOOTSTRAP_PASSWORD` | *(Mot de passe sécurisé)* | Mot de passe pour le compte admin |
| `ADMIN_BOOTSTRAP_NAME` | `Administrateur National Monsieur Fanyi` | Nom complet de l'administrateur |

4. Cliquez sur **Deploy Web Service**.

---

## ⚙️ Comment fonctionne le démarrage automatique (`render:start`)

Sur le Free Tier de Render, l'accès au terminal SSH est désactivé.
Le script `scripts/start-production.mjs` prend en charge toute l'initialisation sans aucune intervention manuelle :
1. **Migration / Synchronisation du Schéma** : Exécute `npx prisma db push --skip-generate` pour créer automatiquement toutes les tables requises.
2. **Données de Référence** : Exécute `scripts/seed-master-data.ts` pour peupler les matières (Maths, SVT, Physique-Chimie, Français...) et les niveaux scolaires guinéens (Primaire, Collège, Lycée...).
3. **Compte Administrateur** : Si `ADMIN_BOOTSTRAP_PASSWORD` est renseigné, le script vérifie si un administrateur existe et le crée en toute sécurité si nécessaire.
4. **Lancement Next.js** : Démarre le serveur Next.js sur `0.0.0.0` et le port assigné par Render (`$PORT`).

---

## 💡 Notes importantes sur le Free Tier de Render
- **Mise en veille après inactivité** : Les instances gratuites s'endorment après 15 minutes d'inactivité. La première requête peut prendre ~30-50 secondes le temps que l'instance se réveille.
- **Stockage éphémère** : Le système de fichiers local sur instance gratuite est temporaire. Pour une persistance long-terme des fichiers CNI/diplômes en vraie production d'entreprise, il suffira de connecter un bucket S3 ou Cloudinary compatible.
- **Vérification de Santé** : La route `/api/health` est configurée pour que Render détecte immédiatement la disponibilité du service.

