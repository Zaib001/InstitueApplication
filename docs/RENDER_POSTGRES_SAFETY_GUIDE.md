# GUIDE DE SÉCURITÉ & DE MIGRATION RENDER POSTGRESQL
## Sauvegarde, Vérification d'Intégrité et Mise à Niveau sans Perte de Données
### Plateforme : Monsieur Fanyi • Base de Données : `monsieur-fanyi-db` (Région Frankfurt)
### Date d'Échéance du Forfait Gratuit : 9 Décembre 2026

---

## 1. CONTEXTE ET OBJECTIF

La base de données PostgreSQL de production de Monsieur Fanyi (`monsieur-fanyi-db`) est actuellement hébergée sur l'offre gratuite (*Free Tier*) de Render en région Francfort (*frankfurt*).

Conformément à la politique d'infrastructure de Render :
- Les bases de données gratuites expirent automatiquement après leur période d'évaluation.
- Pour `monsieur-fanyi-db`, l'échéance d'expiration est fixée au **9 décembre 2026**.
- Sans action préalable, la base gratuite est suspendue puis définitivement purgée.

Ce document fournit la procédure certifiée pour :
1. **Exporter une sauvegarde complète et chiffrée** de la base de données.
2. **Vérifier l'intégrité structurelle** de l'archive de sauvegarde.
3. **Tester la restauration locale** pour garantir la recouvrabilité.
4. **Mettre à niveau le plan vers l'offre Starter (7 $/mois)** directement dans l'interface Render **sans recréation de base, sans changement d'URL ni interruption de service**.

---

## 2. PROCÉDURE DE SAUVEGARDE EN LECTURE SEULE (PG_DUMP)

### Étape 2.1 — Récupérer l'URL de Connexion Externe sur Render

1. Rendez-vous sur le tableau de bord Render : [https://dashboard.render.com](https://dashboard.render.com).
2. Cliquez sur votre ressource PostgreSQL : **`monsieur-fanyi-db`**.
3. Dans la section **Connection Details**, localisez le champ **External Database URL**.
4. Cliquez sur **Copy** pour copier l'URL externe (format standard) :
   ```text
   postgresql://monsieur_fanyi_user:[PASSWORD]@dpg-[ID]-a.frankfurt-postgres.render.com/monsieur_fanyi
   ```
   > ⚠️ *Important : Utilisez impérativement l'URL Externe (*External*) et non l'URL Interne (*Internal*), cette dernière n'étant accessible que depuis le réseau privé Render.*

---

### Étape 2.2 — Exécuter l'Export de Sauvegarde Complète (pg_dump)

Sur votre machine locale (ou depuis un terminal sécurisé disposant des outils PostgreSQL client version 15, 16, 17 ou 18) :

#### Option A : Format Binaire Personnalisé Compressé (Recommandé pour la Production)
```bash
pg_dump --format=custom \
        --verbose \
        --no-owner \
        --no-privileges \
        --file="backup_monsieur_fanyi_$(date +%Y%m%d_%H%M%S).dump" \
        "VOTRE_EXTERNAL_DATABASE_URL?sslmode=require"
```

*Sur Windows PowerShell :*
```powershell
$DateStr = Get-Date -Format "yyyyMMdd_HHmmss"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
  --format=custom `
  --verbose `
  --no-owner `
  --no-privileges `
  --file="backup_monsieur_fanyi_$DateStr.dump" `
  "VOTRE_EXTERNAL_DATABASE_URL?sslmode=require"
```

#### Option B : Format SQL Lisible en Texte Clair
```powershell
$DateStr = Get-Date -Format "yyyyMMdd_HHmmss"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
  --clean `
  --if-exists `
  --no-owner `
  --no-privileges `
  --file="backup_monsieur_fanyi_$DateStr.sql" `
  "VOTRE_EXTERNAL_DATABASE_URL?sslmode=require"
```

---

## 3. VÉRIFICATION D'INTÉGRITÉ DU FICHIER DE SAUVEGARDE

Avant toute modification d'infrastructure, l'intégrité du fichier doit être formellement auditée.

### Étape 3.1 — Contrôle de la Table des Matières (TOC)
Exécutez `pg_restore --list` sur le fichier `.dump` généré pour inspecter les tables critiques :
```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --list "backup_monsieur_fanyi_20261123_XXXXXX.dump" | Select-String -Pattern "User|Classroom|Payment|Ledger|Payout|Session"
```

**Résultat attendu :**
Vous devez visualiser les entrées correspondant aux tables du schéma Prisma :
- `TABLE DATA User`
- `TABLE DATA Classroom`
- `TABLE DATA ClassroomFunding`
- `TABLE DATA PaymentIntent`
- `TABLE DATA PaymentTransaction`
- `TABLE DATA LedgerJournal`
- `TABLE DATA LedgerEntry`
- `TABLE DATA Payout`
- `TABLE DATA TeacherEarning`

---

### Étape 3.2 — Test de Restauration sur une Base Locale Isolé
Pour vérifier que la sauvegarde est 100 % exploitable :

```powershell
# 1. Créer une base temporaire de test
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres -p 5432 test_restore_mf

# 2. Restaurer le fichier dump
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -p 5432 -d test_restore_mf --clean --if-exists "backup_monsieur_fanyi_20261123_XXXXXX.dump"

# 3. Vérifier le décompte des enregistrements
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5432 -d test_restore_mf -c "SELECT count(*) FROM \"User\";"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5432 -d test_restore_mf -c "SELECT count(*) FROM \"PaymentIntent\";"

# 4. Supprimer la base de test temporaire
& "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" -U postgres -p 5432 test_restore_mf
```

---

## 4. MISE À NIVEAU SUR RENDER SANS RECRÉATION NI PERTE DE DONNÉES

> 💡 **Principe clé Render :** La mise à niveau du forfait (*Plan Upgrade*) sur une base existante s'effectue **sur place** (*in-place*).
> Les paramètres suivants sont **rigoureusement conservés à l'identique** :
> - Nom de l'hôte et nom de domaine de la base (`dpg-...-a.frankfurt-postgres.render.com`)
> - Nom de la base (`monsieur_fanyi`)
> - Utilisateur et mot de passe (`monsieur_fanyi_user`)
> - La variable d'environnement `DATABASE_URL` liée au service web `monsieur-fanyi` reste 100 % valide et synchronisée automatiquement.

### Étapes de mise à niveau dans le tableau de bord Render :

1. Connectez-vous sur [https://dashboard.render.com](https://dashboard.render.com).
2. Sélectionnez **`monsieur-fanyi-db`** dans la liste des services.
3. Dans le menu latéral gauche, cliquez sur **Settings**.
4. Descendez jusqu'à la section **Instance Type** (ou **Plan**).
5. Cliquez sur le bouton **Edit**.
6. Sélectionnez l'offre **Starter** :
   - Coût : **7 $/mois** (facturation mensuelle au prorata).
   - RAM : 1 GB.
   - CPU : 1 vCPU partagé.
   - Stockage : 10 GB SSD inclus (extensible automatiquement).
   - **Durabilité : Permanente (aucune expiration automatique).**
   - **Sauvegardes automatiques quotidiennes Render incluses.**
7. Cliquez sur **Save Changes**.
8. Render appliquera la mise à niveau. La transition prend généralement moins de 60 secondes.
9. Vérifiez l'onglet **Events** du service `monsieur-fanyi-db` pour confirmer le passage au statut *Active - Starter*.

---

## 5. MISE À JOUR DU FICHIER `render.yaml` (INFRASTRUCTURE AS CODE)

Dans le référentiel de code Monsieur Fanyi, mettez à jour `render.yaml` pour aligner la configuration Blueprint sur le plan Starter :

```yaml
databases:
  - name: monsieur-fanyi-db
    plan: starter   # Remplacer 'free' par 'starter'
    region: frankfurt
    databaseName: monsieur_fanyi
    user: monsieur_fanyi_user
```

Cela garantit que toute synchronisation future du Blueprint respectera le statut pérenne de la base de données.

---

## 6. CALENDRIER DE SÉCURITÉ CONSEILLÉ

| Date limite | Action requise | Responsable |
|---|---|---|
| **Avant le 30 Novembre 2026** | Exécution du dump de sauvegarde de précaution (`pg_dump`) | Ousman / Admin Tech |
| **Avant le 30 Novembre 2026** | Validation du test de restauration locale | Ousman / Admin Tech |
| **Entre le 1er et le 5 Décembre 2026** | Passage du plan Render de *Free* à *Starter* (7 $/mois) | Ousman (Titulaire du compte Render) |
| **9 Décembre 2026** | Date fatidique Render évitée avec succès | ✅ Continuité 100 % garantie |
