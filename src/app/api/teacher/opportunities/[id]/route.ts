import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTeacherAuth } from "@/lib/auth/teacher-guard";
import { calculateOpportunityMatch } from "@/lib/marketplace/matching";

/**
 * GET /api/teacher/opportunities/[id]
 * Retrieves details for a specific tutoring opportunity.
 * Protects parent and student confidentiality.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTeacherAuth();
    if (auth.errorResponse) return auth.errorResponse;

    const { teacherProfile } = auth.context;
    const { id } = await params;

    const fullTeacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfile.id },
      include: {
        subjects: { include: { subject: true } },
        gradeLevels: { include: { gradeLevel: true } },
      },
    });

    if (!fullTeacher) {
      return NextResponse.json({ error: "Profil enseignant introuvable." }, { status: 404 });
    }

    const tutoringRequest = await prisma.tutoringRequest.findUnique({
      where: { id },
      select: {
        id: true,
        subjectId: true,
        subjectName: true,
        customSubject: true,
        cycle: true,
        customCycle: true,
        gradeLevelName: true,
        mode: true,
        frequency: true,
        preferredSchedule: true,
        sessionDurationMinutes: true,
        budgetGnf: true,
        budgetType: true,
        city: true,
        commune: true,
        neighborhood: true,
        learningGoals: true,
        publishedAt: true,
        createdAt: true,
        status: true,
        student: {
          select: {
            fullName: true,
            gradeLevel: true,
          },
        },
      },
    });

    if (!tutoringRequest) {
      return NextResponse.json({ error: "Demande de cours introuvable." }, { status: 404 });
    }

    // Check if teacher has applied
    const existingApplication = await prisma.teacherApplication.findUnique({
      where: {
        requestId_teacherProfileId: {
          requestId: id,
          teacherProfileId: teacherProfile.id,
        },
      },
      select: {
        id: true,
        pitchMessage: true,
        proposedRateGnf: true,
        proposedRateType: true,
        sessionArrangement: true,
        availabilityNotes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        withdrawnAt: true,
        rejectionReason: true,
      },
    });

    // If request is not OPEN and teacher hasn't applied, it's not available
    if (tutoringRequest.status !== "OPEN" && !existingApplication) {
      return NextResponse.json(
        { error: "Cette opportunité n'est plus ouverte aux candidatures.", status: tutoringRequest.status },
        { status: 410 }
      );
    }

    const matchResult = calculateOpportunityMatch(
      {
        id: fullTeacher.id,
        verificationStatus: fullTeacher.verificationStatus,
        city: fullTeacher.city,
        serviceArea: fullTeacher.serviceArea,
        isHomeAvailable: fullTeacher.isHomeAvailable,
        isOnlineAvailable: fullTeacher.isOnlineAvailable,
        customSubject: fullTeacher.customSubject,
        customGradeLevel: fullTeacher.customGradeLevel,
        subjects: fullTeacher.subjects,
        gradeLevels: fullTeacher.gradeLevels,
      },
      {
        id: tutoringRequest.id,
        subjectId: tutoringRequest.subjectId,
        subjectName: tutoringRequest.subjectName,
        customSubject: tutoringRequest.customSubject,
        cycle: tutoringRequest.cycle,
        customCycle: tutoringRequest.customCycle,
        gradeLevelName: tutoringRequest.gradeLevelName,
        mode: tutoringRequest.mode,
        city: tutoringRequest.city,
        commune: tutoringRequest.commune,
        budgetGnf: tutoringRequest.budgetGnf,
        status: tutoringRequest.status,
      }
    );

    return NextResponse.json({
      opportunity: {
        ...tutoringRequest,
        studentDisplay: `${tutoringRequest.student.fullName.split(" ")[0]} (${tutoringRequest.gradeLevelName})`,
        matchResult,
        existingApplication,
        isTeacherApproved: fullTeacher.verificationStatus === "APPROVED",
        teacherProfileSnapshot: {
          hourlyRateGnf: fullTeacher.hourlyRateGnf,
          monthlyPackageRateGnf: fullTeacher.monthlyPackageRateGnf,
          city: fullTeacher.city,
        },
      },
    });
  } catch (error) {
    console.error("[GET /api/teacher/opportunities/[id]] Error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement de l'opportunité." },
      { status: 500 }
    );
  }
}
