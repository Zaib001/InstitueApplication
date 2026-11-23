-- AlterEnum
ALTER TYPE "PaymentProviderName" ADD VALUE 'DJOMY';

-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN "courseAmountGnf" INTEGER,
ADD COLUMN "parentFeeGnf" INTEGER NOT NULL DEFAULT 0;
