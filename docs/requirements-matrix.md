# Matrice de Traçabilité des Exigences — SRD V2.0 (P01.03)

**Projet :** Monsieur Fanyi — Plateforme de soutien scolaire en Guinée  
**Document Source :** SRD V2.0 (Spécifications des Exigences Logicielles, 17 Octobre 2026)  
**Taux de Commission Contractuel :** 15 % Plateforme / 85 % Professeur  
**Dernière mise à jour :** 21 Octobre 2026  

---

## 1. Légende et Jalons

- **Jalon 1 (M1) :** Fondation, Authentification, Rôles, Profils, Justificatifs, Validation Admin (Jours 1–10, 200 $)
- **Jalon 2 (M2) :** Demandes, Candidatures, Classes, Tarification (horaire/forfait), Calendrier, Rapports, Validation, Notes (Jours 11–20, 200 $)
- **Jalon 3 (M3) :** Finances, Rapprochement, 15/85, Soldes, Litiges, Reversements manuels, Tableaux de bord, Déploiement (Jours 21–30, 100 $)

---

## 2. Tableau de Traçabilité Détaillé

| ID Exigence | Description SRD V2.0 | Écran / Composant UI | API / Server Action | Modèle de Données | Règles de Validation | Scénarios de Test | Jalon | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Création de comptes parent et professeur, mot de passe haché | `/register`, `RegisterForm` | `/api/auth/register` | `User`, `Role`, `PasswordHash` | Zod : email valide, mot de passe fort (8+ car., maj/min/chiffre), téléphone GN | Test d'unicité email/tél, hachage bcrypt, rejet mot de passe faible | M1 | Prévu P10 |
| **REQ-AUTH-02** | Connexion sécurisée et gestion de session serveur | `/login`, `LoginForm` | `/api/auth/login`, `logout` | `Session`, `User` | Vérification credentials, protection brute force | Sessions HTTP-only, expiration, déconnexion propre | M1 | Prévu P10 |
| **REQ-AUTH-03** | Réinitialisation de mot de passe sécurisée | `/forgot-password`, `/reset-password` | `/api/auth/reset-password` | `PasswordResetToken` | Token cryptographique à usage unique, durée de vie limitée | Expiration token, réutilisation bloquée | M1 | Prévu P10 |
| **REQ-RBAC-01** | Contrôle d'accès basé sur les rôles (Parent, Professeur, Admin) | Layouts conditionnels, navigation | Middleware Auth & guards RBAC | `User.role` (PARENT, TEACHER, ADMIN, STUDENT) | Interdiction formelle d'accès aux routes protégées sans rôle adéquat | Tests négatifs : parent bloque professeur, professeur bloque admin, 403 Forbidden | M1 | Prévu P11 |
| **REQ-PROF-01** | Profil enseignant : matières, niveaux scolaires, zone, disponibilités | `/teacher/profile`, `TeacherProfileForm` | `updateTeacherProfile` | `TeacherProfile`, `Subject`, `GradeLevel`, `Availability` | Matières et niveaux obligatoires, zone géographique en Guinée | Sauvegarde cohérente, mise à jour des disponibilités | M1 | Prévu P13 |
| **REQ-PROF-02** | Dépôt de justificatifs (CNI/Passeport, diplômes) avec stockage sécurisé | `/teacher/documents`, `DocUploader` | `uploadTeacherDoc`, `getSecureDocUrl` | `TeacherDocument` (type, fileUrl, status) | Formats PDF/PNG/JPEG, max 5 Mo, accès privé strict | Accès direct non authentifié bloqué, URL signée temporaire | M1 | Prévu P14 |
| **REQ-ADMIN-01** | Revue et approbation/rejet manuel des enseignants par l'administrateur | `/admin/teachers`, `TeacherReviewPanel` | `approveTeacher`, `rejectTeacher` | `TeacherProfile.verificationStatus`, `AuditLog` | Motif obligatoire en cas de rejet, horodatage de la décision | Seuls les professeurs approuvés sont affichés comme actifs | M1 | Prévu P15 |
| **REQ-PAR-01** | Gestion des profils enfants par le parent (création/édition/consultation) | `/parent/children`, `ChildForm` | `createStudentProfile`, `updateChild` | `StudentProfile` (parentId, name, grade, birthDate) | Seul le parent propriétaire peut voir ou modifier ses enfants | Test d'isolation IDOR : parent A ne peut lire enfant de parent B | M1 | Prévu P12 |
| **REQ-DEM-01** | Création de demande de cours : enfant, matière, niveau, adresse, fréquence, budget, domicile/ligne | `/parent/requests/new`, `TutoringRequestForm` | `createTutoringRequest` | `TutoringRequest` | Budget GNF entier, créneaux cohérents, mode (ONLINE/HOME) | Création multi-demandes valide, persistance des critères | M2 | Prévu P18 |
| **REQ-DEM-02** | Cycle de vie de la demande : draft, open, assigned, closed | `/parent/requests`, `RequestList` | `updateRequestStatus` | `TutoringRequest.status` | Transitions d'état strictes, clôture après sélection | Machine à états vérifiée, blocage de candidatures sur demande close | M2 | P19 |
| **REQ-MATCH-01** | Consultation des demandes compatibles par les professeurs agréés | `/teacher/requests`, `RequestBrowser` | `getEligibleRequests` | Requête filtrée sur statut professeur & compétences | Seul un professeur `APPROVED` peut postuler | Test d'exclusion : prof rejeté ou non vérifié ne peut postuler | M2 | P20 |
| **REQ-MATCH-02** | Candidature de l'enseignant à une demande | `TeacherApplicationModal` | `applyToRequest`, `withdrawApplication` | `TeacherApplication` (teacherId, requestId, status) | Contrainte unique (teacherId, requestId) | Rejet doublon de candidature, possibilité de retrait | M2 | P21 |
| **REQ-MATCH-03** | Sélection et acceptation par le parent, clôture des autres candidatures | `/parent/requests/[id]`, `ApplicantCard` | `acceptApplication` | `Classroom`, `TeacherApplication` | Transaction atomique : acceptation prof, rejet autres, création classe | 1 seule candidature acceptée, génération de la classe | M2 | P22 |
| **REQ-TARIF-01** | Tarification flexible : taux horaire et forfait mensuel | `/teacher/pricing`, `PricingForm` | `savePricingOffer` | `TeacherPricingOffer` (type, priceGnf, sessionsCount, minutesPerSession) | Prix en GNF entier positif, durée standard (45, 60, 90, 120 min) | Validation format et cohérence des paramètres | M2 | P24-25 |
| **REQ-TARIF-02** | Règle d'arrondi et d'allocation exacte par séance | Widget de simulation financière | `calculateSessionAllocation` | `LessonSession.allocatedAmountGnf` | Somme des séances = Total exact du forfait. Reste alloué selon règle déterministe | Test forfait 400 000 GNF / 8 séances = 50 000 GNF/séance. Test montants indivisibles (ex: 100 000 GNF / 3 séances) | M2/M3 | P25, P41 |
| **REQ-CLASS-01** | Espace classe, planning et séances | `/parent/classrooms/[id]`, `/teacher/classrooms/[id]` | `createLessonSession`, `getSchedule` | `Classroom`, `LessonSession` (date, duration, status) | Validation des chevauchements d'horaires, fuseau horaire Guinée (UTC) | Calendrier responsive, affichage séances | M2 | P26 |
| **REQ-SEANCE-01** | Déclaration de séance effectuée et rapport pédagogique par l'enseignant | `/teacher/sessions/[id]/report` | `submitLessonReport` | `LessonReport`, `LessonSession.status` | Seul l'enseignant assigné peut soumettre le compte-rendu | Transition `SCHEDULED` -> `TEACHER_COMPLETED` | M2 | P27 |
| **REQ-SEANCE-02** | Confirmation ou contestation de la séance par le parent | `/parent/sessions/[id]/confirm` | `approveSession`, `disputeSession` | `LessonApproval`, `LessonDispute` | Seul le parent titulaire peut approuver ; séance unique (pas de double approbation) | Transition vers `PARENT_APPROVED` ou `PARENT_DISPUTED`. Bloque paiement si contesté | M2 | P28 |
| **REQ-CLASS-02** | Partage de documents et messagerie de classe simple | `ClassroomChat`, `ClassroomFiles` | `sendMessage`, `uploadClassroomFile` | `ClassroomMessage`, `Attachment` | Fichiers autorisés (PDF, images), participants de la classe uniquement | Rejet accès hors participants, horodatage messages | M2 | P30-31 |
| **REQ-NOT-01** | Notation et avis du professeur par le parent | `ReviewModal` | `submitReview` | `Rating` (score 1-5, comment) | Réservé aux parents ayant suivi au moins 1 séance validée | Prévention doublon, modération admin | M2 | P33 |
| **REQ-FIN-01** | Commande préalable et paiement anticipé (Pay-in) | `/parent/orders/checkout` | `createPaymentOrder`, `processPayment` | `PaymentOrder`, `PaymentAttempt` | Paiement requis avant début ou exécution payable des séances | Statuts : PENDING, PAID, FAILED, REFUNDED | M3 | P36 |
| **REQ-FIN-02** | Adaptateur Orange Money & MTN Mobile Money avec Sandbox / Manuel | `PaymentSelector`, `/api/payments/webhook` | `PaymentAdapterFactory`, `handleWebhook` | `PaymentProviderEvent`, `PaymentLedgerEntry` | Clé d'idempotence, signature webhook, statut explicite sandbox/démonstration | Rejet des webhooks rejoués ou falsifiés | M3 | P37-39 |
| **REQ-FIN-03** | Rapprochement manuel par l'administrateur | `/admin/payments/reconcile` | `recordManualPayment` | `PaymentLedgerEntry`, `AuditLog` | Preuve obligatoire (référence transaction opérateur, date, montant) | Traçabilité complète, absence de simulation trompeuse | M3 | P40 |
| **REQ-FIN-04** | Règle de commission 15 % plateforme / 85 % enseignant | Moteur financier interne | `allocateSessionEarnings` | `TeacherEarning` (grossGnf, commissionGnf, netGnf, rateSnapshot) | Déclenchement UNIQUEMENT sur séance financée ET approuvée parent | Forfait 400k GNF / 8 : 3 validées = 150k brut, 22 500 com (15%), 127 500 dû prof | M3 | P41 |
| **REQ-FIN-05** | Historisation du taux de commission (Snapshots) | `/admin/settings/commission` | `updatePlatformCommissionRate` | `CommissionRule` (ratePercentage, effectiveFrom) | Le nouveau taux ne s'applique qu'aux validations futures | Les montants déjà validés conservent leur taux historique | M3 | P42 |
| **REQ-FIN-06** | Reversements manuels aux enseignants (Payouts) | `/admin/payouts` | `recordTeacherPayout` | `Payout` (beneficiary, amountGnf, reference, status) | Impossible de verser plus que le solde net acquis disponible ; référence unique | Prévention formelle du double paiement | M3 | P44 |
| **REQ-FIN-07** | Gestion des litiges et remboursements | `/admin/disputes`, `DisputeResolutionPanel` | `resolveDispute`, `recordRefund` | `RefundCase`, `LessonDispute` | Décision motivée : validation, report, annulation, remboursement | Ajustement du solde non acquis, traçabilité comptable | M3 | P45-47 |
| **REQ-I18N-01** | Interface intégrale en Français (fr-GN) avec sélecteur FR/EN | Sélecteur de langue en en-tête / pied | Context i18n & formatters | Fichiers de localisation `fr.json`, `en.json` | 100 % des chaînes traduisibles, format monétaire GNF, date locale | Changement instantané, conservation du choix | M1 | P01/P05 |

---
*Ce document sert de contrat d'alignement fonctionnel pour l'ensemble des 55 phases de développement.*
