-- AlterEnum: Add new lifecycle states to PayoutStatus enum
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'RECONCILED';

-- AlterTable: Add payout metadata and separate admin-recorded vs automated provider disbursements
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "disbursementMode" TEXT NOT NULL DEFAULT 'MANUAL_ADMIN_RECORDED';
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "providerDisbursementRef" TEXT;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "reconciledAt" TIMESTAMP(3);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "reconciledBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payout_status_idx" ON "Payout"("status");
CREATE INDEX IF NOT EXISTS "Payout_disbursementMode_idx" ON "Payout"("disbursementMode");

