import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { EarningsEligibilityService } from "@/lib/finance/earnings-eligibility-service";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux enseignants" }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 });
    }

    const summary = await EarningsEligibilityService.getTeacherEarningsSummary(teacherProfile.id);
    const destinations = await TeacherPayoutService.getTeacherDestinations(teacherProfile.id);

    return NextResponse.json({
      success: true,
      summary: {
        availableGnf: summary.availableGnf,
        pendingValidationGnf: summary.pendingValidationGnf,
        reservedGnf: summary.reservedGnf,
        paidGnf: summary.paidGnf,
        totalEarnedHistoricalGnf: summary.totalEarnedHistoricalGnf,
      },
      earnings: summary.earnings.map((e) => ({
        id: e.id,
        sessionId: e.sessionId,
        lessonDate: e.session.scheduledStart.toISOString(),
        subjectName: e.session.classroom.subjectName,
        studentName: e.session.classroom.student.fullName,
        studentGrade: e.session.classroom.student.gradeLevel || "Non spécifié",
        grossAmountGnf: e.grossAmountGnf,
        commissionRatePercent: e.commissionRatePercent,
        platformCommissionGnf: e.platformCommissionGnf,
        teacherNetGnf: e.teacherNetGnf,
        earningsStatus: e.session.earningsStatus,
        isPaidOut: e.isPaidOut,
        validatedAt: e.session.approval?.approvedAt?.toISOString() || e.createdAt.toISOString(),
      })),
      pendingSessions: summary.pendingSessions.map((ps) => ({
        id: ps.id,
        scheduledStart: ps.scheduledStart.toISOString(),
        subjectName: ps.classroom.subjectName,
        studentName: ps.classroom.student.fullName,
        durationMinutes: ps.durationMinutes,
        estimatedGrossGnf: ps.allocatedAmountGnf || ps.package?.baseSessionRateGnf || 0,
        status: ps.status,
      })),
      payouts: summary.payouts.map((p) => ({
        id: p.id,
        amountGnf: p.amountGnf,
        paymentReference: p.paymentReference,
        status: p.status,
        method: p.channel,
        createdAt: p.createdAt.toISOString(),
        confirmedAt: p.reconciledAt ? p.reconciledAt.toISOString() : null,
      })),
      destinations: destinations.map((d) => ({
        id: d.id,
        operator: d.operator,
        phone: d.phone,
        accountHolderName: d.accountHolderName,
        isDefault: d.isDefault,
        verificationStatus: d.verificationStatus,
      })),
    });
  } catch (err: any) {
    console.error("GET /api/teacher/finances error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de la récupération des revenus" },
      { status: 500 }
    );
  }
}
