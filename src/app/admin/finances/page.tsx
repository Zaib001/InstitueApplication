import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminFinancesClient } from "@/components/admin/AdminFinancesClient";
import { DoubleEntryLedger } from "@/lib/finance/double-entry-ledger";
import { CommissionPolicyService } from "@/lib/finance/commission-policy-service";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";
import { RefundService } from "@/lib/finance/refund-service";

export const dynamic = "force-dynamic";

export default async function AdminFinancesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/finances");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  // 1. Fetch Double-Entry Ledger Balances
  const accounts = await DoubleEntryLedger.getAccountBalances();
  const totalDebitsGnf = accounts.reduce((s, a) => s + a.totalDebitsGnf, 0);
  const totalCreditsGnf = accounts.reduce((s, a) => s + a.totalCreditsGnf, 0);

  // 2. Fetch Policies
  const activePolicy = await CommissionPolicyService.getActivePolicy();
  const policies = await CommissionPolicyService.listPolicies();

  // 3. Fetch Classroom Fundings
  const fundingRecords = await prisma.classroomFunding.findMany({
    include: {
      classroom: {
        include: {
          student: true,
          teacherProfile: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formattedFundings = fundingRecords.map((f) => ({
    id: f.id,
    classroomId: f.classroomId,
    subjectName: f.classroom.subjectName,
    studentName: f.classroom.student.fullName,
    teacherName: f.classroom.teacherProfile.user.fullName,
    totalFundedAmountGnf: f.totalFundedAmountGnf,
    allocatedAmountGnf: f.allocatedAmountGnf,
    availableBalanceGnf: f.availableBalanceGnf,
    refundedAmountGnf: f.refundedAmountGnf,
    status: f.status,
  }));

  // 4. Provider capabilities
  const providers = PaymentProviderRegistry.getAllCapabilities();

  // 5. Fetch Teacher Earnings, Pending Sessions, Payouts & Refunds for M3.04/M3.05 Visibility
  const [allEarnings, pendingValidationSessions, confirmedPayouts, allPayouts, allRefundCases] = await Promise.all([
    prisma.teacherEarning.findMany({
      include: {
        teacherProfile: {
          include: { user: true },
        },
        session: {
          include: {
            classroom: {
              include: {
                student: true,
              },
            },
            approval: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lessonSession.findMany({
      where: {
        status: "TEACHER_COMPLETED",
        earningsStatus: "PENDING_VALIDATION",
      },
      include: {
        classroom: {
          include: {
            student: true,
            teacherProfile: { include: { user: true } },
          },
        },
        package: true,
      },
    }),
    prisma.payout.findMany({
      where: { status: "PAID" },
    }),
    TeacherPayoutService.getAllPayoutsForAdmin(),
    RefundService.getAllRefundCasesForAdmin(),
  ]);

  const getBal = (code: string) => accounts.find((a) => a.accountCode === code)?.netBalanceGnf || 0;

  const kpis = {
    totalCollectionsGnf: Math.abs(getBal("1010_PARENT_CLEARING")),
    classroomPrepaidLiabilitiesGnf: Math.abs(getBal("2020_CLASSROOM_FUNDS")),
    teacherPayableBalancesGnf: Math.abs(getBal("2030_TEACHER_PAYABLE")),
    recognizedPlatformCommissionGnf: Math.abs(getBal("4010_PLATFORM_COMMISSION")),
    reservedPayoutsGnf: Math.abs(getBal("2040_PAYOUT_LIABILITY")),
    unallocatedEscrowGnf: Math.abs(getBal("2010_UNALLOCATED_ESCROW")),
    confirmedPayoutsGnf: confirmedPayouts.reduce((sum, p) => sum + p.amountGnf, 0),
    earningsAwaitingValidationGnf: pendingValidationSessions.reduce((sum, s) => {
      const gross = s.allocatedAmountGnf || s.package?.baseSessionRateGnf || 0;
      const rate = s.package?.commissionRatePercent || 15;
      return sum + (gross - Math.round((gross * rate) / 100));
    }, 0),
  };

  const formattedEarnings = allEarnings.map((e) => ({
    id: e.id,
    sessionId: e.sessionId,
    teacherProfileId: e.teacherProfileId,
    teacherName: e.teacherProfile.user.fullName,
    teacherEmail: e.teacherProfile.user.email,
    studentName: e.session.classroom.student.fullName,
    subjectName: e.session.classroom.subjectName,
    classroomId: e.session.classroomId,
    lessonDate: e.session.scheduledStart.toISOString(),
    grossAmountGnf: e.grossAmountGnf,
    commissionRatePercent: e.commissionRatePercent,
    platformCommissionGnf: e.platformCommissionGnf,
    teacherNetGnf: e.teacherNetGnf,
    earningsStatus: e.session.earningsStatus,
    isPaidOut: e.isPaidOut,
    validatedAt: e.session.approval?.approvedAt?.toISOString() || e.createdAt.toISOString(),
  }));

  const formattedPayouts = allPayouts.map((p) => ({
    id: p.id,
    teacherProfileId: p.teacherProfileId,
    teacherName: p.teacherProfile?.user?.fullName || "Enseignant",
    teacherEmail: p.teacherProfile?.user?.email || "",
    amountGnf: p.amountGnf,
    channel: p.channel,
    beneficiaryName: p.beneficiaryName,
    beneficiaryPhone: p.beneficiaryPhone,
    status: p.status,
    disbursementMode: p.disbursementMode,
    paymentReference: p.paymentReference,
    providerDisbursementRef: p.providerDisbursementRef,
    rejectionReason: p.rejectionReason,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    approvedAt: p.approvedAt?.toISOString() || null,
    reconciledAt: p.reconciledAt?.toISOString() || null,
    earningsCount: p.earnings.length,
    destination: p.destination
      ? {
          id: p.destination.id,
          operator: p.destination.operator,
          phone: p.destination.phone,
          accountHolderName: p.destination.accountHolderName,
        }
      : null,
  }));

  const formattedRefundCases = allRefundCases.map((rc) => ({
    id: rc.id,
    orderId: rc.orderId,
    classroomId: rc.classroomId,
    disputeId: rc.disputeId,
    reason: rc.reason,
    amountGnf: rc.requestedAmountGnf,
    status: rc.status,
    adminDecisionNotes: rc.adminDecisionNotes,
    createdAt: rc.createdAt.toISOString(),
    processedAt: rc.processedAt?.toISOString() || null,
    classroom: rc.classroom
      ? {
          id: rc.classroom.id,
          subjectName: rc.classroom.subjectName,
          studentName: rc.classroom.student.fullName,
          parentName: rc.classroom.student.parent.user.fullName,
          parentEmail: rc.classroom.student.parent.user.email,
        }
      : null,
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminFinancesClient
        accounts={accounts}
        trialBalance={{
          totalDebitsGnf,
          totalCreditsGnf,
          isBalanced: totalDebitsGnf === totalCreditsGnf,
        }}
        activePolicy={
          activePolicy
            ? {
                id: activePolicy.id,
                version: activePolicy.version,
                platformPercent: activePolicy.platformPercent,
                teacherPercent: activePolicy.teacherPercent,
                description: activePolicy.description,
                isActive: activePolicy.isActive,
                effectiveFrom: activePolicy.effectiveFrom.toISOString(),
              }
            : null
        }
        policies={policies.map((p) => ({
          id: p.id,
          version: p.version,
          platformPercent: p.platformPercent,
          teacherPercent: p.teacherPercent,
          description: p.description,
          isActive: p.isActive,
          effectiveFrom: p.effectiveFrom.toISOString(),
        }))}
        fundings={formattedFundings}
        providers={providers}
        kpis={kpis}
        teacherEarnings={formattedEarnings}
        payouts={formattedPayouts}
        refundCases={formattedRefundCases}
      />
    </LightDashboardLayout>
  );
}
