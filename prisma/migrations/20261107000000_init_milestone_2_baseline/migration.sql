-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'TEACHER', 'ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "TeacherVerificationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DIPLOMA', 'POLICE_RECORD', 'CV');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PricingOfferType" AS ENUM ('HOURLY', 'MONTHLY_PACKAGE');

-- CreateEnum
CREATE TYPE "TutoringMode" AS ENUM ('HOME', 'ONLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'OPEN', 'ASSIGNED', 'MATCHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'PROPOSED', 'AGREED', 'PENDING_PAYMENT', 'FUNDED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS', 'TEACHER_COMPLETED', 'PARENT_APPROVED', 'PARENT_DISPUTED', 'ADMIN_RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'VALIDATED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('DIAGNOSTIC', 'WEEKLY_QUIZ', 'MONTHLY_EXAM', 'TOPIC_TEST', 'PRACTICE_EXAM');

-- CreateEnum
CREATE TYPE "LessonAttendance" AS ENUM ('PRESENT', 'ABSENT_STUDENT', 'ABSENT_TEACHER', 'EXCUSED', 'LATE');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('PARENT_PAYMENT', 'TEACHER_EARNING', 'PLATFORM_COMMISSION', 'TEACHER_PAYOUT', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_VALIDATED', 'RESOLVED_REFUNDED', 'RESOLVED_RESCHEDULED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountInvitationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "invitedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountInvitationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Conakry',
    "isAssistedRegistration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "cycle" TEXT,
    "customCycle" TEXT,
    "customSubject" TEXT,
    "schoolName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "supportNeeds" TEXT,
    "preferredSubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "city" TEXT NOT NULL DEFAULT 'Conakry',
    "serviceArea" TEXT,
    "degrees" TEXT,
    "institution" TEXT,
    "isHomeAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isOnlineAvailable" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRateGnf" INTEGER,
    "monthlyPackageRateGnf" INTEGER,
    "monthlyPackageSessions" INTEGER DEFAULT 8,
    "monthlyPackageHoursPerSession" INTEGER DEFAULT 2,
    "customSubject" TEXT,
    "customGradeLevel" TEXT,
    "verificationStatus" "TeacherVerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherGradeLevel" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherGradeLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherDocument" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GradeLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherPricingOffer" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "type" "PricingOfferType" NOT NULL DEFAULT 'HOURLY',
    "title" TEXT NOT NULL,
    "totalPriceGnf" INTEGER NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 1,
    "minutesPerSession" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherPricingOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringRequest" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectName" TEXT NOT NULL,
    "customSubject" TEXT,
    "cycle" TEXT,
    "customCycle" TEXT,
    "gradeLevelName" TEXT NOT NULL,
    "mode" "TutoringMode" NOT NULL DEFAULT 'HOME',
    "frequency" TEXT,
    "preferredSchedule" TEXT,
    "sessionDurationMinutes" INTEGER NOT NULL DEFAULT 120,
    "budgetGnf" INTEGER NOT NULL DEFAULT 800000,
    "budgetType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "city" TEXT NOT NULL DEFAULT 'Conakry',
    "commune" TEXT,
    "neighborhood" TEXT,
    "locationAddress" TEXT,
    "learningGoals" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "isAssisted" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherApplication" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "pitchMessage" TEXT,
    "proposedRateGnf" INTEGER,
    "proposedRateType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "sessionArrangement" TEXT,
    "availabilityNotes" TEXT,
    "pricingOfferId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "isAssisted" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "decisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "teacherProfileId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "mode" "TutoringMode" NOT NULL DEFAULT 'HOME',
    "hourlyRateGnf" INTEGER,
    "monthlyRateGnf" INTEGER,
    "isAssistedAssignment" BOOLEAN NOT NULL DEFAULT false,
    "assignedByAdminId" TEXT,
    "adminNotes" TEXT,
    "assignmentSource" TEXT,
    "externalVideoUrl" TEXT,
    "status" "ClassroomStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonSession" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "packageId" TEXT,
    "sessionSequence" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "actualDurationMinutes" INTEGER,
    "attendanceStatus" "LessonAttendance" NOT NULL DEFAULT 'PRESENT',
    "attendanceRecordedAt" TIMESTAMP(3),
    "attendanceRecordedById" TEXT,
    "attendanceNotes" TEXT,
    "allocatedAmountGnf" INTEGER NOT NULL DEFAULT 0,
    "platformCommissionGnf" INTEGER NOT NULL DEFAULT 0,
    "teacherNetGnf" INTEGER NOT NULL DEFAULT 0,
    "isFunded" BOOLEAN NOT NULL DEFAULT false,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "rescheduledFromStart" TIMESTAMP(3),
    "rescheduledFromEnd" TIMESTAMP(3),
    "rescheduleReason" TEXT,
    "rescheduledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "topicsCovered" TEXT NOT NULL,
    "learningObjectives" TEXT,
    "studentEffort" TEXT,
    "teacherNotes" TEXT,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "homeworkGiven" TEXT,
    "homeworkDueDate" TIMESTAMP(3),
    "nextLessonRecommendations" TEXT,
    "assessmentTitle" TEXT,
    "assessmentScore" DOUBLE PRECISION,
    "assessmentMaxScore" DOUBLE PRECISION,
    "assessmentComment" TEXT,
    "progressRating" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "revisionNotes" TEXT,
    "originalReportJson" TEXT,
    "draftSavedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonApproval" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "feedbackNote" TEXT,
    "reportVersionReviewed" INTEGER DEFAULT 1,

    CONSTRAINT "LessonApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonDispute" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "openedBy" TEXT NOT NULL,
    "category" TEXT,
    "reason" TEXT NOT NULL,
    "teacherResponse" TEXT,
    "teacherRespondedAt" TIMESTAMP(3),
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionType" TEXT,
    "adminNote" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassroomMessage" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "sessionId" TEXT,
    "subjectName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "HomeworkStatus" NOT NULL DEFAULT 'ASSIGNED',
    "studentSubmission" TEXT,
    "submittedAt" TIMESTAMP(3),
    "teacherFeedback" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "sessionId" TEXT,
    "subjectName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'TOPIC_TEST',
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "obtainedScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "percentage" DOUBLE PRECISION NOT NULL,
    "learningObjectives" TEXT,
    "teacherComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectProgressObservation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topicsMastered" TEXT,
    "strengths" TEXT,
    "areasForImprovement" TEXT,
    "recommendations" TEXT,
    "progressRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectProgressObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutoringPackage" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "pricingType" "PricingOfferType" NOT NULL DEFAULT 'MONTHLY_PACKAGE',
    "hourlyRateGnf" INTEGER,
    "totalAmountGnf" INTEGER NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 8,
    "minutesPerSession" INTEGER NOT NULL DEFAULT 60,
    "totalPlannedMinutes" INTEGER NOT NULL DEFAULT 480,
    "baseSessionRateGnf" INTEGER NOT NULL,
    "remainderGnf" INTEGER NOT NULL DEFAULT 0,
    "commissionRatePercent" INTEGER NOT NULL DEFAULT 15,
    "totalPlatformCommissionGnf" INTEGER NOT NULL,
    "totalTeacherShareGnf" INTEGER NOT NULL,
    "allocationsJson" TEXT,
    "status" "PackageStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "agreedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutoringPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "ratePercentage" INTEGER NOT NULL DEFAULT 15,
    "description" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdmin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT,
    "packageId" TEXT,
    "pricingOfferId" TEXT,
    "parentUserId" TEXT NOT NULL,
    "totalAmountGnf" INTEGER NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerReference" TEXT,
    "amountGnf" INTEGER NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "rawResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentProviderEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "signatureReceived" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherEarning" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "grossAmountGnf" INTEGER NOT NULL,
    "commissionRatePercent" INTEGER NOT NULL DEFAULT 15,
    "platformCommissionGnf" INTEGER NOT NULL,
    "teacherNetGnf" INTEGER NOT NULL,
    "isPaidOut" BOOLEAN NOT NULL DEFAULT false,
    "payoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "amountGnf" INTEGER NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryPhone" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PAID',
    "recordedByAdmin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLedgerEntry" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "amountGnf" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "parentProfileId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detailsJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "teacherProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT,
    "messageId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundCase" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sessionId" TEXT,
    "disputeId" TEXT,
    "requestedAmountGnf" INTEGER NOT NULL,
    "approvedAmountGnf" INTEGER,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "adminDecisionNotes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInvitationToken_tokenHash_key" ON "AccountInvitationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountInvitationToken_userId_idx" ON "AccountInvitationToken"("userId");

-- CreateIndex
CREATE INDEX "AccountInvitationToken_tokenHash_idx" ON "AccountInvitationToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE INDEX "ParentProfile_userId_idx" ON "ParentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_parentId_idx" ON "StudentProfile"("parentId");

-- CreateIndex
CREATE INDEX "StudentProfile_isArchived_idx" ON "StudentProfile"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

-- CreateIndex
CREATE INDEX "TeacherProfile_userId_idx" ON "TeacherProfile"("userId");

-- CreateIndex
CREATE INDEX "TeacherProfile_verificationStatus_idx" ON "TeacherProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "TeacherSubject_teacherProfileId_idx" ON "TeacherSubject"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TeacherSubject_subjectId_idx" ON "TeacherSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_teacherProfileId_subjectId_key" ON "TeacherSubject"("teacherProfileId", "subjectId");

-- CreateIndex
CREATE INDEX "TeacherGradeLevel_teacherProfileId_idx" ON "TeacherGradeLevel"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TeacherGradeLevel_gradeLevelId_idx" ON "TeacherGradeLevel"("gradeLevelId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherGradeLevel_teacherProfileId_gradeLevelId_key" ON "TeacherGradeLevel"("teacherProfileId", "gradeLevelId");

-- CreateIndex
CREATE INDEX "TeacherDocument_teacherProfileId_idx" ON "TeacherDocument"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TeacherDocument_status_idx" ON "TeacherDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GradeLevel_name_key" ON "GradeLevel"("name");

-- CreateIndex
CREATE INDEX "TeacherPricingOffer_teacherProfileId_idx" ON "TeacherPricingOffer"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TutoringRequest_parentId_idx" ON "TutoringRequest"("parentId");

-- CreateIndex
CREATE INDEX "TutoringRequest_studentId_idx" ON "TutoringRequest"("studentId");

-- CreateIndex
CREATE INDEX "TutoringRequest_status_idx" ON "TutoringRequest"("status");

-- CreateIndex
CREATE INDEX "TeacherApplication_requestId_idx" ON "TeacherApplication"("requestId");

-- CreateIndex
CREATE INDEX "TeacherApplication_teacherProfileId_idx" ON "TeacherApplication"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TeacherApplication_status_idx" ON "TeacherApplication"("status");

-- CreateIndex
CREATE INDEX "TeacherApplication_teacherProfileId_status_idx" ON "TeacherApplication"("teacherProfileId", "status");

-- CreateIndex
CREATE INDEX "TeacherApplication_requestId_status_idx" ON "TeacherApplication"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherApplication_requestId_teacherProfileId_key" ON "TeacherApplication"("requestId", "teacherProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_requestId_key" ON "Classroom"("requestId");

-- CreateIndex
CREATE INDEX "Classroom_teacherProfileId_idx" ON "Classroom"("teacherProfileId");

-- CreateIndex
CREATE INDEX "Classroom_studentId_idx" ON "Classroom"("studentId");

-- CreateIndex
CREATE INDEX "Classroom_isAssistedAssignment_idx" ON "Classroom"("isAssistedAssignment");

-- CreateIndex
CREATE INDEX "Classroom_assignedByAdminId_idx" ON "Classroom"("assignedByAdminId");

-- CreateIndex
CREATE INDEX "LessonSession_classroomId_idx" ON "LessonSession"("classroomId");

-- CreateIndex
CREATE INDEX "LessonSession_packageId_idx" ON "LessonSession"("packageId");

-- CreateIndex
CREATE INDEX "LessonSession_status_idx" ON "LessonSession"("status");

-- CreateIndex
CREATE INDEX "LessonSession_attendanceStatus_idx" ON "LessonSession"("attendanceStatus");

-- CreateIndex
CREATE INDEX "LessonSession_scheduledStart_idx" ON "LessonSession"("scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "LessonReport_sessionId_key" ON "LessonReport"("sessionId");

-- CreateIndex
CREATE INDEX "LessonReport_sessionId_idx" ON "LessonReport"("sessionId");

-- CreateIndex
CREATE INDEX "LessonReport_status_idx" ON "LessonReport"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonApproval_sessionId_key" ON "LessonApproval"("sessionId");

-- CreateIndex
CREATE INDEX "LessonApproval_sessionId_idx" ON "LessonApproval"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonDispute_sessionId_key" ON "LessonDispute"("sessionId");

-- CreateIndex
CREATE INDEX "LessonDispute_sessionId_idx" ON "LessonDispute"("sessionId");

-- CreateIndex
CREATE INDEX "LessonDispute_status_idx" ON "LessonDispute"("status");

-- CreateIndex
CREATE INDEX "ClassroomMessage_classroomId_idx" ON "ClassroomMessage"("classroomId");

-- CreateIndex
CREATE INDEX "ClassroomMessage_senderId_idx" ON "ClassroomMessage"("senderId");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_studentId_idx" ON "HomeworkAssignment"("studentId");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_classroomId_idx" ON "HomeworkAssignment"("classroomId");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_teacherProfileId_idx" ON "HomeworkAssignment"("teacherProfileId");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_status_idx" ON "HomeworkAssignment"("status");

-- CreateIndex
CREATE INDEX "HomeworkAssignment_dueDate_idx" ON "HomeworkAssignment"("dueDate");

-- CreateIndex
CREATE INDEX "AcademicAssessment_studentId_idx" ON "AcademicAssessment"("studentId");

-- CreateIndex
CREATE INDEX "AcademicAssessment_classroomId_idx" ON "AcademicAssessment"("classroomId");

-- CreateIndex
CREATE INDEX "AcademicAssessment_teacherProfileId_idx" ON "AcademicAssessment"("teacherProfileId");

-- CreateIndex
CREATE INDEX "AcademicAssessment_subjectName_idx" ON "AcademicAssessment"("subjectName");

-- CreateIndex
CREATE INDEX "AcademicAssessment_assessmentDate_idx" ON "AcademicAssessment"("assessmentDate");

-- CreateIndex
CREATE INDEX "SubjectProgressObservation_studentId_idx" ON "SubjectProgressObservation"("studentId");

-- CreateIndex
CREATE INDEX "SubjectProgressObservation_classroomId_idx" ON "SubjectProgressObservation"("classroomId");

-- CreateIndex
CREATE INDEX "SubjectProgressObservation_subjectName_idx" ON "SubjectProgressObservation"("subjectName");

-- CreateIndex
CREATE INDEX "TutoringPackage_classroomId_idx" ON "TutoringPackage"("classroomId");

-- CreateIndex
CREATE INDEX "TutoringPackage_status_idx" ON "TutoringPackage"("status");

-- CreateIndex
CREATE INDEX "CommissionRule_effectiveFrom_idx" ON "CommissionRule"("effectiveFrom");

-- CreateIndex
CREATE INDEX "PaymentOrder_parentUserId_idx" ON "PaymentOrder"("parentUserId");

-- CreateIndex
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentAttempt_orderId_idx" ON "PaymentAttempt"("orderId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_providerReference_idx" ON "PaymentAttempt"("providerReference");

-- CreateIndex
CREATE INDEX "PaymentProviderEvent_attemptId_idx" ON "PaymentProviderEvent"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherEarning_sessionId_key" ON "TeacherEarning"("sessionId");

-- CreateIndex
CREATE INDEX "TeacherEarning_teacherProfileId_idx" ON "TeacherEarning"("teacherProfileId");

-- CreateIndex
CREATE INDEX "TeacherEarning_sessionId_idx" ON "TeacherEarning"("sessionId");

-- CreateIndex
CREATE INDEX "TeacherEarning_isPaidOut_idx" ON "TeacherEarning"("isPaidOut");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_paymentReference_key" ON "Payout"("paymentReference");

-- CreateIndex
CREATE INDEX "Payout_teacherProfileId_idx" ON "Payout"("teacherProfileId");

-- CreateIndex
CREATE INDEX "Payout_paymentReference_idx" ON "Payout"("paymentReference");

-- CreateIndex
CREATE INDEX "PaymentLedgerEntry_orderId_idx" ON "PaymentLedgerEntry"("orderId");

-- CreateIndex
CREATE INDEX "PaymentLedgerEntry_type_idx" ON "PaymentLedgerEntry"("type");

-- CreateIndex
CREATE INDEX "Rating_teacherProfileId_idx" ON "Rating"("teacherProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_teacherProfileId_parentProfileId_key" ON "Rating"("teacherProfileId", "parentProfileId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Availability_teacherProfileId_idx" ON "Availability"("teacherProfileId");

-- CreateIndex
CREATE INDEX "Availability_dayOfWeek_idx" ON "Availability"("dayOfWeek");

-- CreateIndex
CREATE INDEX "Attachment_classroomId_idx" ON "Attachment"("classroomId");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE INDEX "Attachment_uploaderId_idx" ON "Attachment"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundCase_disputeId_key" ON "RefundCase"("disputeId");

-- CreateIndex
CREATE INDEX "RefundCase_orderId_idx" ON "RefundCase"("orderId");

-- CreateIndex
CREATE INDEX "RefundCase_status_idx" ON "RefundCase"("status");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInvitationToken" ADD CONSTRAINT "AccountInvitationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGradeLevel" ADD CONSTRAINT "TeacherGradeLevel_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherGradeLevel" ADD CONSTRAINT "TeacherGradeLevel_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherDocument" ADD CONSTRAINT "TeacherDocument_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherPricingOffer" ADD CONSTRAINT "TeacherPricingOffer_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringRequest" ADD CONSTRAINT "TutoringRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringRequest" ADD CONSTRAINT "TutoringRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApplication" ADD CONSTRAINT "TeacherApplication_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TutoringRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApplication" ADD CONSTRAINT "TeacherApplication_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherApplication" ADD CONSTRAINT "TeacherApplication_pricingOfferId_fkey" FOREIGN KEY ("pricingOfferId") REFERENCES "TeacherPricingOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TutoringRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_assignedByAdminId_fkey" FOREIGN KEY ("assignedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonSession" ADD CONSTRAINT "LessonSession_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TutoringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonReport" ADD CONSTRAINT "LessonReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonApproval" ADD CONSTRAINT "LessonApproval_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonDispute" ADD CONSTRAINT "LessonDispute_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomMessage" ADD CONSTRAINT "ClassroomMessage_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomMessage" ADD CONSTRAINT "ClassroomMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkAssignment" ADD CONSTRAINT "HomeworkAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicAssessment" ADD CONSTRAINT "AcademicAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicAssessment" ADD CONSTRAINT "AcademicAssessment_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicAssessment" ADD CONSTRAINT "AcademicAssessment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicAssessment" ADD CONSTRAINT "AcademicAssessment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProgressObservation" ADD CONSTRAINT "SubjectProgressObservation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProgressObservation" ADD CONSTRAINT "SubjectProgressObservation_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectProgressObservation" ADD CONSTRAINT "SubjectProgressObservation_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutoringPackage" ADD CONSTRAINT "TutoringPackage_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TutoringPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_pricingOfferId_fkey" FOREIGN KEY ("pricingOfferId") REFERENCES "TeacherPricingOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentProviderEvent" ADD CONSTRAINT "PaymentProviderEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherEarning" ADD CONSTRAINT "TeacherEarning_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherEarning" ADD CONSTRAINT "TeacherEarning_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherEarning" ADD CONSTRAINT "TeacherEarning_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLedgerEntry" ADD CONSTRAINT "PaymentLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ClassroomMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundCase" ADD CONSTRAINT "RefundCase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundCase" ADD CONSTRAINT "RefundCase_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LessonSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundCase" ADD CONSTRAINT "RefundCase_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "LessonDispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

