/**
 * Moteur Financier Strict en Franc Guinéen (GNF) — Monsieur Fanyi
 * Conforme au SRD V2.0 :
 * - Calculs en entiers stricts (Zéro virgule flottante)
 * - Règle de commission par défaut : 15 % Plateforme / 85 % Enseignant
 * - Allocation exacte des forfaits mensuels avec réconciliation du reste arithmétique
 */

export interface PackageAllocation {
  totalAmountGnf: number;
  sessionsCount: number;
  sessionAmountsGnf: number[];
  baseUnitAmountGnf: number;
  remainderGnf: number;
}

export interface SessionCommissionBreakdown {
  grossGnf: number;
  commissionRatePercent: number;
  platformCommissionGnf: number;
  teacherNetGnf: number;
}

export interface PackageProgressReconciliation {
  packageTotalGnf: number;
  totalSessions: number;
  approvedSessionsCount: number;
  grossEarnedGnf: number;
  totalPlatformCommissionGnf: number;
  totalTeacherPayableGnf: number;
  unearnedGnf: number;
  isFullyReconciled: boolean;
}

/**
 * Calcule le prix d'une séance au tarif horaire au prorata de sa durée en minutes.
 * Conforme au SRD V2.0 : calcul entier en GNF.
 * Exemple : 50 000 GNF / heure pour 90 minutes = 75 000 GNF.
 */
export function calculateHourlySessionPrice(
  hourlyRateGnf: number,
  durationMinutes: number
): number {
  if (!Number.isInteger(hourlyRateGnf) || hourlyRateGnf <= 0) {
    throw new Error("Le tarif horaire doit être un entier positif en GNF.");
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("La durée de la séance doit être un entier positif en minutes.");
  }

  return Math.round((hourlyRateGnf * durationMinutes) / 60);
}

/**
 * Alloue le montant total d'un forfait mensuel sur N séances avec division entière
 * et distribution déterministe du reste arithmétique sur les premières séances
 * afin que la somme soit STRICTEMENT égale au total.
 */
export function allocatePackageSessions(
  totalAmountGnf: number,
  sessionsCount: number
): PackageAllocation {
  if (!Number.isInteger(totalAmountGnf) || totalAmountGnf <= 0) {
    throw new Error("Le montant total du forfait doit être un entier positif en GNF.");
  }
  if (!Number.isInteger(sessionsCount) || sessionsCount <= 0) {
    throw new Error("Le nombre de séances doit être un entier supérieur à zéro.");
  }

  const baseUnitAmountGnf = Math.floor(totalAmountGnf / sessionsCount);
  const remainderGnf = totalAmountGnf % sessionsCount;

  const sessionAmountsGnf: number[] = [];
  for (let i = 0; i < sessionsCount; i++) {
    // Les premières `remainderGnf` séances reçoivent +1 GNF pour absorber le reste
    const allocated = i < remainderGnf ? baseUnitAmountGnf + 1 : baseUnitAmountGnf;
    sessionAmountsGnf.push(allocated);
  }

  // Vérification d'invariant arithmétique absolu
  const sum = sessionAmountsGnf.reduce((acc, curr) => acc + curr, 0);
  if (sum !== totalAmountGnf) {
    throw new Error(
      `Échec d'invariant financier : La somme allouée (${sum} GNF) ne correspond pas au total (${totalAmountGnf} GNF).`
    );
  }

  return {
    totalAmountGnf,
    sessionsCount,
    sessionAmountsGnf,
    baseUnitAmountGnf,
    remainderGnf,
  };
}

/**
 * Calcule la décomposition financière d'une séance unitaire selon le taux de commission.
 * Par défaut : 15 % plateforme / 85 % enseignant.
 * Utilise la division entière et attribue l'ajustement arithmétique au net professeur
 * pour garantir que gross = platformCommission + teacherNet.
 */
export function calculateSessionCommission(
  grossAmountGnf: number,
  commissionRatePercent: number = 15
): SessionCommissionBreakdown {
  if (!Number.isInteger(grossAmountGnf) || grossAmountGnf <= 0) {
    throw new Error("Le montant brut de la séance doit être un entier positif en GNF.");
  }
  if (commissionRatePercent < 0 || commissionRatePercent > 100) {
    throw new Error("Le taux de commission doit être compris entre 0 et 100 %.");
  }

  // Commission plateforme arrondie à l'entier le plus proche
  const platformCommissionGnf = Math.round((grossAmountGnf * commissionRatePercent) / 100);
  // Le montant net du professeur absorbe l'ajustement arithmétique exact
  const teacherNetGnf = grossAmountGnf - platformCommissionGnf;

  if (platformCommissionGnf + teacherNetGnf !== grossAmountGnf) {
    throw new Error("Échec d'intégrité : commission + part enseignant != brut.");
  }

  return {
    grossGnf: grossAmountGnf,
    commissionRatePercent,
    platformCommissionGnf,
    teacherNetGnf,
  };
}

/**
 * Réconcilie la progression d'un forfait :
 * - Montants acquis (brut, commission 15 %, net enseignant 85 %)
 * - Montants non acquis / non reversables (reste à réaliser ou non validé)
 */
export function reconcilePackageProgress(
  packageTotalGnf: number,
  totalSessions: number,
  approvedSessionsCount: number,
  commissionRatePercent: number = 15
): PackageProgressReconciliation {
  if (approvedSessionsCount < 0 || approvedSessionsCount > totalSessions) {
    throw new Error("Le nombre de séances approuvées est invalide.");
  }

  const allocation = allocatePackageSessions(packageTotalGnf, totalSessions);

  let grossEarnedGnf = 0;
  let totalPlatformCommissionGnf = 0;
  let totalTeacherPayableGnf = 0;

  for (let i = 0; i < approvedSessionsCount; i++) {
    const sessionGross = allocation.sessionAmountsGnf[i];
    const breakdown = calculateSessionCommission(sessionGross, commissionRatePercent);
    grossEarnedGnf += breakdown.grossGnf;
    totalPlatformCommissionGnf += breakdown.platformCommissionGnf;
    totalTeacherPayableGnf += breakdown.teacherNetGnf;
  }

  const unearnedGnf = packageTotalGnf - grossEarnedGnf;

  const isFullyReconciled = grossEarnedGnf + unearnedGnf === packageTotalGnf;

  return {
    packageTotalGnf,
    totalSessions,
    approvedSessionsCount,
    grossEarnedGnf,
    totalPlatformCommissionGnf,
    totalTeacherPayableGnf,
    unearnedGnf,
    isFullyReconciled,
  };
}
