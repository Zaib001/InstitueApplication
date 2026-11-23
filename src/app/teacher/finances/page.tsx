import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { TeacherFinancesClient } from "@/components/teacher/TeacherFinancesClient";
import { EarningsEligibilityService } from "@/lib/finance/earnings-eligibility-service";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export const dynamic = "force-dynamic";

export default async function TeacherFinancesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/finances");
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
  });

  if (!teacherProfile) {
    redirect("/teacher/onboarding");
  }

  const summary = await EarningsEligibilityService.getTeacherEarningsSummary(
    teacherProfile.id
  );
  const destinations = await TeacherPayoutService.getTeacherDestinations(
    teacherProfile.id
  );

  const formattedEarnings = summary.earnings.map((e) => ({
    id: e.id,
    sessionId: e.sessionId,
    lessonDate: e.session.scheduledStart.toISOString(),
    subjectName: e.session.classroom.subjectName,
    studentName: e.session.classroom.student.fullName,
    studentGrade: e.session.classroom.student.gradeLevel || "Standard",
    grossAmountGnf: e.grossAmountGnf,
    commissionRatePercent: e.commissionRatePercent,
    platformCommissionGnf: e.platformCommissionGnf,
    teacherNetGnf: e.teacherNetGnf,
    earningsStatus: e.session.earningsStatus,
    isPaidOut: e.isPaidOut,
    validatedAt:
      e.session.approval?.approvedAt?.toISOString() || e.createdAt.toISOString(),
  }));

  const formattedPendingSessions = summary.pendingSessions.map((ps) => ({
    id: ps.id,
    scheduledStart: ps.scheduledStart.toISOString(),
    subjectName: ps.classroom.subjectName,
    studentName: ps.classroom.student.fullName,
    durationMinutes: ps.durationMinutes,
    estimatedGrossGnf: ps.allocatedAmountGnf || ps.package?.baseSessionRateGnf || 0,
    status: ps.status,
  }));

  const formattedPayouts = summary.payouts.map((p) => ({
    id: p.id,
    amountGnf: p.amountGnf,
    paymentReference: p.paymentReference,
    status: p.status,
    method: p.channel,
    createdAt: p.createdAt.toISOString(),
    confirmedAt: p.reconciledAt ? p.reconciledAt.toISOString() : null,
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherFinancesClient
        summary={{
          availableGnf: summary.availableGnf,
          pendingValidationGnf: summary.pendingValidationGnf,
          reservedGnf: summary.reservedGnf,
          paidGnf: summary.paidGnf,
          totalEarnedHistoricalGnf: summary.totalEarnedHistoricalGnf,
        }}
        earnings={formattedEarnings}
        pendingSessions={formattedPendingSessions}
        payouts={formattedPayouts}
        destinations={destinations.map((d) => ({
          id: d.id,
          operator: d.operator,
          phone: d.phone,
          accountHolderName: d.accountHolderName,
          isDefault: d.isDefault,
          verificationStatus: d.verificationStatus,
        }))}
      />
    </LightDashboardLayout>
  );
}
