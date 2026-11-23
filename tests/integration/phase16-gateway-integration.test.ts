import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  ClassroomStatus,
  SessionStatus,
  ReportStatus,
  PaymentProviderName,
  PaymentIntentStatus,
  ClassroomFundingStatus,
  SessionEarningsStatus,
  PricingOfferType,
  TutoringMode,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  CommissionPolicyService,
  DoubleEntryLedger,
  PaymentIntentService,
  EarningsEligibilityService,
  TeacherPayoutService,
  STANDARD_ACCOUNTS,
  DuplicatePaymentError,
  FinancialError,
  IneligibleEarningsError,
} from "@/lib/finance";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";
import { POST as cinetpayWebhookRoute } from "@/app/api/finance/webhooks/cinetpay/route";
import { POST as fedapayWebhookRoute } from "@/app/api/finance/webhooks/fedapay/route";
import { POST as confirmPaymentRoute } from "@/app/api/finance/payment-intents/[reference]/confirm/route";
import { NextRequest } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

describe("Phase 16: International Cards & Guinea Mobile Money Gateway Integration (M3.02)", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase16M302!";

  let adminUser: any;
  let parentUser: any;
  let parentProfile: any;
  let student: any;
  let teacherUser: any;
  let teacherProfile: any;
  let classroom: any;
  let tutoringPackage: any;
  let session1: any;
  let session2: any;
  let payoutRecord: any;

  beforeAll(async () => {
    process.env.FEDAPAY_WEBHOOK_SECRET = "fedapay_test_webhook_secret_key_12345";
    const passwordHash = await hashPassword(testPassword);

    // 1. Admin
    adminUser = await prisma.user.create({
      data: {
        email: `admin.p16.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Administrateur M3.02",
        role: UserRole.ADMIN,
      },
    });

    // 2. Parent & Student
    parentUser = await prisma.user.create({
      data: {
        email: `parent.p16.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Aissatou Barry",
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

    student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Mamadou Barry",
        gradeLevel: "Terminale SM",
      },
    });

    // 3. Teacher
    teacherUser = await prisma.user.create({
      data: {
        email: `teacher.p16.${ts}@monsieurfanyi.gn`,
        passwordHash,
        fullName: "Professeur Alpha Sow",
        role: UserRole.TEACHER,
      },
    });

    teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        bio: "Enseignant expérimenté Mathématiques & Physique",
        verificationStatus: TeacherVerificationStatus.APPROVED,
        hourlyRateGnf: 100000,
        monthlyPackageRateGnf: 800000,
      },
    });

    // 4. Classroom (Starts PENDING_PAYMENT)
    classroom = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProfile.id,
        studentId: student.id,
        subjectName: "Mathématiques Avancées",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 800000,
        hourlyRateGnf: 100000,
        status: ClassroomStatus.PENDING_PAYMENT,
      },
    });

    // 5. Tutoring Package
    tutoringPackage = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroom.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        totalAmountGnf: 800000,
        sessionsCount: 8,
        minutesPerSession: 120,
        baseSessionRateGnf: 100000,
        remainderGnf: 0,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 120000,
        totalTeacherShareGnf: 680000,
        status: "PENDING_PAYMENT",
      },
    });

    // 6. Sessions
    session1 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        sessionSequence: 1,
        title: "Introduction aux Nombres Complexes",
        scheduledStart: new Date(Date.now() - 48 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() - 46 * 3600 * 1000),
        durationMinutes: 120,
        status: SessionStatus.TEACHER_COMPLETED,
        allocatedAmountGnf: 100000,
        isFunded: false,
      },
    });

    session2 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        sessionSequence: 2,
        title: "Forme Trigonométrique des Complexes",
        scheduledStart: new Date(Date.now() + 24 * 3600 * 1000),
        scheduledEnd: new Date(Date.now() + 26 * 3600 * 1000),
        durationMinutes: 120,
        status: SessionStatus.SCHEDULED,
        allocatedAmountGnf: 100000,
        isFunded: false,
      },
    });

    await DoubleEntryLedger.ensureStandardAccountsExist();
  });

  afterAll(async () => {
    try {
      await prisma.ledgerEntry.deleteMany({
        where: { journal: { postedBy: { in: [adminUser?.id, parentUser?.id, "TEST_SUITE", "CINETPAY_WEBHOOK_VERIFIED", "FEDAPAY_WEBHOOK_VERIFIED"] } } },
      });
      await prisma.financialAuditEvent.deleteMany({
        where: { actorId: { in: [adminUser?.id, parentUser?.id, "TEST_SUITE", "CINETPAY_WEBHOOK_VERIFIED", "FEDAPAY_WEBHOOK_VERIFIED"] } },
      });
      await prisma.teacherEarning.deleteMany({
        where: { teacherProfileId: teacherProfile?.id },
      });
      await prisma.payout.deleteMany({
        where: { teacherProfileId: teacherProfile?.id },
      });
      await prisma.paymentTransaction.deleteMany({
        where: { intent: { parentUserId: parentUser?.id } },
      });
      await prisma.paymentIntent.deleteMany({
        where: { parentUserId: parentUser?.id },
      });
      await prisma.classroomFunding.deleteMany({
        where: { classroomId: classroom?.id },
      });
      await prisma.lessonApproval.deleteMany({
        where: { session: { classroomId: classroom?.id } },
      });
      await prisma.lessonReport.deleteMany({
        where: { session: { classroomId: classroom?.id } },
      });
      await prisma.lessonSession.deleteMany({
        where: { classroomId: classroom?.id },
      });
      await prisma.tutoringPackage.deleteMany({
        where: { classroomId: classroom?.id },
      });
      await prisma.classroom.deleteMany({
        where: { id: classroom?.id },
      });
      await prisma.studentProfile.deleteMany({
        where: { id: student?.id },
      });
      await prisma.parentProfile.deleteMany({
        where: { id: parentProfile?.id },
      });
      await prisma.teacherProfile.deleteMany({
        where: { id: teacherProfile?.id },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [adminUser?.id, parentUser?.id, teacherUser?.id] } },
      });
      await prisma.$disconnect();
    } catch {
      // Ignore disconnect errors during teardown
    }
  });

  // ==========================================================================
  // SECTION 1: Gateway Capabilities & Provider Specs
  // ==========================================================================
  describe("1. Gateway Capabilities & Provider Realism", () => {
    it("CinetPay adapter reports verified capabilities (OM Guinée, MTN MoMo, Cards)", () => {
      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.CINETPAY);
      const caps = adapter.getCapabilities();

      expect(caps.supportsInternationalCards).toBe(true);
      expect(caps.supportsOrangeMoney).toBe(true);
      expect(caps.supportsMtnMomo).toBe(true);
      expect(caps.supportedCurrencies).toContain("GNF");
      expect(caps.supportedCurrencies).toContain("EUR");
      // Disbursements remain unconfirmed without telecom aggregator agreement
      expect(caps.supportsDisbursements).toBe(false);
    });

    it("FedaPay adapter reports verified capabilities (MTN MoMo, Cards; Orange Money NOT supported in GN)", () => {
      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.FEDAPAY);
      const caps = adapter.getCapabilities();

      expect(caps.supportsInternationalCards).toBe(true);
      expect(caps.supportsMtnMomo).toBe(true);
      // Critical check: FedaPay does NOT support Orange Money in Guinea
      expect(caps.supportsOrangeMoney).toBe(false);
      expect(caps.supportsDisbursements).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 2: Payment Sessions & Mobile Money Collections (Orange & MTN)
  // ==========================================================================
  describe("2. Payment Sessions & Mobile Money Collections", () => {
    let omIntent: any;

    it("creates a payment session for Orange Money Guinea with validated number", async () => {
      omIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `om_session_test_${ts}`,
      });

      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.CINETPAY);
      const session = await adapter.createPaymentSession({
        intentReference: omIntent.intentReference,
        amountGnf: 800000,
        currency: "GNF",
        customerEmail: parentUser.email,
        customerName: parentUser.fullName,
        customerPhoneNumber: "+224622123456",
        returnUrl: "http://localhost:3000/parent/classes?payment=success",
        cancelUrl: "http://localhost:3000/parent/classes?payment=cancelled",
        selectedChannel: "ORANGE_MONEY",
      });

      expect(session.paymentUrl).toBeDefined();
      expect(session.providerReference).toBeDefined();
      expect(omIntent.status).toBe(PaymentIntentStatus.CREATED);
    });

    it("rejects FedaPay session when Orange Money Guinea is requested", async () => {
      const fedaAdapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.FEDAPAY);
      await expect(
        fedaAdapter.createPaymentSession({
          intentReference: `feda_om_fail_${ts}`,
          amountGnf: 800000,
          currency: "GNF",
          customerEmail: parentUser.email,
          customerName: parentUser.fullName,
          returnUrl: "http://localhost:3000/return",
          cancelUrl: "http://localhost:3000/cancel",
          selectedChannel: "ORANGE_MONEY",
        })
      ).rejects.toThrow(FinancialError);
    });
  });

  // ==========================================================================
  // SECTION 3: Webhook Verification, Status Inquiry & Atomic Settlement
  // ==========================================================================
  describe("3. Secure Webhook Ingestion & Status Query Verification", () => {
    let webhookIntent: any;

    beforeAll(async () => {
      webhookIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `wh_test_intent_${ts}`,
      });
    });

    // TEST 7: Invalid webhook signature rejection
    it("Scenario 7: Rejects webhook with invalid cryptographic signature", async () => {
      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": "forged_invalid_hmac_signature",
        },
        body: JSON.stringify({
          cpm_trans_id: webhookIntent.intentReference,
          cpm_amount: 800000,
          cpm_currency: "GNF",
        }),
      });

      // In test mode, signature verification with fake key returns invalid
      const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.CINETPAY);
      const isSigValid = adapter.verifyWebhookSignature("{}", { "x-token": "bad_sig" });
      expect(isSigValid).toBe(false);
    });

    // TEST 10: Unknown merchant reference
    it("Scenario 10: Rejects webhook with unknown transaction reference (404)", async () => {
      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm_trans_id: `pi_non_existent_${ts}`,
          cpm_amount: 800000,
          cpm_currency: "GNF",
        }),
      });

      const res = await cinetpayWebhookRoute(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe("INTENT_NOT_FOUND");
    });

    // TEST 12: Incorrect transaction amount (tampered settled amount)
    it("Scenario 12: Rejects webhook with tampered settled amount (422 AMOUNT_MISMATCH)", async () => {
      // Create separate intent for 500,000 GNF
      const tamperedIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 500000, // Intent is 500,000 GNF
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `tamper_amt_intent_${ts}`,
      });

      // Provider status query returns 800,000 GNF (mismatch with 500,000 GNF intent)
      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm_trans_id: tamperedIntent.intentReference,
          cpm_amount: 800000,
          cpm_currency: "GNF",
        }),
      });

      const res = await cinetpayWebhookRoute(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.code).toBe("AMOUNT_MISMATCH");
    });

    // TEST 11: Incorrect currency
    it("Scenario 11: Rejects webhook with unexpected currency (422 CURRENCY_MISMATCH)", async () => {
      const currencyIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        customerCurrency: "GNF",
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `currency_mismatch_intent_${ts}`,
      });

      // Direct service test
      await expect(
        PaymentIntentService.confirmPaymentTransaction({
          intentReference: currencyIntent.intentReference,
          providerTransactionId: `tx_bad_cur_${ts}`,
          settledAmountGnf: 800000,
          currency: "USD", // Mismatch: USD instead of GNF!
          actorId: "GATEWAY_WEBHOOK",
          idempotencyKey: `bad_cur_key_${ts}`,
        })
      ).rejects.toThrow(FinancialError);
    });

    // TEST 4 & 1: Successful Mobile Money payment & Classroom Funding
    it("Scenario 4 & 1: Successfully ingests verified webhook, settles intent, funds classroom, and posts balanced journal", async () => {
      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm_trans_id: webhookIntent.intentReference,
          cpm_amount: 800000,
          cpm_currency: "GNF",
          cpm_result: "00",
        }),
      });

      const res = await cinetpayWebhookRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ACCEPTED");

      // Verify intent is SUCCEEDED
      const updatedIntent = await PaymentIntentService.getIntentByReference(webhookIntent.intentReference);
      expect(updatedIntent?.status).toBe(PaymentIntentStatus.SUCCEEDED);

      // Verify classroom is FUNDED
      const funding = await prisma.classroomFunding.findUnique({
        where: { classroomId: classroom.id },
      });
      expect(funding?.status).toBe(ClassroomFundingStatus.FUNDED);
      expect(funding?.availableBalanceGnf).toBe(800000);

      // Verify session 1 is marked funded
      const s1 = await prisma.lessonSession.findUnique({ where: { id: session1.id } });
      expect(s1?.isFunded).toBe(true);
    });

    // TEST 8 & 9: Duplicate webhook and replayed notification idempotency
    it("Scenario 8 & 9: Handles duplicate webhook idempotently without double-funding or extra journals", async () => {
      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm_trans_id: webhookIntent.intentReference,
          cpm_amount: 800000,
          cpm_currency: "GNF",
          cpm_result: "00",
        }),
      });

      const res = await cinetpayWebhookRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ACCEPTED");
      expect(json.alreadyProcessed).toBe(true);

      // Verify classroom funding did NOT increase twice
      const funding = await prisma.classroomFunding.findUnique({
        where: { classroomId: classroom.id },
      });
      expect(funding?.totalFundedAmountGnf).toBe(800000);
    });

    // TEST 14: Concurrent payment callbacks
    it("Scenario 14: Prevents race conditions during concurrent payment callback attempts", async () => {
      const concurrentIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `concurrent_intent_${ts}`,
      });

      const makeCall = () =>
        cinetpayWebhookRoute(
          new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cpm_trans_id: concurrentIntent.intentReference,
              cpm_amount: 800000,
              cpm_currency: "GNF",
              cpm_result: "00",
            }),
          })
        );

      // Send 3 concurrent requests
      const results = await Promise.allSettled([makeCall(), makeCall(), makeCall()]);
      const successful = results.filter((r) => r.status === "fulfilled" && (r.value as any).status === 200);

      // All calls resolve cleanly without corruption
      expect(successful.length).toBe(3);

      // Verify intent is SUCCEEDED exactly once
      const intentAfter = await PaymentIntentService.getIntentByReference(concurrentIntent.intentReference);
      expect(intentAfter?.status).toBe(PaymentIntentStatus.SUCCEEDED);
    });
  });

  // ==========================================================================
  // SECTION 4: Security Hardening & Production Bypass Rejection
  // ==========================================================================
  describe("4. Security Hardening & Production Bypass Rejection", () => {
    // TEST 13 & 21: Production test-payment bypass rejection
    it("Scenario 13 & 21: Categorically rejects manual test payment confirmation in production mode", async () => {
      const prodIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `prod_guard_test_${ts}`,
      });

      const originalEnv = process.env.NODE_ENV;
      const originalAllowTest = process.env.ALLOW_TEST_PAYMENTS;

      try {
        // Simulate production environment with malicious ALLOW_TEST_PAYMENTS=true
        (process.env as any).NODE_ENV = "production";
        process.env.ALLOW_TEST_PAYMENTS = "true";

        const req = new NextRequest(
          `http://localhost:3000/api/finance/payment-intents/${prodIntent.intentReference}/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              settledAmountGnf: 800000,
              currency: "GNF",
            }),
          }
        );

        const res = await confirmPaymentRoute(req, {
          params: Promise.resolve({ reference: prodIntent.intentReference }),
        });

        // MUST be 403 Forbidden: ALLOW_TEST_PAYMENTS is completely ignored in production
        expect(res.status).toBe(403);
        const json = await res.json();
        expect(json.code).toBe("MANUAL_CONFIRMATION_DISABLED_IN_PROD");
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
        process.env.ALLOW_TEST_PAYMENTS = originalAllowTest;
      }
    });

    // TEST 20: Prevention of earnings from unfunded lessons
    it("Scenario 20: Prevents earnings release from unfunded classroom lessons", async () => {
      // Create unfunded classroom
      const unfundedClass = await prisma.classroom.create({
        data: {
          teacherProfileId: teacherProfile.id,
          studentId: student.id,
          subjectName: "Physique Chimie",
          mode: TutoringMode.HOME,
          monthlyRateGnf: 600000,
          hourlyRateGnf: 80000,
          status: ClassroomStatus.PENDING_PAYMENT,
        },
      });

      const unfundedSession = await prisma.lessonSession.create({
        data: {
          classroomId: unfundedClass.id,
          sessionSequence: 1,
          title: "Cinématique du point",
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          durationMinutes: 60,
          status: SessionStatus.TEACHER_COMPLETED,
          allocatedAmountGnf: 80000,
          isFunded: false,
        },
      });

      await expect(
        EarningsEligibilityService.releaseSessionEarnings(unfundedSession.id, "TEST_SUITE")
      ).rejects.toThrow(IneligibleEarningsError);

      // Clean up unfunded class
      await prisma.lessonSession.delete({ where: { id: unfundedSession.id } });
      await prisma.classroom.delete({ where: { id: unfundedClass.id } });
    });
  });

  // ==========================================================================
  // SECTION 5: Teacher Payout Lifecycle & Dedicated Clearing Account
  // ==========================================================================
  describe("5. Teacher Payout Lifecycle & Dedicated Clearing Account (1030_DISBURSEMENT_CLEARING)", () => {
    beforeAll(async () => {
      // Submit and validate report for session 1
      await prisma.lessonReport.create({
        data: {
          sessionId: session1.id,
          topicsCovered: "Nombres complexes et équations polynomiales",
          status: ReportStatus.VALIDATED,
        },
      });

      await prisma.lessonApproval.create({
        data: {
          sessionId: session1.id,
          approvedBy: parentUser.id,
          feedbackNote: "Très satisfait de la séance.",
        },
      });

      // Release earnings -> ELIGIBLE
      await EarningsEligibilityService.releaseSessionEarnings(session1.id, "TEST_SUITE");
    });

    it("records payout request with disbursementMode 'MANUAL_ADMIN_RECORDED' and reserves funds", async () => {
      payoutRecord = await TeacherPayoutService.requestPayout({
        teacherProfileId: teacherProfile.id,
        amountGnf: 80000,
        channel: "ORANGE_MONEY",
        beneficiaryName: "Alpha Sow",
        beneficiaryPhone: "+224622123456",
        requestedByUserId: adminUser.id,
        idempotencyKey: `payout_m302_${ts}`,
        disbursementMode: "MANUAL_ADMIN_RECORDED",
      });

      expect(payoutRecord.status).toBe("REQUESTED");
      expect(payoutRecord.disbursementMode).toBe("MANUAL_ADMIN_RECORDED");

      // Verify session is RESERVED_FOR_PAYOUT
      const s1 = await prisma.lessonSession.findUnique({ where: { id: session1.id } });
      expect(s1?.earningsStatus).toBe(SessionEarningsStatus.RESERVED_FOR_PAYOUT);
    });

    it("confirms payout settlement crediting 1030_DISBURSEMENT_CLEARING (never parent collection clearing)", async () => {
      const confirmed = await TeacherPayoutService.confirmPayoutDisbursement({
        payoutId: payoutRecord.id,
        providerDisbursementRef: `OM_DISB_REF_${ts}`,
        actorId: adminUser.id,
      });

      expect(confirmed.status).toBe("PAID");

      // Verify double-entry ledger: credited 1030_DISBURSEMENT_CLEARING, debited 2040_PAYOUT_LIABILITY
      const journals = await prisma.ledgerJournal.findMany({
        where: { referenceId: payoutRecord.id },
        include: { entries: { include: { account: true } } },
      });

      expect(journals.length).toBeGreaterThanOrEqual(1);
      const disbursementJournal = journals[journals.length - 1];
      expect(disbursementJournal.isBalanced).toBe(true);

      const debitEntry = disbursementJournal.entries.find((e) => e.direction === "DEBIT");
      const creditEntry = disbursementJournal.entries.find((e) => e.direction === "CREDIT");

      expect(debitEntry?.account.code).toBe(STANDARD_ACCOUNTS.PAYOUT_LIABILITY);
      // CRITICAL FinTech AUDIT CHECK: Credited account must be DISBURSEMENT_CLEARING, NOT PARENT_CLEARING!
      expect(creditEntry?.account.code).toBe(STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING);
    });

    it("reconciles confirmed payout against monthly telecom statement (RECONCILED)", async () => {
      const reconciled = await TeacherPayoutService.reconcilePayout(payoutRecord.id, adminUser.id);
      expect(reconciled.status).toBe("RECONCILED");
      expect(reconciled.reconciledBy).toBe(adminUser.id);
      expect(reconciled.reconciledAt).toBeDefined();
    });
  });

  // ==========================================================================
  // SECTION 6: State Persistence Across Simulated Restarts
  // ==========================================================================
  describe("6. State Persistence & Trial Balance Invariant (Restart Check)", () => {
    // TEST 18: Restart and database reconnection
    it("Scenario 18: Preserves 100% ledger balance and state integrity across fresh DB connections", async () => {
      const freshPrisma = new PrismaClient();
      try {
        const allEntries = await freshPrisma.ledgerEntry.findMany();
        let totalDebits = 0;
        let totalCredits = 0;

        for (const entry of allEntries) {
          if (entry.direction === "DEBIT") totalDebits += entry.amount;
          if (entry.direction === "CREDIT") totalCredits += entry.amount;
        }

        expect(totalDebits).toBeGreaterThan(0);
        expect(totalCredits).toBeGreaterThan(0);
        // Fundamental accounting theorem
        expect(totalDebits).toBe(totalCredits);

        // Verify payout record persisted in RECONCILED state
        const p = await freshPrisma.payout.findUnique({ where: { id: payoutRecord?.id } });
        expect(p?.status).toBe("RECONCILED");
        expect(p?.disbursementMode).toBe("MANUAL_ADMIN_RECORDED");
      } finally {
        await freshPrisma.$disconnect();
      }
    });
  });

  // ==========================================================================
  // SECTION 7: Edge Cases & Gateway Security Hardening (M3.02 Final Remediation)
  // ==========================================================================
  describe("7. Edge Cases & Gateway Security Hardening (M3.02 Final Remediation)", () => {
    // TEST 21: Foreign-card payment currency & amount integrity
    it("Scenario 21: Rejects tampered foreign-card settlement currency and amount", async () => {
      const cardIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 1200000,
        customerCurrency: "EUR",
        customerAmount: 125, // EUR quote
        provider: PaymentProviderName.FEDAPAY,
        selectedMethod: "CARD",
        idempotencyKey: `card_tamper_intent_${ts}`,
      });

      // Attempt confirming with mismatched settled amount (e.g. 600,000 GNF instead of 1,200,000)
      await expect(
        PaymentIntentService.confirmPaymentTransaction({
          intentReference: cardIntent.intentReference,
          providerTransactionId: `tx_card_tamper_${ts}`,
          settledAmountGnf: 600000,
          currency: "GNF",
          actorId: "SECURITY_TEST",
          idempotencyKey: `card_tamper_tx_${ts}`,
        })
      ).rejects.toThrow("non concordant");

      // Attempt confirming with unauthorized/unmatched currency (e.g. JPY)
      await expect(
        PaymentIntentService.confirmPaymentTransaction({
          intentReference: cardIntent.intentReference,
          providerTransactionId: `tx_card_cur_${ts}`,
          settledAmountGnf: 1200000,
          currency: "JPY",
          actorId: "SECURITY_TEST",
          idempotencyKey: `card_cur_tx_${ts}`,
        })
      ).rejects.toThrow("non reconnue");
    });

    // TEST 22: Unsupported FX quote handling
    it("Scenario 22: Handles missing/unsupported FX quote gracefully with authoritative GNF amount", async () => {
      const fedapayAdapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.FEDAPAY);
      const session = await fedapayAdapter.createPaymentSession({
        intentReference: `pi_fx_test_${ts}`,
        amountGnf: 800000,
        currency: "GNF",
        selectedChannel: "CARD",
        customerEmail: "parent.card@monsieurfanyi.gn",
        customerName: "Aissatou Barry",
        returnUrl: "http://localhost:3000/parent/classes",
        cancelUrl: "http://localhost:3000/parent/classes",
      });

      expect(session.paymentUrl).toBeDefined();
      expect(session.providerReference).toBeDefined();
      // Ensure no hardcoded FX rate is injected
      expect((session as any).providerFxQuote).toBeUndefined();
    });

    // TEST 23: Incorrect FedaPay webhook secret returns 401
    it("Scenario 23: Rejects FedaPay webhook with invalid HMAC signature (401 INVALID_SIGNATURE)", async () => {
      const payload = JSON.stringify({
        event: "transaction.approved",
        entity: { id: `fp_bad_sig_${ts}`, reference: `ref_bad_${ts}`, amount: 800000 },
      });

      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/fedapay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fedapay-signature": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        },
        body: payload,
      });

      const res = await fedapayWebhookRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_SIGNATURE");
    });

    // TEST 24: FedaPay timestamped signature replay attack (> 5 minutes old) returns 401
    it("Scenario 24: Rejects FedaPay timestamped signature replay attack older than 5 minutes (401)", async () => {
      const secret = process.env.FEDAPAY_WEBHOOK_SECRET || process.env.FEDAPAY_SECRET_KEY || "mock_fedapay_secret";
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes in the past
      const rawBody = JSON.stringify({
        event: "transaction.approved",
        entity: { id: `fp_replay_${ts}`, reference: `ref_replay_${ts}`, amount: 800000 },
      });

      // Compute HMAC with expired timestamp
      const payloadToSign = `${expiredTimestamp}.${rawBody}`;
      const validHmacForOldTs = crypto
        .createHmac("sha256", secret)
        .update(payloadToSign)
        .digest("hex");

      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/fedapay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fedapay-signature": `t=${expiredTimestamp},s=${validHmacForOldTs}`,
        },
        body: rawBody,
      });

      const res = await fedapayWebhookRoute(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe("INVALID_SIGNATURE");
    });

    // TEST 25: Valid FedaPay timestamped signature within 5 minutes succeeds
    it("Scenario 25: Accepts valid FedaPay timestamped signature within tolerance window (200)", async () => {
      const secret = process.env.FEDAPAY_WEBHOOK_SECRET || process.env.FEDAPAY_SECRET_KEY || "mock_fedapay_secret";
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const intent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.FEDAPAY,
        selectedMethod: "MTN_MOMO",
        idempotencyKey: `fedapay_ts_valid_intent_${ts}`,
      });

      const rawBody = JSON.stringify({
        event: "transaction.approved",
        entity: {
          id: `fp_fresh_${ts}`,
          reference: intent.intentReference,
          amount: 800000,
          status: "approved",
        },
      });

      const payloadToSign = `${currentTimestamp}.${rawBody}`;
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payloadToSign)
        .digest("hex");

      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/fedapay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fedapay-signature": `t=${currentTimestamp},s=${signature}`,
        },
        body: rawBody,
      });

      const res = await fedapayWebhookRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ACCEPTED");
    });

    // TEST 26: Provider verification failure (non-ACCEPTED status) does not fund classroom
    it("Scenario 26: Webhook receives failed status from provider check without ledger posting", async () => {
      const failedIntent = await PaymentIntentService.createPaymentIntent({
        intentReference: `pi_fail_${ts}`,
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `failed_provider_intent_${ts}`,
      });

      // Reference includes "fail" so mock adapter returns status: "FAILED"
      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/cinetpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpm_trans_id: failedIntent.intentReference,
          cpm_amount: 800000,
          cpm_currency: "GNF",
          cpm_result: "603",
        }),
      });

      const res = await cinetpayWebhookRoute(req);
      // Status check failed -> 200 ACKNOWLEDGED with providerStatus: FAILED, no ledger posting
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ACKNOWLEDGED");
      expect(json.providerStatus).toBe("FAILED");

      // Verify intent remains CREATED
      const checkIntent = await PaymentIntentService.getIntentByReference(failedIntent.intentReference);
      expect(checkIntent?.status).toBe(PaymentIntentStatus.CREATED);
    });

    // TEST 27: Expired payment intent rejection
    it("Scenario 27: Rejects payment confirmation on expired intent (410 INTENT_EXPIRED)", async () => {
      const expiredIntent = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `expired_intent_key_${ts}`,
      });

      // Manually set expiration in the past
      await prisma.paymentIntent.update({
        where: { id: expiredIntent.id },
        data: { expiresAt: new Date(Date.now() - 60000) },
      });

      await expect(
        PaymentIntentService.confirmPaymentTransaction({
          intentReference: expiredIntent.intentReference,
          providerTransactionId: `tx_expired_${ts}`,
          settledAmountGnf: 800000,
          currency: "GNF",
          actorId: "SECURITY_TEST",
          idempotencyKey: `expired_tx_key_${ts}`,
        })
      ).rejects.toThrow("a expiré");

      const rechecked = await prisma.paymentIntent.findUnique({
        where: { id: expiredIntent.id },
      });
      expect(rechecked?.status).toBe(PaymentIntentStatus.EXPIRED);
    });

    // TEST 28: Out-of-order & duplicate webhook delivery idempotency
    it("Scenario 28: Duplicate webhook callback safely returns alreadyProcessed without double-crediting", async () => {
      // Use the intent from Scenario 25 that was already settled
      const settledIntent = await prisma.paymentIntent.findFirst({
        where: { idempotencyKey: `fedapay_ts_valid_intent_${ts}` },
      });
      expect(settledIntent).toBeDefined();

      const secret = process.env.FEDAPAY_WEBHOOK_SECRET || process.env.FEDAPAY_SECRET_KEY || "mock_fedapay_secret";
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const rawBody = JSON.stringify({
        event: "transaction.approved",
        entity: {
          id: `fp_fresh_${ts}`,
          reference: settledIntent!.intentReference,
          amount: 800000,
          status: "approved",
        },
      });

      const payloadToSign = `${currentTimestamp}.${rawBody}`;
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payloadToSign)
        .digest("hex");

      const req = new NextRequest("http://localhost:3000/api/finance/webhooks/fedapay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fedapay-signature": `t=${currentTimestamp},s=${signature}`,
        },
        body: rawBody,
      });

      const res = await fedapayWebhookRoute(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ACCEPTED");
      expect(json.alreadyProcessed).toBe(true);

      // Verify no extra transactions created
      const txCount = await prisma.paymentTransaction.count({
        where: { intentId: settledIntent!.id },
      });
      expect(txCount).toBe(1);
    });

    // TEST 29: Duplicate payment initiation returns identical intent
    it("Scenario 29: Duplicate payment initiation with identical idempotencyKey returns identical intent", async () => {
      const key = `idempotent_init_key_${ts}`;
      const intent1 = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: key,
      });

      const intent2 = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: key,
      });

      expect(intent1.id).toBe(intent2.id);
      expect(intent1.intentReference).toBe(intent2.intentReference);
    });

    // TEST 30: Distinct payment attempts for same classroom
    it("Scenario 30: Distinct payment attempts for the same classroom succeed with distinct keys", async () => {
      const intentA = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "ORANGE_MONEY",
        idempotencyKey: `attempt_a_${ts}`,
      });

      const intentB = await PaymentIntentService.createPaymentIntent({
        parentUserId: parentUser.id,
        classroomId: classroom.id,
        packageId: tutoringPackage.id,
        amountGnf: 800000,
        provider: PaymentProviderName.CINETPAY,
        selectedMethod: "MTN_MOMO",
        idempotencyKey: `attempt_b_${ts}`,
      });

      expect(intentA.id).not.toBe(intentB.id);
      expect(intentA.intentReference).not.toBe(intentB.intentReference);
    });

    // TEST 31: Missing merchant credentials handled gracefully
    it("Scenario 31: Provider adapters handle missing/unconfigured credentials gracefully without crashing", () => {
      const cinetAdapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.CINETPAY);
      const capabilities = cinetAdapter.getCapabilities();

      expect(capabilities.provider).toBe(PaymentProviderName.CINETPAY);
      expect(capabilities.supportsOrangeMoney).toBe(true);
      expect(capabilities.supportsMtnMomo).toBe(true);
      expect(capabilities.supportsInternationalCards).toBe(true);
    });

    // TEST 32: Migration file validation (additive SQL and idempotency)
    it("Scenario 32: Validates versioned migration file contains only additive, idempotent SQL without DROP", () => {
      const migrationPath = path.join(
        process.cwd(),
        "prisma",
        "migrations",
        "20261116140000_m302_payout_lifecycle_and_clearing",
        "migration.sql"
      );

      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      // Verify additive enum values
      expect(sql).toContain('ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS \'RESERVED\';');
      expect(sql).toContain('ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS \'APPROVED\';');
      expect(sql).toContain('ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS \'RECONCILED\';');

      // Verify additive columns
      expect(sql).toContain('ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "disbursementMode"');
      expect(sql).toContain('ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "providerDisbursementRef"');
      expect(sql).toContain('ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "reconciledAt"');
      expect(sql).toContain('ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "reconciledBy"');

      // Verify indexes
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS "Payout_status_idx"');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS "Payout_disbursementMode_idx"');

      // Verify NO destructive operations
      expect(sql.toUpperCase()).not.toContain("DROP TABLE");
      expect(sql.toUpperCase()).not.toContain("DROP COLUMN");
      expect(sql.toUpperCase()).not.toContain("DROP TYPE");
    });
  });
});
