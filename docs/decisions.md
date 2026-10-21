# Registre des Décisions Architecturales, Hypothèses et Points à Confirmer (P01.04)

**Projet :** Monsieur Fanyi — Plateforme de soutien scolaire en Guinée  
**Document :** Registre formel d'architecture et de gouvernance (ADR)  
**Date :** 21 Octobre 2026  

---

## 1. Décisions d'Architecture Validées (Non négociables)

1. **Règle de Commission Contractuelle :**
   - La commission contractuelle est fixée à **15 % pour la plateforme Monsieur Fanyi** et **85 % pour le professeur** (conformément au SRD V2.0 qui annule et remplace le taux de 20 % du V1).
   - Le taux appliqué est figé par un instantané cryptographique/comptable (`rateSnapshot`) au moment de la validation de chaque séance. Une modification ultérieure du taux par l'administrateur n'impacte que les séances futures.

2. **Unité Monétaire et Arithmétique Entière Stricte (GNF) :**
   - Devise : Franc Guinéen (`GNF`).
   - Interdiction totale des nombres à virgule flottante (`float`/`double`) pour toutes les opérations financières.
   - Les montants sont stockés en entiers stricts (`Int` ou `BigInt`).
   - L'allocation par séance d'un forfait mensuel s'effectue par division entière (`quotient = Math.floor(total / N)`), et le reste arithmétique (`remainder = total % N`) est imputé de façon déterministe sur les premières ou la dernière séance afin que la somme des séances soit rigoureusement égale au total du forfait à l'unité près.

3. **Invariants Financiers et Conditions de Reversement :**
   - Un paiement anticipé du parent est obligatoire.
   - Une séance programmée ou même marquée « effectuée » par le professeur ne génère **aucun droit financier exigible**.
   - Seule une séance **effectivement confirmée par le parent** (ou validée après arbitrage d'un litige par l'administrateur) génère une écriture de gain (`TeacherEarning`).
   - Les reversements aux professeurs sont manuels dans le MVP, enregistrés par l'administrateur avec référence unique pour prévenir formellement tout double paiement.

4. **Périmètre Mobile Money (Orange Money & MTN Guinée) :**
   - Les paiements réels en direct dépendent de l'octroi des accès marchands, des contrats d'agrégation et de la validation des webhooks de production par les opérateurs en Guinée.
   - En l'absence de ces accès certifiés, la plateforme expose une architecture d'adaptateurs découplée (`PaymentAdapter`) avec un mode démonstration/sandbox explicitement étiqueté et une console de rapprochement manuel par l'administrateur. Aucune transaction simulée ne sera présentée comme un paiement réel.

5. **Localisation et Langue :**
   - Interface par défaut en français standard avec adaptation aux conventions guinéennes (fr-GN, UTC/GMT, format monétaire GNF : ex. `400 000 GNF`).
   - Sélecteur de langue Français / Anglais réactif accessible sur mobile et desktop.
   - 100 % des textes, labels, erreurs et notifications sont centralisés dans le dictionnaire i18n.

6. **Stack Technique Retenue :**
   - Framework : **Next.js (App Router)** avec TypeScript en mode strict.
   - Base de données : **PostgreSQL** via **Prisma ORM**.
   - Authentification : Sessions serveur sécurisées, hachage bcrypt / argon2, contrôle d'accès RBAC strict côté serveur.
   - Design System : Tailwind CSS avec palette de tokens sémantiques (Navy `#14253D`, Bleu académique `#2563EB`, Sarcelle/Teal `#0F9D92`, Blanc chaud `#F8FAFC`, Charbon `#1F2937`, Or discret `#E9B44C`).

---

## 2. Hypothèses Techniques et Métier du MVP

1. **Rôle Élève (Student) :**
   - Les profils d'élèves sont créés et supervisés par le parent. L'accès direct de l'élève par login séparé reste optionnel et subordonné à la confirmation formelle du client.
2. **Visioconférence :**
   - Aucune visioconférence lourde n'est hébergée ou développée en natif dans l'application. Pour les cours à distance, un champ d'URL externe sécurisée (ex: Google Meet, Zoom, Microsoft Teams) est fourni.
3. **Plafonds de Stockage de Documents :**
   - Fichiers autorisés : PDF, PNG, JPEG. Taille maximale fixée à 5 Mo par document. Stockage sécurisé avec contrôle d'accès nominatif.
4. **Fuseau Horaire :**
   - Guinée : heure universelle coordonnée (`UTC` / `GMT+0`), sans changement d'heure saisonnier.

---

## 3. Questions de Clarification Bloquantes pour le Client

*Note : Ces questions sont synthétisées en un seul lot ordonné pour arbitrage opérationnel sans bloquer le socle d'ingénierie.*

1. **Agrégateur / Comptes Marchands Orange & MTN :**
   - *Question :* Disposez-vous déjà d'un compte marchand direct auprès d'Orange Guinée et MTN Guinée, ou envisagez-vous de passer par un agrégateur de paiement sous-régional (ex: PayDunya, TouchPay/Guinée, CinetPay, Bizao, etc.) ?
   - *Impact :* Conditionne le format précis des webhooks et le protocole d'authentification des requêtes de paiement.
2. **Délai de Forclusion pour la Confirmation Parent :**
   - *Question :* Combien de jours le parent a-t-il pour confirmer ou contester une séance après le rapport du professeur avant qu'elle ne soit automatiquement validée (par exemple 48 heures, 72 heures ou pas de validation automatique) ?
   - *Impact :* Déclenchement automatique des gains ou maintien en attente indéfinie.
3. **Politique d'Annulation et de Frais :**
   - *Question :* En cas d'annulation tardive d'une séance par le parent (ex: moins de 2 heures avant le cours), le professeur est-il partiellement indemnisé ou la séance est-elle simplement reportée ?
   - *Impact :* Règles de calcul dans le module d'annulation/report.
4. **Accès Élève :**
   - *Question :* Souhaitez-vous que l'élève dispose d'un identifiant de connexion dédié dès le MVP pour consulter ses devoirs et son planning, ou l'accès exclusif par le compte parent suffit-il pour le Jalon 1 ?
   - *Recommandation d'ingénierie :* Conserver le contrôle parental exclusif pour le MVP Jalon 1 afin de garantir la sécurité et la conformité RGPD/protection des mineurs.
