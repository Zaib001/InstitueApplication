import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  ClassroomStatus,
  PaymentProviderName,
  PaymentIntentStatus,
  PricingOfferType,
  SessionStatus,
  PayoutStatus,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  PaymentIntentService,
  DoubleEntryLedger,
  CommissionPolicyService,
  TeacherPayoutService,
  RefundService,
  STANDARD_ACCOUNTS,
} from "@/lib/finance";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";

const prisma = new PrismaClient();

describe("Phase 17: Client-Approved Updates (Djomy, Parent 2% Fee, Weekly Payouts & Teacher Protection)", () => {
  const ts = Date.now();
  const testPassword = "PasswordClientUpdates2026!";

  let adminUser: any;
  let parentUser: any;
  let parentProfile: any;
  let teacherUser: any;
  let teacherProfile: any;
  let student: any;
  let classroom: any;
  let tutoringPackage: any;

  beforeAll(async () => {
    await DoubleEntryLedger.ensureStandardAccountsExist();
    await CommissionPolicyService.bootstrapDefaultPolicy();

    const hashedPassword = await hashPassword(testPassword);

    // 1. Admin
    adminUser = await prisma.user.create({
      data: {
        email: `admin_updates_${ts}@fanyi.test`,
        passwordHash: hashedPassword,
        fullName: "Admin Ousman Updates",
        role: UserRole.ADMIN,
      },
    });

    // 2. Parent & Profile
    parentUser = await prisma.user.create({
      data: {
        email: `parent_updates_${ts}@fanyi.test`,
        passwordHash: hashedPassword,
        fullName: "Parent Test Updates",
        role: UserRole.PARENT,
      },
    });

    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: parentUser.id,
        address: "Kipé Centre, Conakry",
        city: "Conakry",
      },
    });

    // 3. Teacher & Profile
    teacherUser = await prisma.user.create({
      data: {
        email: `teacher_updates_${ts}@fanyi.test`,
        passwordHash: hashedPassword,
        fullName: "Prof Test Updates",
        role: UserRole.TEACHER,
      },
    });

    teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        bio: "Enseignant certifié pour tests client updates",
        headline: "Professeur de Mathématiques",
        hourlyRateGnf: 100000,
        monthlyPackageRateGnf: 800000,
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });

    // 4. Student & Classroom
    student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Élève Test Updates",
        gradeLevel: "TERMINALE_SM",
      },
    });

    classroom = await prisma.classroom.create({
      data: {
        studentId: student.id,
        teacherProfileId: teacherProfile.id,
        subjectName: "Mathématiques Avancées",
        monthlyRateGnf: 800000,
        hourlyRateGnf: 100000,
        status: ClassroomStatus.PENDING_PAYMENT,
      },
    });

    tutoringPackage = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroom.id,
        pricingType: PricingOfferType.HOURLY,
        totalAmountGnf: 2000000, // 2,000,000 GNF course principal
        sessionsCount: 10,
        minutesPerSession: 120,
        baseSessionRateGnf: 200000,
        remainderGnf: 0,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 300000,
        totalTeacherShareGnf: 1700000,
        status: "PENDING_PAYMENT",
      },
    });
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    if (classroom) {
      await prisma.classroomFunding.deleteMany({ where: { classroomId: classroom.id } });
      await prisma.tutoringPackage.deleteMany({ where: { classroomId: classroom.id } });
      await prisma.classroom.deleteMany({ where: { id: classroom.id } });
    }
    if (student) await prisma.studentProfile.deleteMany({ where: { id: student.id } });
    if (parentProfile) await prisma.parentProfile.deleteMany({ where: { id: parentProfile.id } });
    if (teacherProfile) {
      await prisma.payout.deleteMany({ where: { teacherProfileId: teacherProfile.id } });
      await prisma.teacherPayoutDestination.deleteMany({ where: { teacherProfileId: teacherProfile.id } });
      await prisma.teacherProfile.deleteMany({ where: { id: teacherProfile.id } });
    }
    if (teacherUser) await prisma.user.deleteMany({ where: { id: teacherUser.id } });
    if (parentUser) await prisma.user.deleteMany({ where: { id: parentUser.id } });
    if (adminUser) await prisma.user.deleteMany({ where: { id: adminUser.id } });
  });

  // ==========================================================================
  // SECTION 1: Djomy Provider Adapter & Registry
  // ==========================================================================
  describe("1. Djomy Payment Provider Adapter", () => {
    it("is registered as the default payment provider", () => {
      const defaultProvider = PaymentProviderRegistry.getDefaultProvider();
      expect(defaultProvider).toBe(PaymentProviderName.DJOMY);

      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.DJOMY);
      expect(adapter).toBeDefined();
      expect(adapter.provider).toBe(PaymentProviderName.DJOMY);
    });

    it("advertises correct Guinea launch capabilities: Cards, OM Guinea, MTN MoMo hidden", () => {
      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.DJOMY);
      const caps = adapter.getCapabilities();

      expect(caps.supportsInternationalCards).toBe(true);
      expect(caps.supportsOrangeMoney).toBe(true);
      expect(caps.supportsMtnMomo).toBe(false); // Hidden for launch per client decision
      expect(caps.supportedChannels).toContain("CARD");
      expect(caps.supportedChannels).toContain("ORANGE_MONEY");
      expect(caps.supportedChannels).not.toContain("MTN_MOMO");
      expect(caps.supportedCurrencies).toContain("GNF");
    });

    it("creates a payment session for Djomy", async () => {
      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.DJOMY);
      const session = await adapter.createPaymentSession({
        intentReference: `pi_test_${ts}`,
        amountGnf: 1020000,
        currency: "GNF",
        customerEmail: "parent@test.com",
        customerName: "Parent Test",
        returnUrl: "http://localhost:3000/success",
        cancelUrl: "http://localhost:3000/cancel",
        selectedChannel: "ORANGE_MONEY",
      });

      expect(session).toBeDefined();
      expect(session.paymentUrl).toBeDefined();
      expect(session.providerReference).toBeDefined();
    });
  });

  // ==========================================================================
  // SECTION 2: Parent Fee Calculation & Enforcement
  // ==========================================================================
  describe("2. Parent Fee (Minimum 2%) Pure Arithmetic & Server-Side Enforcement", () => {
    it("calculates exact 2% integer fee without decimals", () => {
      const calc1 = PaymentIntentService.calculateParentFee(1000000);
      expect(calc1.courseAmountGnf).toBe(1000000);
      expect(calc1.parentFeeGnf).toBe(20000); // 2% of 1,000,000
      expect(calc1.totalAmountGnf).toBe(1020000);

      const calc2 = PaymentIntentService.calculateParentFee(800000);
      expect(calc2.courseAmountGnf).toBe(800000);
      expect(calc2.parentFeeGnf).toBe(16000); // 2% of 800,000
      expect(calc2.totalAmountGnf).toBe(816000);
    });

    it("rejects non-integer or negative course amounts", () => {
      expect(() => PaymentIntentService.calculateParentFee(-500)).toThrow();
      expect(() => PaymentIntentService.calculateParentFee(0)).toThrow();
      expect(() => PaymentIntentService.calculateParentFee(100.5)).toThrow();
    });

    it("creates payment intent with pure course principal and 2% parent fee", async () => {
      const intent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        courseAmountGnf: 2000000,
        provider: PaymentProviderName.DJOMY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `idem_parent_fee_${ts}`,
      });

      expect(intent).toBeDefined();
      expect(intent.courseAmountGnf).toBe(2000000);
      expect(intent.parentFeeGnf).toBe(40000); // 2% of 2,000,000 = 40,000 GNF
      expect(intent.amountGnf).toBe(2040000); // Total charged to parent
      expect(intent.status).toBe(PaymentIntentStatus.CREATED);
    });
  });

  // ==========================================================================
  // SECTION 3: Settlement, Classroom Funding & Double-Entry Ledger
  // ==========================================================================
  describe("3. Settlement with Parent Fee: Classroom Funding & Double-Entry Ledger", () => {
    it("funds classroom ONLY with course principal and credits parent fee to platform revenue", async () => {
      const intentRef = `pi_settle_fee_${ts}`;
      const intent = await PaymentIntentService.createPaymentIntent({
        intentReference: intentRef,
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        courseAmountGnf: 1000000,
        provider: PaymentProviderName.DJOMY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `idem_settle_${ts}`,
      });

      expect(intent.courseAmountGnf).toBe(1000000);
      expect(intent.parentFeeGnf).toBe(20000);
      expect(intent.amountGnf).toBe(1020000);

      // Confirm settlement of the full 1,020,000 GNF
      const result = await PaymentIntentService.confirmPaymentTransaction({
        intentReference: intentRef,
        providerTransactionId: `djomy_tx_${ts}`,
        settledAmountGnf: 1020000,
        currency: "GNF",
        actorId: "DJOMY_GATEWAY",
        idempotencyKey: `idem_confirm_fee_${ts}`,
      });

      expect(result.intent.status).toBe(PaymentIntentStatus.SUCCEEDED);

      // Verify ClassroomFunding receives only 1,000,000 GNF (NOT the fee!)
      const funding = await prisma.classroomFunding.findUnique({
        where: { classroomId: classroom.id },
      });
      expect(funding).toBeDefined();
      expect(funding?.availableBalanceGnf).toBe(1000000);
      expect(funding?.totalFundedAmountGnf).toBe(1000000);

      // Verify Double-Entry General Ledger Journal:
      // DEBIT:  1010_PARENT_CLEARING          = 1,020,000 GNF
      // CREDIT: 2020_CLASSROOM_FUNDS          = 1,000,000 GNF
      // CREDIT: 4020_PARENT_FEE_CONTRIBUTIONS =    20,000 GNF
      const journalEntry = await prisma.ledgerJournal.findFirst({
        where: { referenceId: result.transaction!.id },
        include: { entries: { include: { account: true } } },
      });

      expect(journalEntry).toBeDefined();

      let totalDebits = 0;
      let totalCredits = 0;
      let parentClearingDebit = 0;
      let classroomFundsCredit = 0;
      let parentFeeCredit = 0;

      for (const entry of journalEntry!.entries) {
        if (entry.direction === "DEBIT") {
          totalDebits += entry.amount;
          if (entry.account.code === STANDARD_ACCOUNTS.PARENT_CLEARING) {
            parentClearingDebit = entry.amount;
          }
        } else {
          totalCredits += entry.amount;
          if (entry.account.code === STANDARD_ACCOUNTS.CLASSROOM_FUNDS) {
            classroomFundsCredit = entry.amount;
          } else if (entry.account.code === STANDARD_ACCOUNTS.PARENT_FEE_CONTRIBUTIONS) {
            parentFeeCredit = entry.amount;
          }
        }
      }

      expect(totalDebits).toBe(1020000);
      expect(totalCredits).toBe(1020000);
      expect(totalDebits).toBe(totalCredits); // Perfectly balanced!
      expect(parentClearingDebit).toBe(1020000);
      expect(classroomFundsCredit).toBe(1000000);
      expect(parentFeeCredit).toBe(20000);
    });

    it("verifies refundable balance is strictly bounded by unconsumed course principal", async () => {
      const refundable = await RefundService.getRefundableBalance(classroom.id);
      // Available classroom balance should be 1,000,000 GNF (parent fee of 20,000 GNF is NOT refundable)
      expect(refundable.availableBalanceGnf).toBe(1000000);
      expect(refundable.netAvailableRefundableGnf).toBe(1000000);
      expect(refundable.isRefundable).toBe(true);
    });
  });

  // ==========================================================================
  // SECTION 4: Teacher Protection & Weekly Payout Batching
  // ==========================================================================
  describe("4. Teacher Payout Protection (0% Deductions) & Weekly Batch Management", () => {
    it("confirms commission policy is 15% platform and 85% teacher", async () => {
      const split = CommissionPolicyService.calculateSplit(200000, 15);
      expect(split.platformCommissionGnf).toBe(30000); // 15%
      expect(split.teacherNetGnf).toBe(170000); // 85%
      expect(split.platformCommissionGnf + split.teacherNetGnf).toBe(200000);
    });

    it("aggregates pending payouts into weekly batches grouped by teacher and operator", async () => {
      // 1. Create teacher payout destination
      await TeacherPayoutService.upsertTeacherDestination({
        teacherProfileId: teacherProfile.id,
        operator: "ORANGE_MONEY",
        phone: "+224624998877",
        accountHolderName: "Prof Test Updates",
        isDefault: true,
      });

      // 2. Insert mock eligible earnings
      const scheduledStart = new Date();
      const mockSession = await prisma.lessonSession.create({
        data: {
          classroomId: classroom.id,
          packageId: tutoringPackage.id,
          scheduledStart,
          scheduledEnd: new Date(scheduledStart.getTime() + 120 * 60 * 1000),
          durationMinutes: 120,
          status: SessionStatus.PARENT_APPROVED,
          isFunded: true,
          earningsStatus: "ELIGIBLE",
        },
      });

      await prisma.teacherEarning.create({
        data: {
          sessionId: mockSession.id,
          teacherProfileId: teacherProfile.id,
          grossAmountGnf: 200000,
          commissionRatePercent: 15,
          platformCommissionGnf: 30000,
          teacherNetGnf: 170000, // Contracted 85%
          isPaidOut: false,
        },
      });

      // 3. Request payout
      const payout = await TeacherPayoutService.requestPayout({
        teacherProfileId: teacherProfile.id,
        amountGnf: 170000,
        channel: "ORANGE_MONEY",
        beneficiaryName: "Prof Test Updates",
        beneficiaryPhone: "+224624998877",
        requestedByUserId: teacherUser.id,
      });

      expect(payout.amountGnf).toBe(170000); // Exact 85% net earnings
      expect(payout.status).toBe(PayoutStatus.REQUESTED);

      // 4. Retrieve weekly payout batches
      const batches = await TeacherPayoutService.getWeeklyPayoutBatches();
      expect(batches).toBeDefined();
      expect(batches.length).toBeGreaterThan(0);

      const teacherBatch = batches.find((b) => b.teacherProfileId === teacherProfile.id);
      expect(teacherBatch).toBeDefined();
      expect(teacherBatch?.channel).toBe("ORANGE_MONEY");
      expect(teacherBatch?.totalAmountGnf).toBe(170000);
      expect(teacherBatch?.payoutIds).toContain(payout.id);

      // 5. Execute weekly batch with telecom reference
      await TeacherPayoutService.approvePayout(payout.id, adminUser.id);
      const batchExecution = await TeacherPayoutService.executeWeeklyBatch({
        payoutIds: [payout.id],
        batchReference: `OM_BATCH_W47_${ts}`,
        adminUserId: adminUser.id,
      });

      expect(batchExecution.settledCount).toBe(1);

      // Verify payout transitions to RECONCILIATION_PENDING (unverified evidence)
      const pendingPayout = await prisma.payout.findUnique({ where: { id: payout.id } });
      expect(pendingPayout?.status).toBe(PayoutStatus.RECONCILIATION_PENDING);

      // 6. Independent reconciliation completes final settlement and liability clearance
      const reconciledPayout = await TeacherPayoutService.reconcilePayout(payout.id, adminUser.id);
      expect(reconciledPayout.status).toBe(PayoutStatus.RECONCILED);
      expect(reconciledPayout.amountGnf).toBe(170000); // Teacher receives all 170,000 GNF!

      // Cleanup mock session
      await prisma.teacherEarning.deleteMany({ where: { sessionId: mockSession.id } });
      await prisma.lessonSession.deleteMany({ where: { id: mockSession.id } });
    });
  });
});
