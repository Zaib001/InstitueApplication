-- AlterEnum: Add earnings notification events
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'EARNINGS_ELIGIBLE';
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'EARNINGS_REVERSED';

