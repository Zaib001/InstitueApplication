-- MONSIEUR FANYI — MILESTONE 3 (M3.05)
-- TEACHER PAYOUTS, MOBILE MONEY DISBURSEMENTS, REFUNDS & RECONCILIATION
-- Strict additive migration with IF NOT EXISTS guards

-- 1. PayoutStatus enum extensions
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "PayoutStatus" ADD VALUE IF NOT EXISTS 'RECONCILIATION_PENDING';

-- 2. NotificationEventType enum extensions
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_REQUESTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_APPROVED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_REJECTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_DISBURSED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PAYOUT_FAILED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'REFUND_REQUESTED';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'RECONCILIATION_EXCEPTION';

-- 3. TeacherPayoutDestination Table
CREATE TABLE IF NOT EXISTS "TeacherPayoutDestination" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherPayoutDestination_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TeacherPayoutDestination_teacherProfileId_idx" ON "TeacherPayoutDestination"("teacherProfileId");
CREATE INDEX IF NOT EXISTS "TeacherPayoutDestination_operator_idx" ON "TeacherPayoutDestination"("operator");
CREATE INDEX IF NOT EXISTS "TeacherPayoutDestination_isDefault_idx" ON "TeacherPayoutDestination"("isDefault");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'TeacherPayoutDestination_teacherProfileId_fkey'
    ) THEN
        ALTER TABLE "TeacherPayoutDestination" ADD CONSTRAINT "TeacherPayoutDestination_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Payout Table Extensions
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "destinationId" TEXT;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Payout" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Payout" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Payout_destinationId_fkey'
    ) THEN
        ALTER TABLE "Payout" ADD CONSTRAINT "Payout_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "TeacherPayoutDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Payout_destinationId_idx" ON "Payout"("destinationId");

-- 5. RefundCase Table Extensions
ALTER TABLE "RefundCase" ADD COLUMN IF NOT EXISTS "classroomId" TEXT;
ALTER TABLE "RefundCase" ALTER COLUMN "orderId" DROP NOT NULL;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RefundCase_classroomId_fkey'
    ) THEN
        ALTER TABLE "RefundCase" ADD CONSTRAINT "RefundCase_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "RefundCase_classroomId_idx" ON "RefundCase"("classroomId");

