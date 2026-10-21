import { describe, it, expect } from "vitest";
import {
  allocatePackageSessions,
  calculateSessionCommission,
  reconcilePackageProgress,
} from "../../src/lib/money/currency";

describe("Moteur Financier GNF — Monsieur Fanyi (SRD V2.0)", () => {
  it("alloue un forfait divisible équitablement (400 000 GNF / 8 séances)", () => {
    const allocation = allocatePackageSessions(400000, 8);

    expect(allocation.totalAmountGnf).toBe(400000);
    expect(allocation.sessionsCount).toBe(8);
    expect(allocation.baseUnitAmountGnf).toBe(50000);
    expect(allocation.remainderGnf).toBe(0);
    expect(allocation.sessionAmountsGnf).toEqual([
      50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000,
    ]);

    const sum = allocation.sessionAmountsGnf.reduce((a, b) => a + b, 0);
    expect(sum).toBe(400000);
  });

  it("alloue un forfait non divisible avec réconciliation exacte du reste (100 000 GNF / 3 séances)", () => {
    const allocation = allocatePackageSessions(100000, 3);

    expect(allocation.baseUnitAmountGnf).toBe(33333);
    expect(allocation.remainderGnf).toBe(1);
    // La 1ère séance reçoit 33334, les deux suivantes 33333
    expect(allocation.sessionAmountsGnf).toEqual([33334, 33333, 33333]);

    const sum = allocation.sessionAmountsGnf.reduce((a, b) => a + b, 0);
    expect(sum).toBe(100000);
  });

  it("calcule la commission de 15 % plateforme et 85 % professeur sur 50 000 GNF", () => {
    const breakdown = calculateSessionCommission(50000, 15);

    expect(breakdown.grossGnf).toBe(50000);
    expect(breakdown.commissionRatePercent).toBe(15);
    expect(breakdown.platformCommissionGnf).toBe(7500); // 15% de 50 000
    expect(breakdown.teacherNetGnf).toBe(42500); // 85% de 50 000
    expect(breakdown.platformCommissionGnf + breakdown.teacherNetGnf).toBe(50000);
  });

  it("valide l'exemple contractuel du SRD V2.0 : 3 séances validées sur forfait 400 000 GNF / 8 séances", () => {
    const reconciliation = reconcilePackageProgress(400000, 8, 3, 15);

    // 3 séances à 50 000 GNF = 150 000 GNF brut acquis
    expect(reconciliation.grossEarnedGnf).toBe(150000);

    // 15 % de 150 000 GNF = 22 500 GNF commission plateforme
    expect(reconciliation.totalPlatformCommissionGnf).toBe(22500);

    // 85 % de 150 000 GNF = 127 500 GNF dû au professeur
    expect(reconciliation.totalTeacherPayableGnf).toBe(127500);

    // 5 séances non validées = 250 000 GNF restent non acquis et non reversables
    expect(reconciliation.unearnedGnf).toBe(250000);

    // Réconciliation totale parfaite
    expect(reconciliation.isFullyReconciled).toBe(true);
    expect(reconciliation.grossEarnedGnf + reconciliation.unearnedGnf).toBe(400000);
  });

  it("rejette les montants flottants ou négatifs", () => {
    expect(() => allocatePackageSessions(400000.5, 8)).toThrow();
    expect(() => allocatePackageSessions(-50000, 5)).toThrow();
    expect(() => allocatePackageSessions(400000, 0)).toThrow();
    expect(() => calculateSessionCommission(50000.75, 15)).toThrow();
  });
});
