# Architecture du Système Centralisé de Notifications & Emails Transactionnels

## Monsieur Fanyi — Espace Numérique de Soutien Scolaire en Guinée

Ce document détaille l'architecture technique, le modèle de données, les flux d'événements et les procédures opérationnelles du système de notifications in-app et d'emails transactionnels implémenté dans le cadre du **Jalon 2**.

---

## 1. Principes Fondamentaux de Conception

Le système repose sur quatre piliers d'ingénierie logicielle essentiels :

1. **Découplage Transactionnel & Fiabilité Atomique (PostgreSQL Outbox Pattern)**
   - Toute action métier importante (inscription, validation de séance, contestation de litige, attribution de classe, assignation de devoir) s'exécute au sein d'une transaction PostgreSQL ACID.
   - La notification in-app (`Notification`) et l'entrée d'envoi d'email (`EmailOutbox`) sont créées **dans la même transaction de base de données**.
   - Aucun appel réseau sortant vers un fournisseur externe (Resend) ne bloque ou ne fait échouer une transaction métier sensible. Si l'API externe est indisponible ou ralentie, les données métier et la file d'attente locale restent garanties.

2. **Idempotence & Prévention des Doublons (`dedupKey`)**
   - Chaque notification et entrée outbox possède une clé de déduplication déterministe (`dedupKey`), par exemple `reminder_lesson_parent_{sessionId}_{date}`.
   - Les appels répétés ou concurrents (retry HTTP, exécution de tâches planifiées) ne créent aucun doublon ni spam visuel pour l'utilisateur.

3. **Mode Sécurisé & Environnement de Développement (Safe Mock Sandbox)**
   - En environnement de test ou tant que les clés API de production Resend et la validation DNS du domaine ne sont pas actives, le système bascule de façon transparente en mode simulation (`[EMAIL_MOCK_DISPATCH]`).
   - Les tests automatisés s'exécutent de façon 100% déterministe sans dépendre d'un réseau externe.

4. **Respect des Préférences Utilisateur & Souveraineté des Données**
   - Chaque utilisateur peut moduler finement ses préférences de réception d'emails (rappels, rapports, devoirs, litiges).
   - Les notifications critiques liées à la sécurité du compte (réinitialisation de mot de passe, validation d'identité) demeurent strictement prioritaires et non désactivables.

---

## 2. Modèle de Données & Schéma PostgreSQL

### 2.1 Modèle `Notification` (Alertes In-App)

```prisma
model Notification {
  id          String                 @id @default(cuid())
  userId      String
  user        User                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType   NotificationEventType  @default(ADMIN_ALERT)
  priority    NotificationPriority   @default(NORMAL)
  title       String
  message     String
  linkUrl     String?
  entityType  String?                // e.g. "LessonSession", "Classroom", "TeacherApplication"
  entityId    String?                // Identifiant de l'entité liée
  isRead      Boolean                @default(false)
  readAt      DateTime?
  dedupKey    String?
  createdAt   DateTime               @default(now())

  emailOutbox EmailOutbox?

  @@index([userId])
  @@index([isRead])
  @@index([eventType])
  @@index([priority])
  @@index([dedupKey])
}
```

### 2.2 Modèle `EmailOutbox` (File d'Attente Transactionnelle)

```prisma
model EmailOutbox {
  id                   String                @id @default(cuid())
  notificationId       String?               @unique
  notification         Notification?         @relation(fields: [notificationId], references: [id], onDelete: SetNull)
  eventType            NotificationEventType
  recipientEmail       String
  recipientName        String?
  subject              String
  templateName         String
  locale               String                @default("fr")
  payloadJson          String                @default("{}")
  status               EmailDeliveryStatus   @default(PENDING)
  attempts             Int                   @default(0)
  maxAttempts          Int                   @default(5)
  nextAttemptAt        DateTime              @default(now())
  lastError            String?
  providerMessageId    String?               // Identifiant retourné par Resend
  providerResponseJson String?
  dedupKey             String                @unique
  sentAt               DateTime?
  deliveredAt          DateTime?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  @@index([status])
  @@index([nextAttemptAt])
  @@index([recipientEmail])
  @@index([eventType])
  @@index([dedupKey])
}
```

### 2.3 Modèle `NotificationPreference` (Gestion des Préférences)

```prisma
model NotificationPreference {
  id                            String   @id @default(cuid())
  userId                        String   @unique
  user                          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emailLessonReminders          Boolean  @default(true)
  emailReportSubmitted          Boolean  @default(true)
  emailHomeworkAssigned         Boolean  @default(true)
  emailAssessmentRecorded       Boolean  @default(true)
  emailProgressDigest           Boolean  @default(true)
  emailMarketplaceOpportunities Boolean  @default(true)
  emailMarketing                Boolean  @default(false)
  inAppAll                      Boolean  @default(true)
  createdAt                     DateTime @default(now())
  updatedAt                     DateTime @updatedAt

  @@index([userId])
}
```

---

## 3. Registre des Événements du Domaine (20 Événements)

| N° | Clé d'Événement (`NotificationEventType`) | Destinataire Cible | Priorité | Template Associé | Description & Déclencheur |
|:---|:---|:---|:---|:---|:---|
| 1 | `AUTH_WELCOME` | Utilisateur (Parent/Enseignant) | NORMAL | `welcome` | Inscription réussie sur la plateforme |
| 2 | `AUTH_ACTIVATION` | Parent | HIGH | `account-activation` | Création assistée d'un compte parent par un administrateur |
| 3 | `AUTH_PASSWORD_RESET` | Utilisateur | URGENT | `password-reset` | Demande de réinitialisation avec lien sécurisé valable 1h |
| 4 | `TEACHER_VERIFIED` | Enseignant | HIGH | `teacher-verified` | Dossier et diplômes validés par l'administration |
| 5 | `TEACHER_REJECTED` | Enseignant | HIGH | `teacher-rejected` | Dossier refusé avec motif pédagogique explicatif |
| 6 | `TEACHER_APPLICATION_RECEIVED` | Parent | NORMAL | `teacher-application-received` | Un enseignant a postulé à une demande de cours |
| 7 | `TEACHER_SHORTLISTED` | Enseignant | NORMAL | `teacher-shortlisted` | Le parent a présélectionné la candidature |
| 8 | `TEACHER_SELECTED` | Enseignant & Parent | HIGH | `teacher-selected` | Le parent a accepté l'offre et créé la classe |
| 9 | `ADMIN_CLASSROOM_ASSIGNED` | Enseignant & Parent | HIGH | `admin-classroom-assigned` | L'administration a assigné un professeur à une classe |
| 10 | `PACKAGE_CONFIRMED` | Parent & Enseignant | NORMAL | `package-confirmed` | Forfait horaire ou mensuel configuré avec ventilation GNF |
| 11 | `SCHEDULE_CHANGED` | Parent & Enseignant | HIGH | `schedule-changed` | Reprogrammation d'une séance avec ancien/nouvel horaire |
| 12 | `LESSON_CANCELLED` | Parent & Enseignant | HIGH | `lesson-cancelled` | Annulation d'une séance avec motif |
| 13 | `LESSON_REMINDER` | Parent & Enseignant | NORMAL | `lesson-reminder` | Rappel automatique 24h avant le début d'une séance |
| 14 | `LESSON_REPORT_SUBMITTED` | Parent | NORMAL | `lesson-report-ready` | Compte rendu rédigé par l'enseignant, prêt pour validation parentale |
| 15 | `LESSON_APPROVED` | Enseignant | NORMAL | `lesson-approved` | Séance validée sans réserve par le parent d'élève |
| 16 | `DISPUTE_OPENED` | Enseignant & Administrateur | URGENT | `dispute-opened` | Litige ouvert par le parent sur une séance |
| 17 | `DISPUTE_RESOLVED` | Parent & Enseignant | HIGH | `dispute-resolved` | Arbitrage officiel rendu par l'administration |
| 18 | `HOMEWORK_ASSIGNED` | Parent & Élève | NORMAL | `homework-assigned` | Nouveau devoir de maison consigné dans le carnet |
| 19 | `ASSESSMENT_RECORDED` | Parent | NORMAL | `assessment-recorded` | Note d'évaluation ou interrogation consignée dans le carnet |
| 20 | `ACADEMIC_PROGRESS_DIGEST` | Parent | NORMAL | `academic-progress-digest` | Synthèse périodique d'évolution scolaire |

---

## 4. Machine à États de l'Outbox & Stratégie de Retry

```
    [ PENDING ]
         |
         v
   [ PROCESSING ]
      /      \
(Succès)    (Erreur)
    /          \
   v            v
[ SENT ]   (tentatives < 5 ?)
   |          /          \
(Webhook)  (OUI)         (NON)
   |        /              \
   v       v                v
[ DELIVERED ] [ RETRY_SCHEDULED ] [ PERMANENT_FAILURE ]
                     |
            (Attente Exponentielle)
                     |
                     v
                [ PENDING ]
```

### Stratégie de Backoff Exponentiel
Pour éviter la surcharge réseau ou l'épuisement des quotas, le délai de relance augmente de façon exponentielle :
- **Essai 1** : Immédiat
- **Essai 2** : 2 minutes (2¹ min)
- **Essai 3** : 4 minutes (2² min)
- **Essai 4** : 8 minutes (2³ min)
- **Essai 5** : 16 minutes (2⁴ min)
- **Au-delà de 5 essais** : L'élément bascule en `PERMANENT_FAILURE` (Dead Letter Queue) et nécessite une intervention ou une relance manuelle via la console d'administration `/admin/notification-center`.

---

## 5. Rappels Automatisés en Arrière-Plan (`ReminderService`)

Cinq tâches de surveillance s'exécutent de façon planifiée :

1. **Rappels de cours à venir (24h avant)**
   - Détecte les séances `SCHEDULED` prévues dans la fenêtre des 23h à 25h à venir.
   - Envoie un email personnalisé au parent et à l'enseignant avec l'heure de Conakry, la matière et le lieu.
   - Idempotent via `reminder_lesson_{role}_{sessionId}_{date}`.

2. **Rappels de validation de compte rendu (48h après soumission)**
   - Détecte les séances ayant un rapport `SUBMITTED` non validé par le parent depuis plus de 48 heures.
   - Alerte le parent sur la nécessité de valider la séance.

3. **Rappels d'échéance de devoirs (24h avant la date limite)**
   - Analyse les devoirs `ASSIGNED` dont la date d'échéance approche dans les 24 heures.
   - Notifie le parent pour veiller au travail personnel de l'élève.

4. **Alertes administrateur sur litiges non résolus (> 48h)**
   - Détecte les litiges `OPEN` ou `UNDER_REVIEW` non arbitrés après 48h.
   - Alerte les administrateurs pour préserver la confiance et la fluidité de la plateforme.

5. **Alertes administrateur sur dossiers enseignants en attente (> 72h)**
   - Identifie les dossiers d'enseignants soumis depuis plus de 3 jours ouvrés sans examen.

### Déclenchement Sécurisé des Cron Jobs
Les endpoints cron sont protégés par un en-tête `Authorization: Bearer <CRON_SECRET>` :
- `POST /api/cron/reminders` : Déclenche l'évaluation des rappels automatisés.
- `POST /api/cron/outbox-flush` : Traite les emails en attente dans la file Outbox.

---

## 6. Composants d'Interface Utilisateur Implémentés

### 6.1 Cloche Universelle de Notifications (`NotificationBell.tsx`)
- Intégrée dans les en-têtes de l'application (`DashboardHeader.tsx`, `LightDashboardView.tsx`, `ParentDashboardClient.tsx`).
- Décompte visuel en temps réel avec badge rouge animé.
- Menu déroulant interactif affichant les dernières alertes avec temps relatif en français ("Il y a 5 min", "Hier").
- Clic pour marquer comme lu avec redirection contextuelle fluide vers l'action requise.
- Option « Tout marquer comme lu ».
- Polling optimisé toutes les 30 secondes, se mettant automatiquement en veille lorsque l'onglet est masqué via l'API `document.visibilityState`.

### 6.2 Centre de Notifications Dédié (`/notifications`)
- Route accessible à tous les rôles authentifiés.
- Onglets de filtrage : « Toutes », « Non lues », « Lues ».
- Filtre par niveau de priorité (« Tous niveaux », « Urgent uniquement », « Important uniquement »).
- Pagination complète et actualisation instantanée.
- Accès direct aux préférences de notification.

### 6.3 Gestion des Préférences dans les Paramètres (`/settings`)
- Formulaire dédié (`NotificationPreferencesForm.tsx`) intégré à la page des paramètres du profil.
- Toggles granulaires pour les catégories d'emails.
- Mention claire de la protection permanente des alertes de sécurité de compte.

### 6.4 Console d'Administration Outbox (`/admin/notification-center`)
- Accessible aux seuls administrateurs (contrôle RBAC strict).
- Cartes métriques en direct : Total outbox, En attente / Relances, Livrés avec succès, Échecs définitifs.
- Table complète des messages avec objet, destinataire, template, nombre d'essais et message d'erreur éventuel.
- Bouton d'action « Traiter la file Outbox » pour déclencher un flush immédiat.
- Bouton « Relancer » pour forcer une nouvelle tentative sur un message en échec.
- Intégré dans le menu latéral d'administration (`LightSidebar.tsx`).

---

## 7. Guide de Déploiement & Configuration DNS en Production

Pour activer la délivrabilité réelle via le nom de domaine de production en République de Guinée (`monsieurfanyi.com` / `monsieurfanyi.gn`), renseigner les enregistrements DNS suivants dans la zone DNS du registrar :

### 7.1 Enregistrements DNS Recommandés (Resend)

| Type | Nom / Hôte | Valeur / Cible | Utilité |
|:---|:---|:---|:---|
| **TXT** | `resend._domainkey.monsieurfanyi.com` | `k=rsa; p=MIGf...` *(fourni par Resend)* | Signature cryptographique DKIM |
| **TXT** | `monsieurfanyi.com` | `v=spf1 include:amazonses.com ~all` | Autorisation des serveurs SPF |
| **TXT** | `_dmarc.monsieurfanyi.com` | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@monsieurfanyi.com` | Protection contre l'usurpation d'identité DMARC |
| **MX** | `feedback.monsieurfanyi.com` | `feedback-smtp.resend.com` | Gestion des retours d'erreurs (Bounces) |

### 7.2 Variables d'Environnement Production

```env
RESEND_API_KEY="re_1234567890abcdef..."
RESEND_WEBHOOK_SECRET="whsec_1234567890..."
EMAIL_FROM="Monsieur Fanyi <notifications@monsieurfanyi.com>"
EMAIL_REPLY_TO="support@monsieurfanyi.com"
EMAIL_ENABLED=true
CRON_SECRET="fanyi_production_cron_secret_64_chars_hex_here"
```

---

## 8. Bilan des Tests Automatisés

- **Tests unitaires** (`tests/unit/notifications.test.ts`) : 9/9 tests réussis (rendu bilingue des templates, backoff exponentiel, respect des clés de substitution).
- **Tests d'intégration** (`tests/integration/phase14-notifications.test.ts`) : 9/9 tests réussis (publication transactionnelle, déduplication, préférences utilisateur, passage PENDING -> SENT, gestion des échecs permanents, décompte des non-lus, rappels 24h et isolation multi-tenant).
- **Couverture globale de la suite de tests** : **247 tests validés** sur l'ensemble des 23 suites de tests de la plateforme.
- **Vérification TypeScript** : `tsc --noEmit` validé sans aucune erreur.
- **Vérification Build Next.js** : Compilation réussie sur l'ensemble des 48 routes de l'application.

