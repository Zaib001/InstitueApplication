# Plan Directeur d'Implémentation sur 30 Jours — 55 Micro-Phases (P01.05)

**Projet :** Monsieur Fanyi — Plateforme de soutien scolaire en Guinée  
**Budget Global :** $500 USD (Jalon 1: $200, Jalon 2: $200, Jalon 3: $100)  
**Durée Contractuelle :** 30 jours calendaires  
**Date :** 21 Octobre 2026  

---

## 1. Vue d'Ensemble des Jalons

```mermaid
gantt
    title Calendrier d'Exécution Monsieur Fanyi (30 Jours)
    dateFormat  YYYY-MM-DD
    section Jalon 1 - Fondation ($200)
    P01 à P04 : Cadrage, Architecture, Bootstrap Next.js : 2026-10-21, 2d
    P05 à P08 : Design System, Composants, Shells & Vitrine : 2026-10-23, 3d
    P09 à P11 : Schéma BDD v1, Auth & RBAC Server-Side : 2026-10-26, 3d
    P12 à P16 : Profils Parent/Prof, Justificatifs, Review Admin & Recette M1 : 2026-10-29, 2d
    section Jalon 2 - Matching & Classes ($200)
    P17 à P23 : Catalogues, Demandes, Candidatures, Sélection, Classe : 2026-10-31, 4d
    P24 à P28 : Forfaits, Planning, Comptes-rendus, Validation séances : 2026-11-04, 3d
    P29 à P34 : Progression, Documents, Chat, Avis & Recette M2 : 2026-11-07, 3d
    section Jalon 3 - Finances & Lancement ($100)
    P35 à P40 : Modèle financier, Commandes, Adaptateur Orange/MTN, Rapprochement : 2026-11-10, 4d
    P41 à P48 : Répartition 15/85, Soldes prof, Reversements, Litiges, Tableau de bord : 2026-11-14, 4d
    P49 à P55 : Notifications, Audit sécurité, E2E, Déploiement & Recette finale : 2026-11-18, 3d
```

---

## 2. Décomposition Détaillée des 55 Phases

### Jalon 1 — Fondation (Jours 1 à 10 — Budget : 200 $)
- **P01 — Audit du dépôt et environnement :** Inventaire des actifs, vérification outillage, conformité SRD V2. *(Complété)*
- **P02 — Traçabilité des exigences :** Matrice complète de chaque exigence vers écran, API, BDD, tests. *(Complété)*
- **P03 — Architecture & décisions techniques :** Spécification des frontières, flux de données, ADRs. *(Complété)*
- **P04 — Bootstrap du projet :** Initialisation Next.js TypeScript strict, ESLint, Git, package.json.
- **P05 — Design tokens & variables CSS :** Palette de couleurs sémantiques, typographie, espacements 8px, mode sombre/clair, contraste WCAG AA.
- **P06 — Bibliothèque de composants UI réutilisables :** Boutons, inputs, sélecteurs, modales, badges, cartes, tableaux, états vides, skeletons.
- **P07 — Coquilles d'application & Navigation :** En-têtes, pieds de page, barres latérales responsives parent/professeur/admin.
- **P08 — Page d'accueil publique (Vitrine) :** Copie en français authentique, propositions de valeur, réassurance, sélecteur de langue FR/EN.
- **P09 — Schéma de base de données v1 :** Modèles Prisma pour utilisateurs, rôles, profils parents, enfants, enseignants, matières.
- **P10 — Authentification serveur :** Inscription sécurisée, connexion, déconnexion, réinitialisation de mot de passe, sessions HTTP-only.
- **P11 — Contrôle d'accès RBAC :** Middleware serveur et vérifications granulaires des permissions par rôle.
- **P12 — Gestion du profil parent & enfants :** Ajout, modification et consultation des élèves rattachés.
- **P13 — Profil enseignant :** Matières enseignées, niveaux scolaires, zone géographique, disponibilités, présentation.
- **P14 — Téléversement sécurisé de justificatifs :** Dépôt de pièce d'identité et diplômes, validation MIME, stockage protégé.
- **P15 — Console d'examen administrateur :** Validation ou rejet motivé des enseignants par l'administrateur avec traçabilité.
- **P16 — Clôture & Recette Jalon 1 :** Tests unitaires/intégration, vérification responsive mobile, rapport d'acceptation client M1.

### Jalon 2 — Matching, Cours & Suivi Pédagogique (Jours 11 à 20 — Budget : 200 $)
- **P17 — Catalogues des matières et niveaux scolaires en Guinée :** Initialisation des programmes scolaires (primaire, collège, lycée).
- **P18 — Formulaire de demande de soutien scolaire :** Enfant, matière, niveau, budget, localisation, domicile ou en ligne.
- **P19 — Cycle de vie des demandes :** Brouillon, ouverte, assignée, clôturée ; filtres et dashboard parent.
- **P20 — Place de marché des enseignants :** Affichage des demandes compatibles pour les professeurs validés uniquement.
- **P21 — Candidature des professeurs :** Postuler à une demande, lettre de motivation, prévention des doublons.
- **P22 — Sélection par le parent :** Consultation des profils candidats, acceptation d'un enseignant et clôture des autres.
- **P23 — Création de la classe (Classroom) :** Liaison parent, élève, professeur et demande validée.
- **P24 — Tarification horaire :** Taux horaire, durée, calcul du total et affichage clair.
- **P25 — Forfait mensuel & répartition unitaire :** Définition du forfait, division entière, allocation du reste arithmétique.
- **P26 — Calendrier et séances programmées :** Planification des cours, fuseau horaire de Conakry (UTC), affichage calendrier responsive.
- **P27 — Déclaration de séance par le professeur :** Compte-rendu pédagogique, notions abordées, travail à faire, présence.
- **P28 — Confirmation ou contestation parent :** Validation de la séance par le parent ou ouverture d'un litige.
- **P29 — Tableau de bord de progression élève :** Suivi chronologique des séances, assiduité et commentaires pédagogiques.
- **P30 — Partage documentaire de classe :** Exercices et devoirs (PDF/images) avec restriction d'accès aux membres de la classe.
- **P31 — Messagerie interne de classe :** Échange de messages textuels entre le parent et l'enseignant.
- **P32 — Intégration visioconférence externe :** Liens sécurisés Google Meet / Zoom pour les cours en distanciel.
- **P33 — Notation et avis des enseignants :** Évaluation par le parent après cours réalisés, contrôle anti-fraude.
- **P34 — Clôture & Recette Jalon 2 :** Tests bout-en-bout du cycle complet demande -> classe -> cours -> validation.

### Jalon 3 — Finances, Opérations & Lancement (Jours 21 à 30 — Budget : 100 $)
- **P35 — Modèle de données financier & grand livre :** Commandes, tentatives, écritures comptables, événements.
- **P36 — Commande et paiement anticipé (Pay-in) :** Création du bon de commande, blocage des droits avant encaissement.
- **P37 — Couche d'adaptation paiement (Orange Money & MTN) :** Interface abstraite, sandbox transparente, drapeaux de fonctionnalités.
- **P38 — Évaluation des API et comptes marchands :** Diagnostic des accès de production et documentation des limites réelles.
- **P39 — Réception et vérification des webhooks :** Signature, idempotence, rejet strict des rejeux.
- **P40 — Rapprochement manuel par l'administrateur :** Enregistrement comptable des paiements hors-ligne avec référence d'opérateur.
- **P41 — Calcul et allocation de la commission 15/85 :** 15 % plateforme, 85 % professeur par séance validée et financée.
- **P42 — Paramétrage dynamique de la commission :** Conservation des snapshots historiques sans rétroactivité.
- **P43 — Portefeuille et solde enseignant :** Suivi des montants acquis, en attente, et déjà reversés.
- **P44 — Enregistrement des reversements manuels (Payouts) :** Traçabilité, vérification de solde suffisant, prévention du double versement.
- **P45 — Traitement des litiges :** Arbitrage administrateur, décision motivée, gel des fonds contestés.
- **P46 — Politique d'annulation et de report :** Traçabilité des séances annulées, réallocation financière.
- **P47 — Gestion des remboursements :** Remboursement manuel tracé, ajustement du grand livre comptable.
- **P48 — Console financière de l'administrateur :** Synthèse des flux, commissions encaissées, engagements restants, exports.
- **P49 — Système de notifications in-app :** Alertes sur candidatures, approbations, séances, paiements et litiges.
- **P50 — Audit de sécurité approfondi :** Vérification IDOR, CSRF, injections, conformité des pièces jointes, secrets.
- **P51 — Revue accessibilité et responsive :** Tests de 320px à 4K, contraste WCAG AA, navigation au clavier, prefers-reduced-motion.
- **P52 — Tests end-to-end automatisés & robustesse :** Tests scénarisés sur tous les parcours utilisateurs et cas d'erreur.
- **P53 — Procédure de déploiement & production :** Configuration environnement, migrations, amorçage du compte admin sécurisé.
- **P54 — Dossier de transmission & documentation d'exploitation :** Guide de démarrage, comptes de démonstration, manuel admin.
- **P55 — Recette finale & Bilan de livraison :** Démonstration contractuelle de conformité au SRD V2.0 et clôture.
