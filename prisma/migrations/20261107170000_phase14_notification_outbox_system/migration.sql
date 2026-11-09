-- CreateEnum
CREATE TYPE "NotificationEventType" AS ENUM ('AUTH_WELCOME', 'AUTH_ACTIVATION', 'AUTH_PASSWORD_RESET', 'AUTH_PASSWORD_CHANGED', 'TEACHER_REGISTERED', 'TEACHER_SUBMITTED_FOR_REVIEW', 'TEACHER_VERIFIED', 'TEACHER_REJECTED', 'TEACHER_DOCUMENTS_REQUESTED', 'TEACHER_APPLICATION_RECEIVED', 'TEACHER_SHORTLISTED', 'TEACHER_SELECTED', 'TEACHER_APPLICATION_REJECTED', 'TEACHER_APPLICATION_WITHDRAWN', 'OPPORTUNITY_MATCHED', 'ADMIN_CLASSROOM_ASSIGNED', 'CLASSROOM_STATUS_CHANGED', 'PACKAGE_CONFIRMED', 'PACKAGE_PAYMENT_REQUIRED', 'SCHEDULE_CREATED', 'SCHEDULE_CHANGED', 'LESSON_CANCELLED', 'LESSON_REMINDER', 'ATTENDANCE_RECORDED', 'LESSON_REPORT_SUBMITTED', 'LESSON_APPROVED', 'DISPUTE_OPENED', 'DISPUTE_TEACHER_RESPONDED', 'DISPUTE_RESOLVED', 'HOMEWORK_ASSIGNED', 'HOMEWORK_SUBMITTED', 'HOMEWORK_GRADED', 'ASSESSMENT_RECORDED', 'PROGRESS_OBSERVATION_RECORDED', 'ACADEMIC_PROGRESS_DIGEST', 'ADMIN_ALERT', 'PAYMENT_INITIATED', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PACKAGE_FUNDED', 'PAYOUT_PENDING', 'PAYOUT_COMPLETED', 'REFUND_PROCESSED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EmailDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'RETRY_SCHEDULED', 'PERMANENT_FAILURE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dedupKey" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "eventType" "NotificationEventType" NOT NULL DEFAULT 'ADMIN_ALERT',
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "readAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "eventType" "NotificationEventType" NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "subject" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    "status" "EmailDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "providerMessageId" TEXT,
    "providerResponseJson" TEXT,
    "dedupKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailLessonReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailReportSubmitted" BOOLEAN NOT NULL DEFAULT true,
    "emailHomeworkAssigned" BOOLEAN NOT NULL DEFAULT true,
    "emailAssessmentRecorded" BOOLEAN NOT NULL DEFAULT true,
    "emailProgressDigest" BOOLEAN NOT NULL DEFAULT true,
    "emailMarketplaceOpportunities" BOOLEAN NOT NULL DEFAULT false,
    "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
    "inAppAll" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_notificationId_key" ON "EmailOutbox"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailOutbox_dedupKey_key" ON "EmailOutbox"("dedupKey");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_idx" ON "EmailOutbox"("status");

-- CreateIndex
CREATE INDEX "EmailOutbox_nextAttemptAt_idx" ON "EmailOutbox"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_recipientEmail_idx" ON "EmailOutbox"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailOutbox_eventType_idx" ON "EmailOutbox"("eventType");

-- CreateIndex
CREATE INDEX "EmailOutbox_dedupKey_idx" ON "EmailOutbox"("dedupKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Notification_eventType_idx" ON "Notification"("eventType");

-- CreateIndex
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");

-- CreateIndex
CREATE INDEX "Notification_dedupKey_idx" ON "Notification"("dedupKey");

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

