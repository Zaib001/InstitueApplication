import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import {
  ClassroomService,
  ClassroomServiceError,
} from "@/lib/classroom/classroom-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const resolvedParams = await Promise.resolve(params);
    const requestId = resolvedParams.id;
    const applicationId = resolvedParams.applicationId;

    const result = await ClassroomService.createClassroomFromParentSelection({
      requestId,
      applicationId,
      parentUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      classroom: result.classroom,
      request: result.request,
      application: result.application,
    });
  } catch (error) {
    if (error instanceof ClassroomServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error accepting application:", error);
    return NextResponse.json(
      { error: "Erreur interne lors de la sélection du professeur" },
      { status: 500 }
    );
  }
}

