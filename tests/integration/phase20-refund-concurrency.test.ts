/**
 * MONSIEUR FANYI — PHASE 20 INTEGRATION TESTS (M3.06)
 * Real Concurrent Database-Backed Concurrency & Refund Integrity Tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { RefundService } from "@/lib/finance/refund-service";
import { DoubleEntryLedger } from "@/lib/finance/double-entry-ledger";
import {
  ClassroomFundingStatus,
  LedgerEntryDirection,
  STANDARD_ACCOUNTS,
  JournalReferenceType,
} from "@/lib/finance/types";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

describe("Phase 20: Real Database-Backed Concurrency & Refund Lifecycle Tests (M3.06)", () => {
  const runId = Date.now();
  let parentUser: any;
  let teacherUser: any;
  let classroom: any;
  let funding: any;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // 1. Create Parent
    parentUser = await prisma.user.create({
      data: {
        email: `parent.p20.${runId}@monsieurfanyi.gn`,
        fullName: "Parent Test Concurrence",
        role: UserRole.PARENT,
        passwordHash,
        phoneNumber: `+224624${Math.floor(100000 + Math.random() * 900000)}`,
        parentProfile: { create: {} },
      },
      include: { parentProfile: true },
    });

    // 2. Create Teacher
    teacherUser = await prisma.user.create({
      data: {
        email: `teacher.p20.${runId}@monsieurfanyi.gn`,
        fullName: "Prof Test Concurrence",
        role: UserRole.TEACHER,
        passwordHash,
        phoneNumber: `+224621${Math.floor(100000 + Math.random() * 900000)}`,
        teacherProfile: {
          create: {
            verificationStatus: "APPROVED",
            headline: "Professeur de Mathématiques",
          },
        },
      },
      include: { teacherProfile: true },
    });

    // 3. Create Student
    const student = await prisma.studentProfile.create({
      data: {
        parentId: parentUser.parentProfile.id,
        fullName: "Élève Test Concurrence",
        gradeLevel: "COLLEGE",
      },
    });

    // 4. Create Classroom
    classroom = await prisma.classroom.create({
      data: {
        studentId: student.id,
        teacherProfileId: teacherUser.teacherProfile.id,
        subjectName: "Mathématiques",
        hourlyRateGnf: 100000,
        status: "ACTIVE",
      },
    });

    // 5. Fund Classroom with 200,000 GNF
    funding = await prisma.classroomFunding.create({
      data: {
        classroomId: classroom.id,
        parentUserId: parentUser.id,
        availableBalanceGnf: 200000,
        allocatedAmountGnf: 0,
        refundedAmountGnf: 0,
        totalFundedAmountGnf: 200000,
        status: ClassroomFundingStatus.FUNDED,
        fundedAt: new Date(),
      },
    });

    // 6. Post initial funding ledger journal
    await DoubleEntryLedger.postJournalEntry({
      referenceType: JournalReferenceType.CLASSROOM_PREPAYMENT_FUNDING,
      referenceId: funding.id,
      description: "Approvisionnement initial classe test 200 000 GNF",
      postedBy: parentUser.id,
      currency: "GNF",
      lines: [
        {
          accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
          direction: LedgerEntryDirection.DEBIT,
          amountGnf: 200000,
        },
        {
          accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
          direction: LedgerEntryDirection.CREDIT,
          amountGnf: 200000,
        },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup
    if (classroom) {
      await prisma.refundCase.deleteMany({ where: { classroomId: classroom.id } });
      await prisma.classroomFunding.deleteMany({ where: { classroomId: classroom.id } });
      await prisma.classroom.deleteMany({ where: { id: classroom.id } });
    }
  });

  // ============================================================================
  // TEST 1: REAL CONCURRENT REFUND REQUESTS
  // ============================================================================
  it("Scenario 1: Two simultaneous concurrent refund requests cannot double-reserve the same funds", async () => {
    // Both requests attempt to request 150,000 GNF concurrently via Promise.allSettled
    const [res1, res2] = await Promise.allSettled([
      RefundService.requestParentRefund({
        classroomId: classroom.id,
        parentUserId: parentUser.id,
        amountGnf: 150000,
        reason: "Concurrent Request 1",
      }),
      RefundService.requestParentRefund({
        classroomId: classroom.id,
        parentUserId: parentUser.id,
        amountGnf: 150000,
        reason: "Concurrent Request 2",
      }),
    ]);

    // Exactly one should succeed, and one should fail
    const succeeded = [res1, res2].filter((r) => r.status === "fulfilled");
    const failed = [res1, res2].filter((r) => r.status === "rejected");

    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);

    // Verify database state: only 1 RefundCase was created
    const activeCases = await prisma.refundCase.findMany({
      where: { classroomId: classroom.id, status: "REQUESTED" },
    });
    expect(activeCases.length).toBe(1);
    expect(activeCases[0].requestedAmountGnf).toBe(150000);

    // Authoritative net refundable balance is now 50,000 GNF (200k - 150k reserved)
    const balanceCheck = await RefundService.getRefundableBalance(classroom.id);
    expect(balanceCheck.availableBalanceGnf).toBe(200000);
    expect(balanceCheck.reservedRefundAmountGnf).toBe(150000);
    expect(balanceCheck.netAvailableRefundableGnf).toBe(50000);
  });

  // ============================================================================
  // TEST 2: ATTEMPT TO REQUEST MORE THAN NET AVAILABLE RESERVED BALANCE
  // ============================================================================
  it("Scenario 2: An open reservation blocks a second request that exceeds the net unreserved balance", async () => {
    // 150,000 GNF is reserved. Requesting another 60,000 GNF (total 210,000 > 200,000) must fail
    await expect(
      RefundService.requestParentRefund({
        classroomId: classroom.id,
        parentUserId: parentUser.id,
        amountGnf: 60000,
        reason: "Excessive Request",
      })
    ).rejects.toThrowError(/excède le solde disponible remboursable|déjà en cours d'examen/i);
  });

  // ============================================================================
  // TEST 3: REJECTING / CANCELLING SAFELY RELEASES RESERVATION
  // ============================================================================
  it("Scenario 3: Rejecting or cancelling a refund safely releases the reservation back to uncommitted pool", async () => {
    const activeCase = await prisma.refundCase.findFirst({
      where: { classroomId: classroom.id, status: "REQUESTED" },
    });
    expect(activeCase).toBeDefined();

    // Cancel the case
    const cancelled = await RefundService.rejectOrCancelRefund({
      refundCaseId: activeCase!.id,
      actorUserId: parentUser.id,
      reason: "Annulation par le parent - cours maintenus",
      actorRole: "PARENT",
    });

    expect(cancelled.status).toBe("REJECTED");

    // Check balance: reserved amount returns to 0, net available returns to 200,000 GNF
    const balanceCheck = await RefundService.getRefundableBalance(classroom.id);
    expect(balanceCheck.reservedRefundAmountGnf).toBe(0);
    expect(balanceCheck.netAvailableRefundableGnf).toBe(200000);
    expect(balanceCheck.isRefundable).toBe(true);
  });

  // ============================================================================
  // TEST 4: COMPLETED REFUNDS CANNOT BE PROCESSED TWICE
  // ============================================================================
  it("Scenario 4: Completed refund cannot be processed twice (idempotency & replay protection)", async () => {
    // Create and approve a new refund request for 80,000 GNF
    const newCase = await RefundService.requestParentRefund({
      classroomId: classroom.id,
      parentUserId: parentUser.id,
      amountGnf: 80000,
      reason: "Remboursement partiel validé",
    });

    const approved = await RefundService.approveRefund({
      refundCaseId: newCase.id,
      adminId: parentUser.id,
      approvedAmountGnf: 80000,
      notes: "Approuvé par admin",
    });
    expect(approved.status).toBe("APPROVED");

    // First execution: succeeds
    const execution1 = await RefundService.processClassroomRefund({
      classroomId: classroom.id,
      refundAmountGnf: 80000,
      reason: "Virement mobile money exécuté",
      adminId: parentUser.id,
      refundCaseId: newCase.id,
    });

    expect(execution1.refundCase.status).toBe("PROCESSED");
    expect(execution1.funding.availableBalanceGnf).toBe(120000);
    expect(execution1.funding.refundedAmountGnf).toBe(80000);

    // Second execution with same refundCaseId: MUST THROW
    await expect(
      RefundService.processClassroomRefund({
        classroomId: classroom.id,
        refundAmountGnf: 80000,
        reason: "Tentative de second virement frauduleux",
        adminId: parentUser.id,
        refundCaseId: newCase.id,
      })
    ).rejects.toThrowError(/déjà été traité et réglé/i);

    // Balance remains 120,000 GNF, never 40,000 GNF
    const fundingAfter = await prisma.classroomFunding.findUnique({ where: { classroomId: classroom.id } });
    expect(fundingAfter?.availableBalanceGnf).toBe(120000);
    expect(fundingAfter?.refundedAmountGnf).toBe(80000);
  });

  // ============================================================================
  // TEST 5: DOUBLE-ENTRY GENERAL LEDGER EQUALITY
  // ============================================================================
  it("Scenario 5: Double-entry general ledger remains balanced (sum of debits equals credits)", async () => {
    const trialBalance = await DoubleEntryLedger.getTrialBalance();
    expect(trialBalance.differenceGnf).toBe(0);
    expect(trialBalance.isBalanced).toBe(true);
  });
});
