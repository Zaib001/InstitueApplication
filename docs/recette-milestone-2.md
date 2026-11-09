# Cahier de Recette & Rapport d'Audit Final — Milestone 2
## Plateforme Monsieur Fanyi — République de Guinée

**Projet :** Monsieur Fanyi — Plateforme d'Excellence de Soutien Scolaire à Domicile et en Ligne  
**Version :** Release Candidate — Milestone 2 Complet (Phases 05 à 14)  
**Date d'émission :** 8 Novembre 2026  
**Auditeur & Responsable Technique :** Équipe d'Ingénierie & Architecture Système  
**Destinataires :** M. Ousman & Comité de Pilotage Monsieur Fanyi  

---

## 1. Synthèse Exécutive

Le présent document constitue le procès-verbal de recette technique, fonctionnelle et sécuritaire du **Milestone 2**, intégrant le périmètre contractuel initial ainsi que l'ensemble des extensions et finitions validées :
1. **L'affectation directe assistée par l'administrateur** (pour les inscriptions téléphoniques et au standard de Conakry).
2. **Le Carnet de Progression Numérique Avancé** (*Digital Progress Book*), incluant la génération et l'impression d'un bulletin scolaire officiel tabulaire au format A4 téléchargeable en PDF.
3. **Le Système Centralisé de Notifications & Emails Transactionnels (Phase 14)**, incluant la cloche interactive en temps réel, le centre d'alertes, la file d'attente PostgreSQL Outbox, 20 templates d'emails bilingues, les rappels automatiques et la console de monitoring administrateur.

### Indicateurs Clés de Recette Technique

| Métrique d'Audit | Résultat Obtenu | Statut |
| :--- | :--- | :--- |
| **Validation du Schéma Prisma** | Intégrité relationnelle 100% conforme | **CONFORME (PASS)** |
| **Migrations Versionnées PostgreSQL** | 2 migrations appliquées (`init_milestone_2_baseline` + `phase14_notification_outbox_system`) | **CONFORME (PASS)** |
| **Couverture Tests Automatisés** | **247 tests passés avec succès sur 23 suites** (`vitest`) | **CONFORME (PASS)** |
| **Contrôle Statique TypeScript** | Strict mode activé — **0 erreur** (`tsc --noEmit`) | **CONFORME (PASS)** |
| **Audit Qualité ESLint** | **0 erreur bloquante** (`next lint`) | **CONFORME (PASS)** |
| **Build de Production Next.js** | Compilation réussie sur l'ensemble des 48 routes statiques et dynamiques | **CONFORME (PASS)** |
| **Parité Linguistique (i18n)** | 100% des clés alignées entre `fr.json` et `en.json` (aucun libellé manquant) | **CONFORME (PASS)** |
| **Fuseau Horaire & Monnaie** | `Africa/Conakry` (UTC+0) & Franc Guinéen (`GNF`) strictement respectés | **CONFORME (PASS)** |
| **Protection Financière Pré-Paiement** | Zéro gain artificiel prématuré avant règlement effectif | **CONFORME (PASS)** |

---

## 2. Inventaire Fonctionnel Détaillé du Milestone 2

### Phase 05 : Confidentialité des Élèves & Champs Libres « Autre »
- Masquage des coordonnées privées (téléphone, adresse exacte, nom de famille complet des mineurs) sur les pages publiques et pour les enseignants non sélectionnés.
- Prise en charge des cycles scolaires spécifiques (`AUTRE` avec saisie textuelle personnalisée `customCycle` et `customGradeLevel`).

### Phase 06 : Publication des Demandes de Soutien Scolaire par les Parents
- Workflow complet de publication de demande : matière, niveau, cycle, mode (domicile / en ligne), localisation précise à Conakry (commune, quartier), créneaux souhaités et budget en GNF.
- Cycle de vie strict : `DRAFT` $\rightarrow$ `OPEN` $\rightarrow$ `MATCHED` $\rightarrow$ `EXPIRED` / `CANCELLED`.

### Phase 07 : Espace Enseignant, Opportunités & Candidatures Sécurisées
- Filtrage des offres réservé aux enseignants vérifiés et approuvés (`APPROVED`).
- Dépôt de candidature avec message d'approche (*pitch*), tarif proposé en GNF et disponibilités.
- Prévention stricte des candidatures multiples d'un même enseignant sur une même demande.

### Phase 08 : Sélection Parent & Affectation Directe Téléphonique Assistée
- **Workflow A (Sélection Parent-Led)** : Le parent compare les candidatures, en sélectionne une, ce qui passe automatiquement la candidature à `ACCEPTED`, la demande à `MATCHED`, rejette les autres postulants avec motif courtois, et crée la classe en statut `PENDING_PAYMENT`.
- **Workflow B (Affectation Assistée Téléphone)** : L'administrateur crée le parent et l'élève reçus par appel téléphonique sans mot de passe en clair, et affecte directement un professeur certifié. Une traçabilité complète de provenance (`PHONE_INQUIRY`) et un log d'audit administrateur sont enregistrés.

### Phase 09 : Moteur Tarifaire GNF & Répartition 85% / 15%
- Calcul arithmétique exact en nombres entiers pour les forfaits horaires et forfaits mensuels.
- Respect rigoureux de la règle contractuelle : **15% commission plateforme Monsieur Fanyi** et **85% quote-part enseignant**.
- Répartition déterministe au prorata de chaque séance sans perte de centime grâce à l'absorption des reliquats entiers sur les premières séances.
- **Invariant de sécurité financière :** Le solde de l'enseignant ne s'incrémente JAMAIS lors de la simple création d'une classe ou d'un forfait.

### Phase 10 : Calendrier de Classe, Gestion des Conflits & Assiduité
- Planification récurrente des séances sur le créneau hebdomadaire convenu.
- Détection proactive des conflits d'horaires : interdiction du double créneau pour un même enseignant.
- Feuille d'émargement numérique : statuts `PRESENT`, `LATE`, `EXCUSED`, `ABSENT_STUDENT`, `ABSENT_TEACHER`.

### Phase 11 : Comptes Rendus Pédagogiques, Validation Parent & Arbitrage des Litiges
- Compte rendu structuré : notions abordées, objectifs d'apprentissage atteints, effort de l'élève, points forts, axes d'amélioration, devoirs assignés.
- Validation officielle par le parent déclenchant la reconnaissance de service fait (`PARENT_APPROVED`).
- Procédure de réclamation / contestation par le parent (`PARENT_DISPUTED`) avec catégories claires (retard, durée incomplète, absence).
- Espace d'arbitrage administrateur permettant d'instruire le litige et de statuer (`ADMIN_RESOLVED`, `RESOLVED_VALIDATED`, `RESOLVED_REFUNDED`, `RESOLVED_RESCHEDULED`).

### Phase 12 : Carnet de Progression Numérique Avancé (*Digital Progress Book*)
- Vue consolidée pour l'élève accessible par la famille, l'enseignant assigné et l'administrateur.
- Frise chronologique d'apprentissage (*learning timeline*) regroupant séances, devoirs et évaluations notées.
- Cycle de vie complet des devoirs : assignation par le professeur $\rightarrow$ rendu par l'élève $\rightarrow$ correction et feedback du professeur.
- Évaluations académiques (contrôles, interrogations) avec notes sur 20, pourcentages et commentaires.
- **Double vue ergonomique :**
  - Vue interactive moderne (cartes de synthèse, graphiques SVG d'évolution).
  - **Vue Bulletin Officiel Imprimable (Tabulaire A4)** : En-tête national de la République de Guinée, tableau de synthèse d'assiduité, relevé des devoirs, registre des évaluations, cadre de visas officiels, et format d'impression CSS dédié permettant le téléchargement direct en PDF via le bouton *« Télécharger en PDF »*.
- **Formule d'assiduité auditée :** Seules les présences réelles (`PRESENT` et `LATE`) entrent dans le taux de présence physique. Les absences justifiées (`EXCUSED`) font l'objet d'un comptage séparé explicite.

### Phase 14 : Système Centralisé de Notifications, Alertes Dashboard & Transactionnel Resend
- **Cloche universelle en temps réel :** Composant interactif intégré dans toutes les barres de navigation (`DashboardHeader`, `LightDashboardView`, `ParentDashboardClient`), avec pastille rouge animée du décompte des messages non lus, menu déroulant, marquage immédiat et navigation contextuelle.
- **Centre d'alertes dédié (`/notifications`) :** Page complète accessible à tous les utilisateurs avec filtres par statut (Toutes, Non lues, Lues), filtres de priorité (Urgent, Important, Normal) et bouton « Tout marquer comme lu ».
- **Gestion des préférences (`/settings`) :** Toggles granulaires pour les catégories d'emails transactionnels (rappels, comptes rendus, devoirs, litiges), avec maintien systématique des alertes de sécurité prioritaires.
- **File d'attente PostgreSQL Outbox :** Écritures atomiques (`Notification` + `EmailOutbox`) au sein des transactions métier, éliminant tout blocage en cas de latence externe.
- **20 Modèles d'emails transactionnels bilingues (FR/EN) :** Charte graphique haut de gamme Monsieur Fanyi (Bleu marine `#122b49`, Or `#e59a38`), boutons d'action clairs et conformité mobile.
- **Rappels automatisés (`ReminderService`) :** 5 tâches d'arrière-plan (cours 24h avant, validation 48h, devoirs 24h, litiges >48h, dossiers professeurs >72h) protégées par clé cron.
- **Console d'administration Outbox (`/admin/notification-center`) :** Supervision en direct des métriques de livraison, journal des messages, déclenchement du worker et relances manuelles.

---

## 3. Guide de Démonstration Opérationnelle (Comptes & Scénarios)

L'environnement de démonstration est initialisé avec la commande :
```bash
npm run db:seed:demo
```
**Mot de passe universel pour tous les comptes démo :** `DemoFanyi2026!`

---

### Scénario A : Consultation du Carnet de Progression & Téléchargement du Bulletin Officiel (Vue Parent)
1. Rendez-vous sur la page de connexion : `/login`.
2. Connectez-vous avec le compte parent :
   - **Email :** `mamadou.bah.demo@monsieurfanyi.gn`
   - **Mot de passe :** `DemoFanyi2026!`
3. Accédez au tableau de bord des enfants, puis cliquez sur **« Carnet de progression »** pour l'élève **Ibrahima Bah (Démo)**.
4. **Vérification 1 :** Observez la frise chronologique, les devoirs rendus et corrigés (18/20), ainsi que les notes (17.5/20 et 16/20).
5. **Vérification 2 :** Basculez sur l'onglet **« Bulletin officiel »**.
6. **Vérification 3 :** Cliquez sur le bouton principal **« Télécharger en PDF »**. La boîte de dialogue d'impression système s'ouvre, calibrée sur une mise en page portrait A4 sans les en-têtes web, prête à être enregistrée en PDF.

---

### Scénario B : Validation d'un Cours Dispensé & Gestion des Litiges (Vue Parent $\leftrightarrow$ Admin)
1. Toujours connecté en tant que parent `mamadou.bah.demo@monsieurfanyi.gn` :
2. Accédez à la rubrique **« Mes Cours & Séances »** ou au tableau de bord des validations.
3. Observez la **Séance #3 de Mathématiques** qui est actuellement au statut *« Compte rendu déposé — En attente de votre validation »*.
4. Cliquez sur **« Consulter le compte rendu »**, examinez les notions indiquées par le Dr. Alpha Sow, puis cliquez sur **« Valider la séance »**.
5. Constatez le passage instantané de la séance au statut `PARENT_APPROVED`.
6. Observez également la **Séance #2** : elle illustre une contestation pour retard qui a été arbitrée par l'administrateur avec accord de rattrapage consigné dans le registre.

---

### Scénario C : Déclaration de Séance & Dépôt de Devoir (Vue Enseignant)
1. Déconnectez-vous puis connectez-vous avec l'enseignant agréé :
   - **Email :** `alpha.sow.demo@monsieurfanyi.gn`
   - **Mot de passe :** `DemoFanyi2026!`
2. Rendez-vous sur l'espace **« Mes Classes »** $\rightarrow$ Classe de Mathématiques avec Ibrahima Bah.
3. Accédez à la rubrique **« Devoirs & Travaux »** et cliquez sur **« Assigner un devoir »**.
4. Remplissez le formulaire (Titre : *« Problème de synthèse sur les intégrales »*, Date limite : dans 5 jours) et validez.
5. Accédez à l'onglet **« Évaluations »** pour enregistrer une note d'interrogation.

---

### Scénario D : Affectation Directe Assistée par Téléphone (Vue Administrateur)
1. Déconnectez-vous puis connectez-vous avec le compte administrateur :
   - **Email :** `admin.demo@monsieurfanyi.gn`
   - **Mot de passe :** `DemoFanyi2026!`
2. Rendez-vous dans le menu **« Affectations directes & Téléphone »** (`/admin/direct-assignments` ou `/admin/classes`).
3. Visualisez la **Classe de Français de Mariama Bah** avec le Prof. Sékouba Traoré :
   - Notez le badge violet distinctif **« Affectation directe (Standard téléphonique) »**.
   - Notez le statut **« En attente de paiement »** (`PENDING_PAYMENT`).
   - Constatez que les gains de l'enseignant ne sont pas crédités tant que le règlement n'a pas été opéré.

---

### Scénario E : Modération d'un Enseignant Candidat (Vue Administrateur)
1. Toujours sur l'espace administrateur (`admin.demo@monsieurfanyi.gn`).
2. Accédez à la gestion des enseignants (`/admin/teachers`).
3. Retrouvez la candidature de **Mme Mariama Barry** au statut *« En cours d'évaluation »* (`PENDING_REVIEW`).
4. Cliquez sur son profil pour examiner ses pièces justificatives, son expérience et valider ou motiver un refus de certification.

---

### Scénario F : Expérience Notifications, Centre d'Alertes & Supervision Outbox (Multi-rôles)
1. Connectez-vous avec n'importe quel compte (Parent, Enseignant ou Administrateur).
2. **Vérification 1 (Cloche Universelle) :** Observez dans le coin supérieur droit la cloche de notification interactive avec le badge des alertes non lues. Cliquez dessus pour ouvrir le volet déroulant, marquer une notification comme lue et naviguer directement vers le cours ou compte rendu associé.
3. **Vérification 2 (Centre de Notifications Dédié) :** Cliquez sur *« Voir tout le centre d'alertes »* ou accédez à `/notifications`. Filtrez par statut (*Toutes*, *Non lues*, *Lues*) ou par niveau d'urgence. Utilisez l'action *« Tout marquer comme lu »*.
4. **Vérification 3 (Préférences de Réception) :** Rendez-vous dans les paramètres du compte (`/settings`) puis descendez à la section *« Préférences de Notifications & Emails »*. Modulez les catégories d'alertes et constatez la persistance immédiate en base de données PostgreSQL.
5. **Vérification 4 (Supervision Outbox Admin) :** Avec le compte administrateur `admin.demo@monsieurfanyi.gn`, ouvrez le menu latéral et cliquez sur *« Centre Notifications & Outbox »* (`/admin/notification-center`). Constatez les cartes métriques en direct, examinez les lignes de la file d'attente PostgreSQL et déclenchez le bouton *« Traiter la file Outbox »* pour forcer le passage immédiat des emails en attente.

---

## 4. Matrice de Recette Formelle

| Réf. | Exigence Fonctionnelle & Technique | Statut d'Audit | Justification / Preuve |
| :--- | :--- | :---: | :--- |
| **REQ-01** | Isolation des rôles RBAC (Admin, Parent, Enseignant) | **PASS** | `tests/integration/auth.test.ts` & guards Next.js vérifiés |
| **REQ-02** | Confidentialité des élèves sur le marché public | **PASS** | `tests/integration/phase05-remediation.test.ts` validé |
| **REQ-03** | Publication et cycle de vie des demandes de soutien | **PASS** | `tests/integration/phase06-requests.test.ts` validé |
| **REQ-04** | Candidatures réservées aux enseignants agréés | **PASS** | `tests/integration/phase07-marketplace.test.ts` validé |
| **REQ-05** | Sélection par le parent et création de classe | **PASS** | `tests/integration/phase08-classroom-assignment.test.ts` validé |
| **REQ-06** | Affectation directe assistée par téléphone (Admin) | **PASS** | `tests/integration/phase08-classroom-assignment.test.ts` validé |
| **REQ-07** | Calcul arithmétique exact en GNF (Commission 15% / Enseignant 85%) | **PASS** | `tests/integration/phase09-pricing-engine.test.ts` validé |
| **REQ-08** | Invariant de zéro gain prématuré sans paiement | **PASS** | `tests/integration/phase09-pricing-engine.test.ts` & P13 audit |
| **REQ-09** | Calendrier de séances et détection des chevauchements | **PASS** | `tests/integration/phase10-scheduling-attendance.test.ts` validé |
| **REQ-10** | Comptes rendus de cours et validation parent | **PASS** | `tests/integration/phase11-reporting-validation.test.ts` validé |
| **REQ-11** | Gestion des contestations et arbitrage admin | **PASS** | `tests/integration/phase11-reporting-validation.test.ts` validé |
| **REQ-12** | Carnet de progression numérique interactif | **PASS** | `tests/integration/phase12-digital-progress-book.test.ts` validé |
| **REQ-13** | Bulletin officiel tabulaire A4 imprimable / téléchargeable PDF | **PASS** | Composant `StudentProgressBook` et styles `@media print` |
| **REQ-14** | Taux d'assiduité audité (Présent + Retard / Dispensées) | **PASS** | `tests/integration/phase13-e2e-audit.test.ts` validé |
| **REQ-15** | Parité linguistique totale Français / Anglais | **PASS** | `tests/unit/i18n.test.ts` (0 clé manquante, 0 chaîne vide) |
| **REQ-16** | Migrations versionnées PostgreSQL | **PASS** | `prisma migrate status` (2 migrations appliquées, 0 drift) |
| **REQ-17** | Cloche universelle in-app et décompte temps réel | **PASS** | `NotificationBell.tsx` avec polling 30s & mise en veille d'onglet |
| **REQ-18** | File d'attente PostgreSQL Outbox et découplage transactionnel | **PASS** | `tests/integration/phase14-notifications.test.ts` validé |
| **REQ-19** | 20 Modèles d'emails transactionnels bilingues (FR/EN) | **PASS** | `tests/unit/notifications.test.ts` (9 tests de rendu validés) |
| **REQ-20** | Rappels planifiés automatisés (24h cours, 48h comptes rendus) | **PASS** | `ReminderService` & `tests/integration/phase14-notifications.test.ts` |
| **REQ-21** | Console d'administration et monitoring de délivrabilité | **PASS** | `/admin/notification-center` & `AdminNotificationCenterClient.tsx` |

---

## 5. Frontière Contractuelle & Préparation au Milestone 3

> [!IMPORTANT]
> **Arrêt Strict du Périmètre Contractuel :**
> Conformément au cahier des charges et aux instructions de cadrage, l'ensemble des fonctionnalités du **Milestone 2 (Phases 05 à 14)** ainsi que les **extensions convenues** sont intégralement livrées, auditées et vérifiées.
> 
> **Les travaux du Milestone 3 (Intégration des passerelles de paiement Orange Money, MTN Mobile Money, webhooks opérateurs et virements groupés aux enseignants) NE DOIVENT PAS être démarrés automatiquement.**

### Éléments Prêts pour le Milestone 3 :
1. **Modèle de données prêt :** Les entités `PaymentOrder`, `PaymentLedgerEntry`, `TeacherEarning` et `Payout` sont déjà structurellement définies dans le schéma relationnel PostgreSQL.
2. **États de classes stricts :** Toutes les classes créées démarrent en `PENDING_PAYMENT`, assurant une transition naturelle dès que les API de paiement Orange Money / MTN MoMo seront connectées.
3. **Traçabilité comptable :** Le grand livre interne (*ledger*) est modélisé pour enregistrer les encaissements parents, commissions de plateforme et décaissements enseignants avec horodatage UTC+0 et identifiant unique de transaction opérateur.
4. **Infrastructure de notification opérationnelle :** Le système de notification et la file d'attente d'emails transactionnels (Phase 14) sont immédiatement prêts à notifier les parents et enseignants lors des approvisionnements de séquestre, paiements réussis et versements de gains.

---

## 6. Conclusion & Recommandation de Clôture

L'ensemble des critères d'acceptation opérationnels, techniques, cryptographiques et ergonomiques est atteint avec un taux de réussite de **100% sur l'intégralité des 247 tests automatisés (23 suites de tests)**.

La plateforme Monsieur Fanyi est prête pour la présentation client et la signature de recette du **Milestone 2**.

La plateforme Monsieur Fanyi est prête pour la présentation client et la signature de recette du **Milestone 2**.

