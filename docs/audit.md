# Rapport d'Audit Initial du Dépôt et de l'Environnement (P01.01)

**Projet :** Monsieur Fanyi — Plateforme de soutien scolaire en Guinée  
**Date :** 21 Octobre 2026  
**Auteur :** Lead Architect & Principal Full-Stack Engineer  
**Statut :** Complété  

---

## 1. Inventaire du Dépôt et des Actifs Existants

- **Répertoire de travail :** `d:/Instructor`
- **Contenu initial :** Répertoire vide. Aucun code patrimonial, artefact ou fichier tiers présent.
- **Dépôt Git :** Initialisé (`git init`) en local avec la branche par défaut.
- **Actifs existants :** Aucune ressource graphique ou maquette pré-existante en local. Les spécifications de référence reposent intégralement sur le document contractuel validé **SRD V2.0 (Spécifications des exigences logicielles - 17 octobre 2026)**.

---

## 2. Environnement Système et Exécutables

| Outil | Version détectée | Statut | Commentaire |
| :--- | :--- | :--- | :--- |
| **Système d'exploitation** | Windows 10/11 (Architecture x64) | Conforme | Shell PowerShell actif |
| **Node.js** | `v24.14.0` | Conforme | Environnement runtime moderne compatible ES2023+ |
| **npm** | `11.9.0` | Conforme | Gestionnaire de paquets officiel |
| **Git** | `2.53.0.windows.2` | Conforme | Suivi de versions et traçabilité |

---

## 3. Cadre Réglementaire et Hypothèses Financières en Guinée (GNF)

1. **Devise nationale :** Franc Guinéen (GNF).
   - Le GNF ne possède pas de sous-unité divisionnaire usuelle (pas de centimes en pratique). Tous les calculs s'effectuent en entiers stricts (`integers`), sans aucun usage de virgule flottante (`float`).
2. **Fournisseurs de Paiement Mobile :** Orange Money Guinée et MTN Mobile Money Guinée.
   - *Statut réel :* L'intégration en direct de ces opérateurs requiert des comptes marchands validés, des contrats d'agrégateur ou d'opérateur, des clés API de production et des webhooks configurés.
   - *Règle contractuelle :* Aucune simulation fallacieuse de paiement réel ne sera présentée. Une couche d'adaptation découplée (`PaymentAdapter`) avec mode démonstration/sandbox clairement libellé et console de saisie/rapprochement manuel pour l'administrateur sera fournie.
3. **Règle de Commission Monsieur Fanyi :**
   - **15 %** pour la plateforme Monsieur Fanyi.
   - **85 %** pour le professeur.
   - Fixation immuable du taux de commission au moment précis de l'approbation de la séance (`snapshot`). Tout changement ultérieur de commission n'affecte que les futures approbations.

---

## 4. Politique d'Intégrité et de Non-Destruction

- Aucune suppression aveugle de fichiers.
- Aucune fuite d'informations secrètes dans Git (`.gitignore` strict).
- Préservation rigoureuse de la traçabilité des décisions et respect scrupuleux du budget imparti ($500 sur 30 jours, découpé en 3 jalons : $200 / $200 / $100).
