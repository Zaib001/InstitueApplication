-- CreateEnum
CREATE TYPE "PaymentProviderName" AS ENUM ('CINETPAY', 'FEDAPAY', 'ORANGE_MONEY', 'MTN_MOMO', 'MANUAL_BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('INITIATED', 'CONFIRMED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ClassroomFundingStatus" AS ENUM ('UNFUNDED', 'PARTIALLY_FUNDED', 'FUNDED', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SessionEarningsStatus" AS ENUM ('NOT_ELIGIBLE', 'PENDING_VALIDATION', 'ELIGIBLE', 'RESERVED_FOR_PAYOUT', 'PAID', 'REVERSED');

-- CreateEnum
CREATE TYPE "TeacherPayoutStatus" AS ENUM ('REQUESTED', 'APPROVED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "LedgerEntryDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "JournalReferenceType" AS ENUM ('PARENT_PAYMENT_CLEARING', 'CLASSROOM_PREPAYMENT_FUNDING', 'LESSON_VALIDATION_EARNING', 'TEACHER_PAYOUT_DISBURSEMENT', 'REFUND_SETTLEMENT', 'GATEWAY_FEE_EXPENSE', 'COMPENSATING_ADJUSTMENT');

-- AlterTable
ALTER TABLE "LessonSession" ADD COLUMN     "earningsStatus" "SessionEarningsStatus" NOT NULL DEFAULT 'NOT_ELIGIBLE';

-- CreateTable
CREATE TABLE "PaymentProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProviderName" NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT true,
    "supportedCurrencies" TEXT[] DEFAULT ARRAY['GNF']::TEXT[],
    "supportedChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supportsInternationalCards" BOOLEAN NOT NULL DEFAULT false,
    "supportsOrangeMoney" BOOLEAN NOT NULL DEFAULT false,
    "supportsMtnMomo" BOOLEAN NOT NULL DEFAULT false,
    "supportsDisbursements" BOOLEAN NOT NULL DEFAULT false,
    "supportsRefunds" BOOLEAN NOT NULL DEFAULT false,
    "configurationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "intentReference" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "classroomId" TEXT,
    "packageId" TEXT,
    "amountGnf" INTEGER NOT NULL,
    "customerAmount" INTEGER,
    "customerCurrency" TEXT NOT NULL DEFAULT 'GNF',
    "settlementCurrency" TEXT NOT NULL DEFAULT 'GNF',
    "exchangeRate" DOUBLE PRECISION,
    "provider" "PaymentProviderName" NOT NULL,
    "providerReference" TEXT,
    "selectedMethod" TEXT,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'CREATED',
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadataJson" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "transactionReference" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "provider" "PaymentProviderName" NOT NULL,
    "originalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "settledAmountGnf" INTEGER NOT NULL,
    "providerFeeGnf" INTEGER NOT NULL DEFAULT 0,
    "netAmountGnf" INTEGER NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'INITIATED',
    "verifiedAt" TIMESTAMP(3),
    "rawPayloadJson" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GNF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerJournal" (
    "id" TEXT NOT NULL,
    "journalNumber" TEXT NOT NULL,
    "referenceType" "JournalReferenceType" NOT NULL,
    "referenceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GNF',
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedBy" TEXT NOT NULL,
    "isBalanced" BOOLEAN NOT NULL DEFAULT true,
    "totalDebit" INTEGER NOT NULL,
    "totalCredit" INTEGER NOT NULL,

    CONSTRAINT "LedgerJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "direction" "LedgerEntryDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GNF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomFunding" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "packageId" TEXT,
    "parentUserId" TEXT NOT NULL,
    "totalFundedAmountGnf" INTEGER NOT NULL DEFAULT 0,
    "allocatedAmountGnf" INTEGER NOT NULL DEFAULT 0,
    "refundedAmountGnf" INTEGER NOT NULL DEFAULT 0,
    "availableBalanceGnf" INTEGER NOT NULL DEFAULT 0,
    "status" "ClassroomFundingStatus" NOT NULL DEFAULT 'UNFUNDED',
    "fundedAt" TIMESTAMP(3),
    "lastPaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassroomFunding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPolicy" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "platformPercent" INTEGER NOT NULL DEFAULT 15,
    "teacherPercent" INTEGER NOT NULL DEFAULT 85,
    "description" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAuditEvent" (
    "id" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousStateJson" TEXT,
    "newStateJson" TEXT,
    "ipAddress" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentProviderConfig_provider_key" ON "PaymentProviderConfig"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_intentReference_key" ON "PaymentIntent"("intentReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_idempotencyKey_key" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_parentUserId_idx" ON "PaymentIntent"("parentUserId");

-- CreateIndex
CREATE INDEX "PaymentIntent_classroomId_idx" ON "PaymentIntent"("classroomId");

-- CreateIndex
CREATE INDEX "PaymentIntent_packageId_idx" ON "PaymentIntent"("packageId");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "PaymentIntent_idempotencyKey_idx" ON "PaymentIntent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentIntent_intentReference_idx" ON "PaymentIntent"("intentReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionReference_key" ON "PaymentTransaction"("transactionReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentTransaction_intentId_idx" ON "PaymentTransaction"("intentId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_providerTransactionId_idx" ON "PaymentTransaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_transactionReference_idx" ON "PaymentTransaction"("transactionReference");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_code_idx" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_type_idx" ON "LedgerAccount"("type");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerJournal_journalNumber_key" ON "LedgerJournal"("journalNumber");

-- CreateIndex
CREATE INDEX "LedgerJournal_journalNumber_idx" ON "LedgerJournal"("journalNumber");

-- CreateIndex
CREATE INDEX "LedgerJournal_referenceType_referenceId_idx" ON "LedgerJournal"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "LedgerJournal_postedAt_idx" ON "LedgerJournal"("postedAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_journalId_idx" ON "LedgerEntry"("journalId");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassroomFunding_classroomId_key" ON "ClassroomFunding"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomFunding_classroomId_idx" ON "ClassroomFunding"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomFunding_parentUserId_idx" ON "ClassroomFunding"("parentUserId");

-- CreateIndex
CREATE INDEX "ClassroomFunding_status_idx" ON "ClassroomFunding"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionPolicy_version_key" ON "CommissionPolicy"("version");

-- CreateIndex
CREATE INDEX "CommissionPolicy_version_idx" ON "CommissionPolicy"("version");

-- CreateIndex
CREATE INDEX "CommissionPolicy_isActive_idx" ON "CommissionPolicy"("isActive");

-- CreateIndex
CREATE INDEX "CommissionPolicy_effectiveFrom_idx" ON "CommissionPolicy"("effectiveFrom");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_correlationId_idx" ON "FinancialAuditEvent"("correlationId");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_actorId_idx" ON "FinancialAuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_action_idx" ON "FinancialAuditEvent"("action");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_entityType_entityId_idx" ON "FinancialAuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FinancialAuditEvent_createdAt_idx" ON "FinancialAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TutoringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "PaymentIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "LedgerJournal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomFunding" ADD CONSTRAINT "ClassroomFunding_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomFunding" ADD CONSTRAINT "ClassroomFunding_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TutoringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomFunding" ADD CONSTRAINT "ClassroomFunding_lastPaymentIntentId_fkey" FOREIGN KEY ("lastPaymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAuditEvent" ADD CONSTRAINT "FinancialAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

