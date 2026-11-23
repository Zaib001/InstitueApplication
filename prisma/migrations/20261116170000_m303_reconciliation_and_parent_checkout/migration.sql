-- AlterEnum: Add reconciliation and refunded states to PaymentIntentStatus
ALTER TYPE "PaymentIntentStatus" ADD VALUE IF NOT EXISTS 'REQUIRES_RECONCILIATION';
ALTER TYPE "PaymentIntentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- AlterEnum: Add refunded status to PaymentTransactionStatus
ALTER TYPE "PaymentTransactionStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- AlterEnum: Add payment reconciliation notification event
ALTER TYPE "NotificationEventType" ADD VALUE IF NOT EXISTS 'PAYMENT_RECONCILIATION_REQUIRED';

