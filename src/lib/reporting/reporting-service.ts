import { prisma } from "@/lib/db/prisma";
import {
  DisputeStatus,
  LessonAttendance,
  ReportStatus,
  SessionStatus,
  TeacherVerificationStatus,
  UserRole,
  NotificationEventType,
  NotificationPriority,
} from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";

export class ReportingServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ReportingServiceError";
    this.statusCode = statusCode;
  }
}

export interface SaveDraftReportParams {
  sessionId: string;
  topicsCovered: string;
  learningObjectives?: string | null;
  studentEffort?: string | null;
  teacherNotes?: string | null;
  strengths?: string | null;
  areasForImprovement?: string | null;
  homeworkGiven?: string | null;
  homeworkDueDate?: string | Date | null;
  nextLessonRecommendations?: string | null;
  assessmentTitle?: string | null;
  assessmentScore?: number | null;
  assessmentMaxScore?: number | null;
  assessmentComment?: string | null;
  progressRating?: number | null;
  attendanceStatus?: LessonAttendance | null;
  actualDurationMinutes?: number | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface SubmitReportParams {
  sessionId: string;
  topicsCovered: string;
  learningObjectives: string;
  studentEffort: string;
  teacherNotes?: string | null;
  strengths: string;
  areasForImprovement: string;
  homeworkGiven?: string | null;
  homeworkDueDate?: string | Date | null;
  nextLessonRecommendations?: string | null;
  assessmentTitle?: string | null;
  assessmentScore?: number | null;
  assessmentMaxScore?: number | null;
  assessmentComment?: string | null;
  progressRating?: number | null;
  attendanceStatus: LessonAttendance;
  actualDurationMinutes?: number | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface ApproveSessionParams {
  sessionId: string;
  feedbackNote?: string | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface DisputeSessionParams {
  sessionId: string;
  category: string;
  reason: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface DisputeResponseParams {
  sessionId: string;
  teacherResponse: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface ResolveDisputeParams {
  disputeId: string;
  resolutionType: "RESOLVED_VALIDATED" | "RESOLVED_REFUNDED" | "RESOLVED_RESCHEDULED";
  adminNote: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface EarningsEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  sessionDetails?: {
    sessionId: string;
    classroomId: string;
    isFunded: boolean;
    sessionStatus: SessionStatus;
    reportStatus?: ReportStatus | null;
    allocatedAmountGnf: number;
    platformCommissionGnf: number;
    teacherNetGnf: number;
  };
}

export class ReportingService {
  /**
   * Helper: Parse dates safely
   */
  private static parseDate(dateInput?: string | Date | null): Date | null {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  /**
   * P11.03 / P11.04: Save or update a draft lesson report
   */
  static async saveDraftReport({
    sessionId,
    topicsCovered,
    learningObjectives,
    studentEffort,
    teacherNotes,
    strengths,
    areasForImprovement,
    homeworkGiven,
    homeworkDueDate,
    nextLessonRecommendations,
    assessmentTitle,
    assessmentScore,
    assessmentMaxScore,
    assessmentComment,
    progressRating,
    attendanceStatus,
    actualDurationMinutes,
    actorUserId,
    actorRole,
  }: SaveDraftReportParams) {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: true,
            student: { include: { parent: true } },
          },
        },
        report: true,
      },
    });

    if (!session) {
      throw new ReportingServiceError("Séance introuvable.", 404);
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new ReportingServiceError("Impossible de rédiger un rapport pour une séance annulée.", 400);
    }

    // Role check
    if (actorRole === UserRole.TEACHER && session.classroom.teacherProfile.userId !== actorUserId) {
      throw new ReportingServiceError("Accès refusé. Vous n'êtes pas l'enseignant assigné à cette classe.", 403);
    }
    if (actorRole === UserRole.PARENT) {
      throw new ReportingServiceError("Les parents ne peuvent pas rédiger de compte rendu de séance.", 403);
    }

    // Cannot edit an already validated report
    if (session.report && session.report.status === ReportStatus.VALIDATED) {
      throw new ReportingServiceError("Ce compte rendu a déjà été validé par le parent et ne peut être modifié.", 400);
    }

    const parsedDueDate = this.parseDate(homeworkDueDate);

    const report = await prisma.$transaction(async (tx) => {
      // 1. Update attendance on the session if specified
      if (attendanceStatus || actualDurationMinutes) {
        await tx.lessonSession.update({
          where: { id: sessionId },
          data: {
            attendanceStatus: attendanceStatus || session.attendanceStatus,
            actualDurationMinutes: actualDurationMinutes || session.actualDurationMinutes,
            attendanceRecordedAt: new Date(),
            attendanceRecordedById: actorUserId,
          },
        });
      }

      // 2. Upsert Draft Report
      const upserted = await tx.lessonReport.upsert({
        where: { sessionId },
        create: {
          sessionId,
          status: ReportStatus.DRAFT,
          topicsCovered: topicsCovered || "Brouillon en cours",
          learningObjectives,
          studentEffort,
          teacherNotes,
          strengths,
          areasForImprovement,
          homeworkGiven,
          homeworkDueDate: parsedDueDate,
          nextLessonRecommendations,
          assessmentTitle,
          assessmentScore: assessmentScore !== undefined && assessmentScore !== null ? Number(assessmentScore) : null,
          assessmentMaxScore: assessmentMaxScore !== undefined && assessmentMaxScore !== null ? Number(assessmentMaxScore) : null,
          assessmentComment,
          progressRating: progressRating !== undefined && progressRating !== null ? Number(progressRating) : null,
          draftSavedAt: new Date(),
        },
        update: {
          status: ReportStatus.DRAFT,
          topicsCovered: topicsCovered || "Brouillon en cours",
          learningObjectives,
          studentEffort,
          teacherNotes,
          strengths,
          areasForImprovement,
          homeworkGiven,
          homeworkDueDate: parsedDueDate,
          nextLessonRecommendations,
          assessmentTitle,
          assessmentScore: assessmentScore !== undefined && assessmentScore !== null ? Number(assessmentScore) : null,
          assessmentMaxScore: assessmentMaxScore !== undefined && assessmentMaxScore !== null ? Number(assessmentMaxScore) : null,
          assessmentComment,
          progressRating: progressRating !== undefined && progressRating !== null ? Number(progressRating) : null,
          draftSavedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "LESSON_REPORT_DRAFT_SAVED",
          entityType: "LessonReport",
          entityId: upserted.id,
          detailsJson: JSON.stringify({ sessionId, draftSavedAt: new Date().toISOString() }),
        },
      });

      return upserted;
    });

    return report;
  }

  /**
   * P11.03 / P11.04: Submit complete lesson report for parent validation
   */
  static async submitLessonReport({
    sessionId,
    topicsCovered,
    learningObjectives,
    studentEffort,
    teacherNotes,
    strengths,
    areasForImprovement,
    homeworkGiven,
    homeworkDueDate,
    nextLessonRecommendations,
    assessmentTitle,
    assessmentScore,
    assessmentMaxScore,
    assessmentComment,
    progressRating,
    attendanceStatus,
    actualDurationMinutes,
    actorUserId,
    actorRole,
  }: SubmitReportParams) {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: { include: { user: true } },
            student: { include: { parent: { include: { user: true } } } },
          },
        },
        report: true,
      },
    });

    if (!session) {
      throw new ReportingServiceError("Séance introuvable.", 404);
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new ReportingServiceError("Impossible de soumettre un rapport pour une séance annulée.", 400);
    }

    // Role check
    if (actorRole === UserRole.TEACHER) {
      if (session.classroom.teacherProfile.userId !== actorUserId) {
        throw new ReportingServiceError("Accès refusé. Vous n'êtes pas l'enseignant assigné à cette classe.", 403);
      }
      if (session.classroom.teacherProfile.verificationStatus !== TeacherVerificationStatus.APPROVED) {
        throw new ReportingServiceError("Votre profil d'enseignant doit être approuvé pour soumettre des comptes rendus.", 403);
      }
    } else if (actorRole !== UserRole.ADMIN) {
      throw new ReportingServiceError("Seuls les enseignants autorisés ou les administrateurs peuvent soumettre des comptes rendus.", 403);
    }

    // Protection against modifying already validated reports
    if (session.report && session.report.status === ReportStatus.VALIDATED) {
      throw new ReportingServiceError("Ce compte rendu a déjà été validé par le parent et ne peut être altéré.", 400);
    }

    // Validation of required educational fields
    if (!topicsCovered || topicsCovered.trim().length < 5) {
      throw new ReportingServiceError("Veuillez renseigner les sujets abordés lors de la séance (au moins 5 caractères).", 400);
    }
    if (!learningObjectives || learningObjectives.trim().length < 5) {
      throw new ReportingServiceError("Veuillez préciser les objectifs pédagogiques visés (au moins 5 caractères).", 400);
    }
    if (!studentEffort || studentEffort.trim().length < 2) {
      throw new ReportingServiceError("Veuillez évaluer la participation ou l'implication de l'élève.", 400);
    }
    if (!strengths || strengths.trim().length < 5) {
      throw new ReportingServiceError("Veuillez noter les points forts de l'élève constatés (au moins 5 caractères).", 400);
    }
    if (!areasForImprovement || areasForImprovement.trim().length < 5) {
      throw new ReportingServiceError("Veuillez indiquer les axes de progrès ou difficultés rencontrées (au moins 5 caractères).", 400);
    }

    if (assessmentScore !== undefined && assessmentScore !== null) {
      const maxScore = assessmentMaxScore !== undefined && assessmentMaxScore !== null ? Number(assessmentMaxScore) : 20;
      if (maxScore <= 0) {
        throw new ReportingServiceError("La note maximale doit être strictement positive.", 400);
      }
      if (assessmentScore < 0 || assessmentScore > maxScore) {
        throw new ReportingServiceError(`La note obtenue (${assessmentScore}) doit être comprise entre 0 et la note maximale (${maxScore}).`, 400);
      }
    }

    if (progressRating !== undefined && progressRating !== null) {
      const rating = Number(progressRating);
      if (rating < 1 || rating > 5) {
        throw new ReportingServiceError("L'évaluation globale doit être comprise entre 1 et 5 étoiles.", 400);
      }
    }

    const parsedDueDate = this.parseDate(homeworkDueDate);
    const duration = actualDurationMinutes && actualDurationMinutes > 0 ? actualDurationMinutes : session.durationMinutes;

    const result = await prisma.$transaction(async (tx) => {
      // 1. If existing report was already submitted (revision), preserve old snapshot
      let newVersion = 1;
      let originalSnapshot: string | null = null;
      if (session.report) {
        newVersion = session.report.version + 1;
        originalSnapshot = JSON.stringify({
          topicsCovered: session.report.topicsCovered,
          learningObjectives: session.report.learningObjectives,
          strengths: session.report.strengths,
          areasForImprovement: session.report.areasForImprovement,
          homeworkGiven: session.report.homeworkGiven,
          submittedAt: session.report.submittedAt,
        });
      }

      // 2. Upsert LessonReport
      const report = await tx.lessonReport.upsert({
        where: { sessionId },
        create: {
          sessionId,
          status: ReportStatus.SUBMITTED,
          topicsCovered: topicsCovered.trim(),
          learningObjectives: learningObjectives.trim(),
          studentEffort: studentEffort.trim(),
          teacherNotes: teacherNotes ? teacherNotes.trim() : null,
          strengths: strengths.trim(),
          areasForImprovement: areasForImprovement.trim(),
          homeworkGiven: homeworkGiven ? homeworkGiven.trim() : null,
          homeworkDueDate: parsedDueDate,
          nextLessonRecommendations: nextLessonRecommendations ? nextLessonRecommendations.trim() : null,
          assessmentTitle: assessmentTitle ? assessmentTitle.trim() : null,
          assessmentScore: assessmentScore !== undefined && assessmentScore !== null ? Number(assessmentScore) : null,
          assessmentMaxScore: assessmentMaxScore !== undefined && assessmentMaxScore !== null ? Number(assessmentMaxScore) : null,
          assessmentComment: assessmentComment ? assessmentComment.trim() : null,
          progressRating: progressRating !== undefined && progressRating !== null ? Number(progressRating) : null,
          version: newVersion,
          originalReportJson: originalSnapshot,
          submittedAt: new Date(),
        },
        update: {
          status: ReportStatus.SUBMITTED,
          topicsCovered: topicsCovered.trim(),
          learningObjectives: learningObjectives.trim(),
          studentEffort: studentEffort.trim(),
          teacherNotes: teacherNotes ? teacherNotes.trim() : null,
          strengths: strengths.trim(),
          areasForImprovement: areasForImprovement.trim(),
          homeworkGiven: homeworkGiven ? homeworkGiven.trim() : null,
          homeworkDueDate: parsedDueDate,
          nextLessonRecommendations: nextLessonRecommendations ? nextLessonRecommendations.trim() : null,
          assessmentTitle: assessmentTitle ? assessmentTitle.trim() : null,
          assessmentScore: assessmentScore !== undefined && assessmentScore !== null ? Number(assessmentScore) : null,
          assessmentMaxScore: assessmentMaxScore !== undefined && assessmentMaxScore !== null ? Number(assessmentMaxScore) : null,
          assessmentComment: assessmentComment ? assessmentComment.trim() : null,
          progressRating: progressRating !== undefined && progressRating !== null ? Number(progressRating) : null,
          version: newVersion,
          originalReportJson: originalSnapshot || session.report?.originalReportJson,
          submittedAt: new Date(),
        },
      });

      // 3. Advance LessonSession status to TEACHER_COMPLETED
      const updatedSession = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.TEACHER_COMPLETED,
          attendanceStatus,
          actualDurationMinutes: duration,
          attendanceRecordedAt: new Date(),
          attendanceRecordedById: actorUserId,
        },
      });

      // 4. In-App Notification to Parent
      const parentUserId = session.classroom.student.parent.userId;
      const teacherName = session.classroom.teacherProfile.user.fullName;
      const subjectName = session.classroom.subjectName;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.LESSON_REPORT_SUBMITTED,
          recipientUserId: parentUserId,
          entityType: "LessonSession",
          entityId: sessionId,
          title: "Compte rendu de cours disponible",
          message: `Le professeur ${teacherName} a déposé le compte rendu de la séance de ${subjectName}. Vous pouvez maintenant le consulter et valider le cours.`,
          linkUrl: `/parent/reports?sessionId=${sessionId}`,
          priority: NotificationPriority.HIGH,
          emailPayload: {
            teacherName,
            subjectName,
            sessionId,
          },
        },
        tx
      );

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "LESSON_REPORT_SUBMITTED",
          entityType: "LessonReport",
          entityId: report.id,
          detailsJson: JSON.stringify({
            sessionId,
            version: newVersion,
            attendanceStatus,
            duration,
          }),
        },
      });

      return { report, session: updatedSession };
    });

    return result;
  }

  /**
   * P11.07: Parent validates/approves a completed session
   */
  static async approveLessonSession({
    sessionId,
    feedbackNote,
    actorUserId,
    actorRole,
  }: ApproveSessionParams) {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: { include: { user: true } },
            student: { include: { parent: true } },
          },
        },
        report: true,
        approval: true,
        dispute: true,
      },
    });

    if (!session) {
      throw new ReportingServiceError("Séance introuvable.", 404);
    }

    // Role check: Only parent owner or admin
    if (actorRole === UserRole.PARENT && session.classroom.student.parent.userId !== actorUserId) {
      throw new ReportingServiceError("Accès refusé. Vous n'êtes pas le parent de l'élève pour cette séance.", 403);
    }

    // Must be in TEACHER_COMPLETED state and report must be SUBMITTED
    if (session.status !== SessionStatus.TEACHER_COMPLETED) {
      if (session.status === SessionStatus.PARENT_APPROVED) {
        throw new ReportingServiceError("Cette séance a déjà été validée.", 400);
      }
      throw new ReportingServiceError(
        "La séance ne peut être validée qu'une fois le compte rendu soumis par le professeur.",
        400
      );
    }

    if (!session.report || session.report.status !== ReportStatus.SUBMITTED) {
      throw new ReportingServiceError("Aucun compte rendu en attente de validation n'a été trouvé.", 400);
    }

    // Prevent double approval
    if (session.approval) {
      throw new ReportingServiceError("Cette séance a déjà été approuvée précédemment.", 400);
    }

    // Prevent approval if unresolved dispute exists
    if (session.dispute && (session.dispute.status === DisputeStatus.OPEN || session.dispute.status === DisputeStatus.UNDER_REVIEW)) {
      throw new ReportingServiceError("Impossible de valider une séance faisant l'objet d'un litige en cours.", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create LessonApproval
      const approval = await tx.lessonApproval.create({
        data: {
          sessionId,
          approvedBy: actorUserId,
          feedbackNote: feedbackNote ? feedbackNote.trim() : null,
          reportVersionReviewed: session.report?.version || 1,
          approvedAt: new Date(),
        },
      });

      // 2. Update LessonReport to VALIDATED
      const updatedReport = await tx.lessonReport.update({
        where: { id: session.report!.id },
        data: {
          status: ReportStatus.VALIDATED,
        },
      });

      // 3. Update LessonSession to PARENT_APPROVED
      const updatedSession = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.PARENT_APPROVED,
        },
      });

      // 4. Notify Teacher
      const teacherUserId = session.classroom.teacherProfile.userId;
      const studentName = session.classroom.student.fullName;
      const subjectName = session.classroom.subjectName;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.LESSON_APPROVED,
          recipientUserId: teacherUserId,
          entityType: "LessonSession",
          entityId: sessionId,
          title: "Séance validée par le parent",
          message: `La famille a officiellement validé la séance de ${subjectName} avec ${studentName}.`,
          linkUrl: `/teacher/reports?sessionId=${sessionId}`,
          priority: NotificationPriority.NORMAL,
          emailPayload: {
            subjectName,
            studentName,
            sessionId,
          },
        },
        tx
      );

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "LESSON_SESSION_APPROVED",
          entityType: "LessonSession",
          entityId: sessionId,
          detailsJson: JSON.stringify({
            approvalId: approval.id,
            reportVersionReviewed: approval.reportVersionReviewed,
          }),
        },
      });

      return { approval, report: updatedReport, session: updatedSession };
    });

    return result;
  }

  /**
   * P11.08: Parent disputes a lesson session
   */
  static async disputeLessonSession({
    sessionId,
    category,
    reason,
    actorUserId,
    actorRole,
  }: DisputeSessionParams) {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: { include: { user: true } },
            student: { include: { parent: true } },
          },
        },
        report: true,
        dispute: true,
      },
    });

    if (!session) {
      throw new ReportingServiceError("Séance introuvable.", 404);
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new ReportingServiceError("Impossible de contester une séance qui a déjà été annulée.", 400);
    }

    // Role check
    if (actorRole === UserRole.PARENT && session.classroom.student.parent.userId !== actorUserId) {
      throw new ReportingServiceError("Accès refusé. Vous n'êtes pas le parent de l'élève pour cette séance.", 403);
    }

    // Cannot reopen an already open dispute
    if (session.dispute && (session.dispute.status === DisputeStatus.OPEN || session.dispute.status === DisputeStatus.UNDER_REVIEW)) {
      throw new ReportingServiceError("Un litige est déjà en cours de traitement pour cette séance.", 400);
    }

    if (!reason || reason.trim().length < 10) {
      throw new ReportingServiceError("Veuillez préciser le motif de contestation (au moins 10 caractères).", 400);
    }

    const cleanCategory = category ? category.trim() : "OTHER";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert LessonDispute
      const dispute = await tx.lessonDispute.upsert({
        where: { sessionId },
        create: {
          sessionId,
          openedBy: actorUserId,
          category: cleanCategory,
          reason: reason.trim(),
          status: DisputeStatus.OPEN,
        },
        update: {
          openedBy: actorUserId,
          category: cleanCategory,
          reason: reason.trim(),
          status: DisputeStatus.OPEN,
          teacherResponse: null,
          teacherRespondedAt: null,
          resolvedAt: null,
          resolvedById: null,
          adminNote: null,
          resolutionType: null,
        },
      });

      // 2. Mark report status as DISPUTED if report exists
      if (session.report) {
        await tx.lessonReport.update({
          where: { id: session.report.id },
          data: { status: ReportStatus.DISPUTED },
        });
      }

      // 3. Mark session as PARENT_DISPUTED
      const updatedSession = await tx.lessonSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.PARENT_DISPUTED },
      });

      // 4. Notify Teacher
      const teacherUserId = session.classroom.teacherProfile.userId;
      const subjectName = session.classroom.subjectName;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.DISPUTE_OPENED,
          recipientUserId: teacherUserId,
          entityType: "LessonSession",
          entityId: sessionId,
          title: "Litige ouvert sur une séance",
          message: `Un litige a été ouvert par le parent pour la séance de ${subjectName}. Vous pouvez consulter les détails et apporter votre explication.`,
          linkUrl: `/teacher/reports?sessionId=${sessionId}`,
          priority: NotificationPriority.URGENT,
          emailPayload: {
            subjectName,
            reason: reason.trim(),
            sessionId,
          },
        },
        tx
      );

      // 5. Notify Admins
      const admins = await tx.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });
      for (const admin of admins) {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.DISPUTE_OPENED,
            recipientUserId: admin.id,
            entityType: "LessonSession",
            entityId: sessionId,
            title: "Nouveau litige de séance à arbitrer",
            message: `Un litige de séance (${cleanCategory}) a été ouvert pour la classe de ${subjectName}.`,
            linkUrl: `/admin/session-disputes`,
            priority: NotificationPriority.HIGH,
            emailPayload: {
              subjectName,
              reason: reason.trim(),
              sessionId,
            },
          },
          tx
        );
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "LESSON_SESSION_DISPUTED",
          entityType: "LessonSession",
          entityId: sessionId,
          detailsJson: JSON.stringify({ disputeId: dispute.id, category: cleanCategory, reason }),
        },
      });

      return { dispute, session: updatedSession };
    });

    return result;
  }

  /**
   * P11.10: Assigned teacher responds to a dispute
   */
  static async respondToDispute({
    sessionId,
    teacherResponse,
    actorUserId,
    actorRole,
  }: DisputeResponseParams) {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: true,
            student: { include: { parent: true } },
          },
        },
        dispute: true,
      },
    });

    if (!session) {
      throw new ReportingServiceError("Séance introuvable.", 404);
    }

    if (!session.dispute) {
      throw new ReportingServiceError("Aucun litige n'est enregistré pour cette séance.", 404);
    }

    // Role check
    if (actorRole === UserRole.TEACHER && session.classroom.teacherProfile.userId !== actorUserId) {
      throw new ReportingServiceError("Accès refusé. Vous n'êtes pas l'enseignant de cette séance.", 403);
    }

    if (!teacherResponse || teacherResponse.trim().length < 5) {
      throw new ReportingServiceError("Veuillez fournir une explication détaillée (au moins 5 caractères).", 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const dispute = await tx.lessonDispute.update({
        where: { id: session.dispute!.id },
        data: {
          teacherResponse: teacherResponse.trim(),
          teacherRespondedAt: new Date(),
          status: DisputeStatus.UNDER_REVIEW,
        },
      });

      // Notify parent
      const parentUserId = session.classroom.student.parent.userId;
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.DISPUTE_TEACHER_RESPONDED,
          recipientUserId: parentUserId,
          entityType: "LessonDispute",
          entityId: session.dispute!.id,
          title: "Réponse du professeur au litige",
          message: `Le professeur a apporté son explication concernant le litige de séance. L'administration va examiner le dossier.`,
          linkUrl: `/parent/reports?sessionId=${sessionId}`,
          priority: NotificationPriority.NORMAL,
        },
        tx
      );

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "DISPUTE_TEACHER_RESPONDED",
          entityType: "LessonDispute",
          entityId: dispute.id,
          detailsJson: JSON.stringify({ sessionId }),
        },
      });

      return dispute;
    });

    return updated;
  }

  /**
   * P11.09: Administrator resolves a dispute
   */
  static async resolveDispute({
    disputeId,
    resolutionType,
    adminNote,
    actorUserId,
    actorRole,
  }: ResolveDisputeParams) {
    if (actorRole !== UserRole.ADMIN) {
      throw new ReportingServiceError("Seuls les administrateurs peuvent arbitrer les litiges.", 403);
    }

    const dispute = await prisma.lessonDispute.findUnique({
      where: { id: disputeId },
      include: {
        session: {
          include: {
            classroom: {
              include: {
                teacherProfile: true,
                student: { include: { parent: true } },
              },
            },
            report: true,
          },
        },
      },
    });

    if (!dispute) {
      throw new ReportingServiceError("Litige introuvable.", 404);
    }

    if (!adminNote || adminNote.trim().length < 5) {
      throw new ReportingServiceError("Une note administrative motivée est obligatoire (au moins 5 caractères).", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update dispute
      const updatedDispute = await tx.lessonDispute.update({
        where: { id: disputeId },
        data: {
          status: resolutionType as DisputeStatus,
          resolutionType,
          adminNote: adminNote.trim(),
          resolvedById: actorUserId,
          resolvedAt: new Date(),
        },
      });

      // 2. Update session and report based on decision
      let newSessionStatus: SessionStatus = SessionStatus.ADMIN_RESOLVED;
      if (resolutionType === "RESOLVED_RESCHEDULED") {
        newSessionStatus = SessionStatus.RESCHEDULED;
      }

      await tx.lessonSession.update({
        where: { id: dispute.sessionId },
        data: {
          status: newSessionStatus,
        },
      });

      if (dispute.session.report) {
        let newReportStatus: ReportStatus = ReportStatus.VALIDATED;
        if (resolutionType === "RESOLVED_RESCHEDULED") {
          newReportStatus = ReportStatus.RETURNED_FOR_CORRECTION;
        } else if (resolutionType === "RESOLVED_REFUNDED") {
          newReportStatus = ReportStatus.DISPUTED;
        }

        await tx.lessonReport.update({
          where: { id: dispute.session.report.id },
          data: {
            status: newReportStatus,
          },
        });
      }

      // 3. Notify Parent and Teacher
      const parentUserId = dispute.session.classroom.student.parent.userId;
      const teacherUserId = dispute.session.classroom.teacherProfile.userId;
      const subjectName = dispute.session.classroom.subjectName;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.DISPUTE_RESOLVED,
          recipientUserId: parentUserId,
          entityType: "LessonDispute",
          entityId: disputeId,
          title: "Décision arbitrale de séance",
          message: `L'administration a statué sur le litige de ${subjectName} : "${adminNote.slice(0, 100)}".`,
          linkUrl: `/parent/reports?sessionId=${dispute.sessionId}`,
          priority: NotificationPriority.HIGH,
          emailPayload: {
            adminNotes: adminNote.trim(),
            subjectName,
          },
        },
        tx
      );

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.DISPUTE_RESOLVED,
          recipientUserId: teacherUserId,
          entityType: "LessonDispute",
          entityId: disputeId,
          title: "Décision arbitrale de séance",
          message: `L'administration a statué sur le litige de ${subjectName} : "${adminNote.slice(0, 100)}".`,
          linkUrl: `/teacher/reports?sessionId=${dispute.sessionId}`,
          priority: NotificationPriority.HIGH,
          emailPayload: {
            adminNotes: adminNote.trim(),
            subjectName,
          },
        },
        tx
      );

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "DISPUTE_ADMIN_RESOLVED",
          entityType: "LessonDispute",
          entityId: disputeId,
          detailsJson: JSON.stringify({
            resolutionType,
            adminNote,
            sessionId: dispute.sessionId,
          }),
        },
      });

      return updatedDispute;
    });

    return result;
  }

  /**
   * P11.11: Pure financial eligibility verification service.
   * Strict boundary: Does NOT create live TeacherEarning records or fake payout transactions.
   */
  static async checkEarningsEligibility(sessionId: string): Promise<EarningsEligibilityResult> {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: true,
        report: true,
        approval: true,
        dispute: true,
        earning: true,
      },
    });

    if (!session) {
      return { isEligible: false, reasons: ["SESSION_NOT_FOUND"] };
    }

    const reasons: string[] = [];

    // 1. Session funding check
    if (!session.isFunded) {
      reasons.push("SESSION_NOT_FUNDED");
    }

    // 2. Classroom active check
    if (session.classroom.status === "CANCELLED") {
      reasons.push("CLASSROOM_CANCELLED");
    }

    // 3. Session status check
    const isApprovedOrResolved =
      session.status === SessionStatus.PARENT_APPROVED ||
      (session.status === SessionStatus.ADMIN_RESOLVED && session.dispute?.status === DisputeStatus.RESOLVED_VALIDATED);

    if (!isApprovedOrResolved) {
      reasons.push("SESSION_NOT_VALIDATED");
    }

    // 4. Report status check
    if (!session.report || session.report.status !== ReportStatus.VALIDATED) {
      reasons.push("REPORT_NOT_VALIDATED");
    }

    // 5. Unresolved dispute check
    if (session.dispute && (session.dispute.status === DisputeStatus.OPEN || session.dispute.status === DisputeStatus.UNDER_REVIEW)) {
      reasons.push("UNRESOLVED_DISPUTE");
    }

    // 6. Already paid out check
    if (session.earning && session.earning.isPaidOut) {
      reasons.push("ALREADY_PAID_OUT");
    }

    const isEligible = reasons.length === 0;

    return {
      isEligible,
      reasons,
      sessionDetails: {
        sessionId: session.id,
        classroomId: session.classroomId,
        isFunded: session.isFunded,
        sessionStatus: session.status,
        reportStatus: session.report?.status || null,
        allocatedAmountGnf: session.allocatedAmountGnf,
        platformCommissionGnf: session.platformCommissionGnf,
        teacherNetGnf: session.teacherNetGnf,
      },
    };
  }

  /**
   * Fetch reports for Teacher view (/teacher/reports)
   */
  static async getTeacherReports(teacherUserId: string, filter?: { status?: string; classroomId?: string }) {
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacherProfile) {
      return {
        stats: { toWrite: 0, drafts: 0, submitted: 0, validated: 0, disputed: 0, total: 0 },
        sessions: [],
      };
    }

    // Get all sessions for this teacher's classrooms
    const where: any = {
      classroom: { teacherProfileId: teacherProfile.id },
      status: { not: SessionStatus.CANCELLED },
    };

    if (filter?.classroomId) {
      where.classroomId = filter.classroomId;
    }

    const allSessions = await prisma.lessonSession.findMany({
      where,
      include: {
        classroom: {
          include: {
            student: true,
          },
        },
        report: true,
        approval: true,
        dispute: true,
      },
      orderBy: { scheduledStart: "desc" },
    });

    // Compute KPI stats
    let toWrite = 0;
    let drafts = 0;
    let submitted = 0;
    let validated = 0;
    let disputed = 0;

    for (const s of allSessions) {
      if (s.status === SessionStatus.PARENT_DISPUTED || (s.dispute && (s.dispute.status === DisputeStatus.OPEN || s.dispute.status === DisputeStatus.UNDER_REVIEW))) {
        disputed++;
      } else if (s.status === SessionStatus.PARENT_APPROVED || s.report?.status === ReportStatus.VALIDATED) {
        validated++;
      } else if (s.report?.status === ReportStatus.SUBMITTED) {
        submitted++;
      } else if (s.report?.status === ReportStatus.DRAFT) {
        drafts++;
      } else {
        toWrite++;
      }
    }

    // Filter sessions if requested
    let filtered = allSessions;
    if (filter?.status) {
      if (filter.status === "TO_WRITE") {
        filtered = allSessions.filter((s) => !s.report && s.status !== SessionStatus.PARENT_DISPUTED);
      } else if (filter.status === "DRAFT") {
        filtered = allSessions.filter((s) => s.report?.status === ReportStatus.DRAFT);
      } else if (filter.status === "SUBMITTED") {
        filtered = allSessions.filter((s) => s.report?.status === ReportStatus.SUBMITTED);
      } else if (filter.status === "VALIDATED") {
        filtered = allSessions.filter((s) => s.report?.status === ReportStatus.VALIDATED || s.status === SessionStatus.PARENT_APPROVED);
      } else if (filter.status === "DISPUTED") {
        filtered = allSessions.filter(
          (s) => s.status === SessionStatus.PARENT_DISPUTED || (s.dispute && s.dispute.status !== DisputeStatus.RESOLVED_VALIDATED)
        );
      }
    }

    return {
      stats: {
        toWrite,
        drafts,
        submitted,
        validated,
        disputed,
        total: allSessions.length,
      },
      sessions: filtered,
    };
  }

  /**
   * Fetch reports for Parent view (/parent/reports)
   */
  static async getParentReports(parentUserId: string, filter?: { childId?: string; status?: string }) {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentUserId },
      select: { id: true },
    });

    if (!parentProfile) {
      return {
        stats: { awaitingValidation: 0, validated: 0, disputed: 0, total: 0 },
        sessions: [],
      };
    }

    const where: any = {
      classroom: {
        student: { parentId: parentProfile.id },
      },
      // Sessions with reports or delivered
      OR: [
        { report: { isNot: null } },
        { status: { in: [SessionStatus.TEACHER_COMPLETED, SessionStatus.PARENT_APPROVED, SessionStatus.PARENT_DISPUTED] } },
      ],
    };

    if (filter?.childId) {
      where.classroom.studentId = filter.childId;
    }

    const allSessions = await prisma.lessonSession.findMany({
      where,
      include: {
        classroom: {
          include: {
            student: true,
            teacherProfile: { include: { user: true } },
          },
        },
        report: true,
        approval: true,
        dispute: true,
      },
      orderBy: { scheduledStart: "desc" },
    });

    let awaitingValidation = 0;
    let validated = 0;
    let disputed = 0;

    for (const s of allSessions) {
      if (s.status === SessionStatus.PARENT_DISPUTED || (s.dispute && s.dispute.status === DisputeStatus.OPEN)) {
        disputed++;
      } else if (s.status === SessionStatus.PARENT_APPROVED || s.report?.status === ReportStatus.VALIDATED) {
        validated++;
      } else if (s.report?.status === ReportStatus.SUBMITTED || s.status === SessionStatus.TEACHER_COMPLETED) {
        awaitingValidation++;
      }
    }

    let filtered = allSessions;
    if (filter?.status) {
      if (filter.status === "AWAITING") {
        filtered = allSessions.filter((s) => s.status === SessionStatus.TEACHER_COMPLETED || s.report?.status === ReportStatus.SUBMITTED);
      } else if (filter.status === "VALIDATED") {
        filtered = allSessions.filter((s) => s.status === SessionStatus.PARENT_APPROVED || s.report?.status === ReportStatus.VALIDATED);
      } else if (filter.status === "DISPUTED") {
        filtered = allSessions.filter((s) => s.status === SessionStatus.PARENT_DISPUTED || s.dispute !== null);
      }
    }

    return {
      stats: {
        awaitingValidation,
        validated,
        disputed,
        total: allSessions.length,
      },
      sessions: filtered,
    };
  }

  /**
   * Fetch all disputes for Administrator (/admin/session-disputes)
   */
  static async getAdminDisputes(filter?: { status?: DisputeStatus; category?: string }) {
    const where: any = {};
    if (filter?.status) {
      where.status = filter.status;
    }
    if (filter?.category) {
      where.category = filter.category;
    }

    const allDisputes = await prisma.lessonDispute.findMany({
      where,
      include: {
        session: {
          include: {
            classroom: {
              include: {
                student: { include: { parent: { include: { user: true } } } },
                teacherProfile: { include: { user: true } },
              },
            },
            report: true,
            approval: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let openCount = 0;
    let underReviewCount = 0;
    let resolvedCount = 0;

    for (const d of allDisputes) {
      if (d.status === DisputeStatus.OPEN) openCount++;
      else if (d.status === DisputeStatus.UNDER_REVIEW) underReviewCount++;
      else resolvedCount++;
    }

    return {
      stats: {
        open: openCount,
        underReview: underReviewCount,
        resolved: resolvedCount,
        total: allDisputes.length,
      },
      disputes: allDisputes,
    };
  }
}
