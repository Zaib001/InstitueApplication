import { prisma } from "@/lib/db/prisma";
import {
  AssessmentType,
  HomeworkStatus,
  LessonAttendance,
  ReportStatus,
  SessionStatus,
  UserRole,
  NotificationEventType,
  NotificationPriority,
} from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";

export class ProgressServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ProgressServiceError";
    this.statusCode = statusCode;
  }
}

export interface CreateHomeworkParams {
  studentId: string;
  classroomId: string;
  sessionId?: string | null;
  title: string;
  description: string;
  dueDate?: string | Date | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface UpdateHomeworkParams {
  homeworkId: string;
  status: HomeworkStatus;
  studentSubmission?: string | null;
  teacherFeedback?: string | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface CreateAssessmentParams {
  studentId: string;
  classroomId: string;
  sessionId?: string | null;
  title: string;
  assessmentType: AssessmentType;
  assessmentDate?: string | Date | null;
  obtainedScore: number;
  maxScore?: number;
  learningObjectives?: string | null;
  teacherComments?: string | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface CreateObservationParams {
  studentId: string;
  classroomId: string;
  topicsMastered?: string | null;
  strengths?: string | null;
  areasForImprovement?: string | null;
  recommendations?: string | null;
  progressRating?: number | null;
  actorUserId: string;
  actorRole: UserRole;
}

export class ProgressService {
  /**
   * P12.01 - P12.06: Fetch Aggregated Student Digital Progress Book
   */
  static async getProgressBook(studentId: string, actorUserId: string, actorRole: UserRole) {
    // 1. Fetch Student Profile with Parent info
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: {
            user: { select: { id: true, fullName: true, phoneNumber: true, email: true } },
          },
        },
      },
    });

    if (!student) {
      throw new ProgressServiceError("Profil élève introuvable.", 404);
    }

    // 2. Authorization check
    if (actorRole === UserRole.PARENT) {
      if (student.parent.userId !== actorUserId) {
        throw new ProgressServiceError("Accès refusé. Vous n'êtes pas le parent de cet élève.", 403);
      }
    } else if (actorRole === UserRole.TEACHER) {
      // Must have an active classroom assignment with this student
      const classroomAssigned = await prisma.classroom.findFirst({
        where: {
          studentId,
          teacherProfile: { userId: actorUserId },
        },
      });
      if (!classroomAssigned) {
        throw new ProgressServiceError(
          "Accès refusé. Vous n'êtes pas l'enseignant assigné à cet élève.",
          403
        );
      }
    } else if (actorRole !== UserRole.ADMIN) {
      throw new ProgressServiceError("Accès refusé.", 403);
    }

    // 3. Fetch Classrooms & Teachers
    const classrooms = await prisma.classroom.findMany({
      where: { studentId },
      include: {
        teacherProfile: {
          include: {
            user: { select: { fullName: true, phoneNumber: true, email: true } },
          },
        },
      },
    });

    const classroomIds = classrooms.map((c) => c.id);

    // 4. Fetch all Sessions with Reports, Approvals, Disputes
    const sessions = await prisma.lessonSession.findMany({
      where: {
        classroomId: { in: classroomIds },
        status: { not: SessionStatus.CANCELLED },
      },
      include: {
        classroom: {
          select: {
            id: true,
            subjectName: true,
            teacherProfile: {
              select: {
                id: true,
                user: { select: { fullName: true } },
              },
            },
          },
        },
        report: true,
        approval: true,
        dispute: true,
      },
      orderBy: { scheduledStart: "asc" },
    });

    // 5. Fetch Homework Assignments
    const homework = await prisma.homeworkAssignment.findMany({
      where: { studentId },
      include: {
        classroom: { select: { subjectName: true } },
        teacherProfile: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    // 6. Fetch Academic Assessments
    const assessments = await prisma.academicAssessment.findMany({
      where: { studentId },
      include: {
        classroom: { select: { subjectName: true } },
        teacherProfile: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { assessmentDate: "asc" },
    });

    // 7. Fetch Subject Progress Observations
    const observations = await prisma.subjectProgressObservation.findMany({
      where: { studentId },
      include: {
        classroom: { select: { subjectName: true } },
        teacherProfile: {
          select: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { observationDate: "desc" },
    });

    // 8. Compute Attendance Analytics
    const now = new Date();
    let totalScheduled = sessions.length;
    let deliveredSessions = 0;
    let presentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let absentStudentCount = 0;
    let absentTeacherCount = 0;

    sessions.forEach((s) => {
      const isPast = new Date(s.scheduledStart) <= now;
      const isDelivered =
        s.status === SessionStatus.TEACHER_COMPLETED ||
        s.status === SessionStatus.PARENT_APPROVED ||
        s.status === SessionStatus.ADMIN_RESOLVED ||
        s.status === SessionStatus.PARENT_DISPUTED ||
        (isPast && s.attendanceRecordedAt);

      if (isDelivered) {
        deliveredSessions++;
        if (s.attendanceStatus === LessonAttendance.PRESENT) presentCount++;
        else if (s.attendanceStatus === LessonAttendance.LATE) lateCount++;
        else if (s.attendanceStatus === LessonAttendance.EXCUSED) excusedCount++;
        else if (s.attendanceStatus === LessonAttendance.ABSENT_STUDENT) absentStudentCount++;
        else if (s.attendanceStatus === LessonAttendance.ABSENT_TEACHER) absentTeacherCount++;
      }
    });

    // Strict Audited Attendance Calculation:
    // Actual attendance strictly includes PRESENT and LATE (physically in class).
    // EXCUSED absences are tracked as justified non-attendance, NOT counted as present.
    const actualAttendanceCount = presentCount + lateCount;
    const actualAttendanceRatePercentage =
      deliveredSessions > 0
        ? Math.round((actualAttendanceCount / deliveredSessions) * 1000) / 10
        : 100;
    const excusedRatePercentage =
      deliveredSessions > 0
        ? Math.round((excusedCount / deliveredSessions) * 1000) / 10
        : 0;
    const unexcusedRatePercentage =
      deliveredSessions > 0
        ? Math.round((absentStudentCount / deliveredSessions) * 1000) / 10
        : 0;
    const lateRatePercentage =
      deliveredSessions > 0
        ? Math.round((lateCount / deliveredSessions) * 1000) / 10
        : 0;
    const attendanceRatePercentage = actualAttendanceRatePercentage;

    // 9. Subject-Level Grouping
    const subjectMap = new Map<string, {
      subjectName: string;
      classroomId: string;
      teacherName: string;
      completedLessonsCount: number;
      topicsCovered: string[];
      strengths: string[];
      areasForImprovement: string[];
      recommendations: string[];
      assessments: any[];
      averagePercentage?: number | null;
      averageScore20?: number | null;
      activeHomeworkCount: number;
      completedHomeworkCount: number;
      latestReportDate?: string | null;
      latestProgressRating?: number | null;
    }>();

    // Initialize subjects from classrooms
    classrooms.forEach((c) => {
      subjectMap.set(c.subjectName, {
        subjectName: c.subjectName,
        classroomId: c.id,
        teacherName: c.teacherProfile.user.fullName,
        completedLessonsCount: 0,
        topicsCovered: [],
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
        assessments: [],
        activeHomeworkCount: 0,
        completedHomeworkCount: 0,
        latestReportDate: null,
        latestProgressRating: null,
      });
    });

    // Feed sessions data into subjects
    sessions.forEach((s) => {
      const sub = subjectMap.get(s.classroom.subjectName);
      if (sub) {
        if (s.status === SessionStatus.PARENT_APPROVED || s.report?.status === ReportStatus.VALIDATED || s.status === SessionStatus.TEACHER_COMPLETED) {
          sub.completedLessonsCount++;
        }
        if (s.report) {
          if (s.report.topicsCovered && !sub.topicsCovered.includes(s.report.topicsCovered)) {
            sub.topicsCovered.push(s.report.topicsCovered);
          }
          if (s.report.strengths && !sub.strengths.includes(s.report.strengths)) {
            sub.strengths.push(s.report.strengths);
          }
          if (s.report.areasForImprovement && !sub.areasForImprovement.includes(s.report.areasForImprovement)) {
            sub.areasForImprovement.push(s.report.areasForImprovement);
          }
          if (s.report.nextLessonRecommendations && !sub.recommendations.includes(s.report.nextLessonRecommendations)) {
            sub.recommendations.push(s.report.nextLessonRecommendations);
          }
          if (s.report.progressRating) {
            sub.latestProgressRating = s.report.progressRating;
          }
          sub.latestReportDate = s.report.submittedAt?.toISOString() || s.scheduledStart.toISOString();
        }
      }
    });

    // Feed assessments data into subjects
    assessments.forEach((a) => {
      const sub = subjectMap.get(a.subjectName);
      if (sub) {
        sub.assessments.push({
          id: a.id,
          title: a.title,
          assessmentType: a.assessmentType,
          assessmentDate: a.assessmentDate.toISOString(),
          obtainedScore: a.obtainedScore,
          maxScore: a.maxScore,
          percentage: a.percentage,
          teacherComments: a.teacherComments,
        });
      }
    });

    // Compute subject averages
    subjectMap.forEach((sub) => {
      if (sub.assessments.length > 0) {
        const sumPct = sub.assessments.reduce((acc, curr) => acc + curr.percentage, 0);
        sub.averagePercentage = Math.round((sumPct / sub.assessments.length) * 10) / 10;
        sub.averageScore20 = Math.round(((sub.averagePercentage * 20) / 100) * 10) / 10;
      } else {
        sub.averagePercentage = null;
        sub.averageScore20 = null;
      }
    });

    // Feed homework into subjects
    homework.forEach((h) => {
      const sub = subjectMap.get(h.classroom.subjectName);
      if (sub) {
        if (h.status === HomeworkStatus.COMPLETED) {
          sub.completedHomeworkCount++;
        } else {
          sub.activeHomeworkCount++;
        }
      }
    });

    const subjectsArray = Array.from(subjectMap.values());

    // 10. Overall Assessment Stats
    let overallAveragePercentage: number | null = null;
    let overallAverageScore20: number | null = null;
    if (assessments.length > 0) {
      const totalPct = assessments.reduce((acc, curr) => acc + curr.percentage, 0);
      overallAveragePercentage = Math.round((totalPct / assessments.length) * 10) / 10;
      overallAverageScore20 = Math.round(((overallAveragePercentage * 20) / 100) * 10) / 10;
    }

    // 11. Chronological Learning Timeline
    type TimelineItem = {
      id: string;
      type: "LESSON" | "HOMEWORK" | "ASSESSMENT";
      date: string;
      subjectName: string;
      title: string;
      teacherName: string;
      details: any;
    };

    const timeline: TimelineItem[] = [];

    // Add Lessons
    sessions.forEach((s) => {
      timeline.push({
        id: `sess_${s.id}`,
        type: "LESSON",
        date: s.scheduledStart.toISOString(),
        subjectName: s.classroom.subjectName,
        title: s.title || `Séance #${s.sessionSequence} de ${s.classroom.subjectName}`,
        teacherName: s.classroom.teacherProfile.user.fullName,
        details: {
          sessionId: s.id,
          sessionSequence: s.sessionSequence,
          status: s.status,
          attendanceStatus: s.attendanceStatus,
          durationMinutes: s.actualDurationMinutes || s.durationMinutes,
          report: s.report
            ? {
                topicsCovered: s.report.topicsCovered,
                learningObjectives: s.report.learningObjectives,
                studentEffort: s.report.studentEffort,
                strengths: s.report.strengths,
                areasForImprovement: s.report.areasForImprovement,
                status: s.report.status,
              }
            : null,
          approval: s.approval ? { approvedAt: s.approval.approvedAt.toISOString() } : null,
          dispute: s.dispute ? { status: s.dispute.status, reason: s.dispute.reason } : null,
        },
      });
    });

    // Add Homework
    homework.forEach((h) => {
      timeline.push({
        id: `hw_${h.id}`,
        type: "HOMEWORK",
        date: h.createdAt.toISOString(),
        subjectName: h.classroom.subjectName,
        title: `Devoir : ${h.title}`,
        teacherName: h.teacherProfile.user.fullName,
        details: {
          homeworkId: h.id,
          description: h.description,
          dueDate: h.dueDate ? h.dueDate.toISOString() : null,
          status: h.status,
          studentSubmission: h.studentSubmission,
          teacherFeedback: h.teacherFeedback,
        },
      });
    });

    // Add Assessments
    assessments.forEach((a) => {
      timeline.push({
        id: `ass_${a.id}`,
        type: "ASSESSMENT",
        date: a.assessmentDate.toISOString(),
        subjectName: a.subjectName,
        title: `Évaluation : ${a.title}`,
        teacherName: a.teacherProfile.user.fullName,
        details: {
          assessmentId: a.id,
          assessmentType: a.assessmentType,
          obtainedScore: a.obtainedScore,
          maxScore: a.maxScore,
          percentage: a.percentage,
          learningObjectives: a.learningObjectives,
          teacherComments: a.teacherComments,
        },
      });
    });

    // Sort timeline descending by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 12. Assessment Evolution Charts Data (Chronological ascending)
    const assessmentChartData = assessments.map((a) => ({
      id: a.id,
      date: a.assessmentDate.toISOString().split("T")[0],
      title: a.title,
      subjectName: a.subjectName,
      type: a.assessmentType,
      score: a.obtainedScore,
      maxScore: a.maxScore,
      percentage: a.percentage,
    }));

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        gradeLevel: student.gradeLevel,
        cycle: student.cycle,
        customCycle: student.customCycle,
        schoolName: student.schoolName,
        preferredSubjects: student.preferredSubjects,
        notes: student.notes,
        parent: {
          id: student.parent.id,
          fullName: student.parent.user.fullName,
          phone: student.parent.user.phoneNumber,
          email: student.parent.user.email,
        },
      },
      summary: {
        totalScheduledSessions: totalScheduled,
        deliveredSessions,
        attendanceRatePercentage,
        overallAveragePercentage,
        overallAverageScore20,
        activeHomeworkCount: homework.filter((h) => h.status !== HomeworkStatus.COMPLETED).length,
        completedHomeworkCount: homework.filter((h) => h.status === HomeworkStatus.COMPLETED).length,
        totalAssessmentsCount: assessments.length,
        hasEnoughChartData: assessments.length >= 2,
      },
      attendance: {
        presentCount,
        lateCount,
        excusedCount,
        absentStudentCount,
        absentTeacherCount,
        deliveredSessions,
        ratePercentage: attendanceRatePercentage,
        actualPresentRatePercentage:
          deliveredSessions > 0 ? Math.round((presentCount / deliveredSessions) * 1000) / 10 : 100,
        lateRatePercentage,
        excusedRatePercentage,
        unexcusedRatePercentage,
      },
      subjects: subjectsArray,
      assessments: assessmentChartData,
      homework: homework.map((h) => ({
        id: h.id,
        subjectName: h.classroom.subjectName,
        teacherName: h.teacherProfile.user.fullName,
        title: h.title,
        description: h.description,
        dueDate: h.dueDate ? h.dueDate.toISOString() : null,
        status: h.status,
        studentSubmission: h.studentSubmission,
        teacherFeedback: h.teacherFeedback,
        submittedAt: h.submittedAt ? h.submittedAt.toISOString() : null,
        completedAt: h.completedAt ? h.completedAt.toISOString() : null,
      })),
      observations: observations.map((o) => ({
        id: o.id,
        subjectName: o.subjectName,
        teacherName: o.teacherProfile.user.fullName,
        observationDate: o.observationDate.toISOString(),
        topicsMastered: o.topicsMastered,
        strengths: o.strengths,
        areasForImprovement: o.areasForImprovement,
        recommendations: o.recommendations,
        progressRating: o.progressRating,
      })),
      timeline,
    };
  }

  /**
   * P12.09: Teacher assigns structured homework
   */
  static async createHomework({
    studentId,
    classroomId,
    sessionId,
    title,
    description,
    dueDate,
    actorUserId,
    actorRole,
  }: CreateHomeworkParams) {
    if (!title || title.trim().length < 3) {
      throw new ProgressServiceError("Le titre du devoir doit comporter au moins 3 caractères.", 400);
    }
    if (!description || description.trim().length < 5) {
      throw new ProgressServiceError("Les consignes du devoir doivent comporter au moins 5 caractères.", 400);
    }

    // Role check: Teacher or Admin
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacherProfile: { include: { user: true } },
        student: { include: { parent: true } },
      },
    });

    if (!classroom) {
      throw new ProgressServiceError("Classe introuvable.", 404);
    }

    if (actorRole === UserRole.TEACHER && classroom.teacherProfile.userId !== actorUserId) {
      throw new ProgressServiceError("Accès refusé. Vous n'êtes pas l'enseignant de cette classe.", 403);
    }

    let parsedDue: Date | null = null;
    if (dueDate) {
      parsedDue = new Date(dueDate);
      if (isNaN(parsedDue.getTime())) parsedDue = null;
    }

    const homework = await prisma.$transaction(async (tx) => {
      const hw = await tx.homeworkAssignment.create({
        data: {
          studentId,
          classroomId,
          teacherProfileId: classroom.teacherProfileId,
          sessionId: sessionId || null,
          subjectName: classroom.subjectName,
          title: title.trim(),
          description: description.trim(),
          dueDate: parsedDue,
          status: HomeworkStatus.ASSIGNED,
        },
      });

      // Notify parent
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.HOMEWORK_ASSIGNED,
          recipientUserId: classroom.student.parent.userId,
          entityType: "HomeworkAssignment",
          entityId: hw.id,
          title: "Nouveau devoir assigné",
          message: `Le professeur ${classroom.teacherProfile.user.fullName} a assigné un devoir en ${classroom.subjectName} : "${title.trim()}".`,
          linkUrl: `/parent/students/${studentId}/progress#homework`,
          priority: NotificationPriority.NORMAL,
          emailPayload: {
            title: title.trim(),
            subjectName: classroom.subjectName,
            dueDate: parsedDue ? parsedDue.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" }) : "Prochaine séance",
            studentId,
          },
        },
        tx
      );

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "HOMEWORK_ASSIGNED",
          entityType: "HomeworkAssignment",
          entityId: hw.id,
          detailsJson: JSON.stringify({ studentId, classroomId, title: title.trim() }),
        },
      });

      return hw;
    });

    return homework;
  }

  /**
   * P12.10: Update Homework Status & Lifecycle
   */
  static async updateHomeworkStatus({
    homeworkId,
    status,
    studentSubmission,
    teacherFeedback,
    actorUserId,
    actorRole,
  }: UpdateHomeworkParams) {
    const hw = await prisma.homeworkAssignment.findUnique({
      where: { id: homeworkId },
      include: {
        student: { include: { parent: true } },
        teacherProfile: { include: { user: true } },
        classroom: true,
      },
    });

    if (!hw) {
      throw new ProgressServiceError("Devoir introuvable.", 404);
    }

    // Role verification
    if (actorRole === UserRole.PARENT) {
      if (hw.student.parent.userId !== actorUserId) {
        throw new ProgressServiceError("Accès refusé. Vous n'êtes pas le parent de cet élève.", 403);
      }
      // Parent can transition to IN_PROGRESS or SUBMITTED
      if (status !== HomeworkStatus.IN_PROGRESS && status !== HomeworkStatus.SUBMITTED) {
        throw new ProgressServiceError(
          "Les familles peuvent marquer un devoir comme 'En cours' ou 'Rendu'. La validation finale est réservée au professeur.",
          400
        );
      }
    } else if (actorRole === UserRole.TEACHER) {
      if (hw.teacherProfile.userId !== actorUserId) {
        throw new ProgressServiceError("Accès refusé. Vous n'êtes pas l'enseignant de ce devoir.", 403);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status,
      };

      if (status === HomeworkStatus.SUBMITTED) {
        updateData.submittedAt = new Date();
        if (studentSubmission) updateData.studentSubmission = studentSubmission.trim();
      }

      if (status === HomeworkStatus.REVIEWED || status === HomeworkStatus.COMPLETED) {
        updateData.reviewedAt = new Date();
        if (status === HomeworkStatus.COMPLETED) updateData.completedAt = new Date();
        if (teacherFeedback) updateData.teacherFeedback = teacherFeedback.trim();
      }

      const res = await tx.homeworkAssignment.update({
        where: { id: homeworkId },
        data: updateData,
      });

      // Notify counterparty
      if (status === HomeworkStatus.SUBMITTED) {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.HOMEWORK_SUBMITTED,
            recipientUserId: hw.teacherProfile.userId,
            entityType: "HomeworkAssignment",
            entityId: hw.id,
            title: "Devoir rendu par l'élève",
            message: `L'élève ${hw.student.fullName} a rendu le devoir : "${hw.title}".`,
            linkUrl: `/teacher/students/${hw.studentId}/progress#homework`,
            priority: NotificationPriority.NORMAL,
          },
          tx
        );
      } else if (status === HomeworkStatus.COMPLETED || status === HomeworkStatus.REVIEWED) {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.HOMEWORK_GRADED,
            recipientUserId: hw.student.parent.userId,
            entityType: "HomeworkAssignment",
            entityId: hw.id,
            title: "Devoir corrigé par l'enseignant",
            message: `Le professeur ${hw.teacherProfile.user.fullName} a validé et commenté le devoir : "${hw.title}".`,
            linkUrl: `/parent/students/${hw.studentId}/progress#homework`,
            priority: NotificationPriority.NORMAL,
          },
          tx
        );
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "HOMEWORK_STATUS_UPDATED",
          entityType: "HomeworkAssignment",
          entityId: homeworkId,
          detailsJson: JSON.stringify({ newStatus: status }),
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * P12.07: Teacher records periodic academic assessment
   */
  static async createAssessment({
    studentId,
    classroomId,
    sessionId,
    title,
    assessmentType,
    assessmentDate,
    obtainedScore,
    maxScore = 20,
    learningObjectives,
    teacherComments,
    actorUserId,
    actorRole,
  }: CreateAssessmentParams) {
    if (!title || title.trim().length < 3) {
      throw new ProgressServiceError("Le titre de l'évaluation doit comporter au moins 3 caractères.", 400);
    }

    if (maxScore <= 0) {
      throw new ProgressServiceError("La note maximale doit être strictement supérieure à zéro.", 400);
    }

    if (obtainedScore < 0) {
      throw new ProgressServiceError("La note obtenue ne peut pas être négative.", 400);
    }

    if (obtainedScore > maxScore) {
      throw new ProgressServiceError(
        `La note obtenue (${obtainedScore}) ne peut pas dépasser la note maximale (${maxScore}).`,
        400
      );
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacherProfile: { include: { user: true } },
        student: { include: { parent: true } },
      },
    });

    if (!classroom) {
      throw new ProgressServiceError("Classe introuvable.", 404);
    }

    if (actorRole === UserRole.TEACHER && classroom.teacherProfile.userId !== actorUserId) {
      throw new ProgressServiceError("Accès refusé. Vous n'êtes pas l'enseignant de cette classe.", 403);
    }

    const percentage = Math.round((obtainedScore / maxScore) * 1000) / 10;
    const date = assessmentDate ? new Date(assessmentDate) : new Date();

    const assessment = await prisma.$transaction(async (tx) => {
      const a = await tx.academicAssessment.create({
        data: {
          studentId,
          classroomId,
          teacherProfileId: classroom.teacherProfileId,
          sessionId: sessionId || null,
          subjectName: classroom.subjectName,
          title: title.trim(),
          assessmentType,
          assessmentDate: isNaN(date.getTime()) ? new Date() : date,
          obtainedScore: Number(obtainedScore),
          maxScore: Number(maxScore),
          percentage,
          learningObjectives: learningObjectives ? learningObjectives.trim() : null,
          teacherComments: teacherComments ? teacherComments.trim() : null,
        },
      });

      // In-App Notification to Parent
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.ASSESSMENT_RECORDED,
          recipientUserId: classroom.student.parent.userId,
          entityType: "AcademicAssessment",
          entityId: a.id,
          title: "Nouvelle évaluation enregistrée",
          message: `Le professeur ${classroom.teacherProfile.user.fullName} a enregistré une évaluation (${obtainedScore}/${maxScore}) pour ${classroom.student.fullName} en ${classroom.subjectName}.`,
          linkUrl: `/parent/students/${studentId}/progress#assessments`,
          priority: NotificationPriority.NORMAL,
          emailPayload: {
            title: title.trim(),
            subjectName: classroom.subjectName,
            obtainedScore,
            maxScore,
            studentId,
          },
        },
        tx
      );

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "ASSESSMENT_RECORDED",
          entityType: "AcademicAssessment",
          entityId: a.id,
          detailsJson: JSON.stringify({
            studentId,
            classroomId,
            obtainedScore,
            maxScore,
            percentage,
          }),
        },
      });

      return a;
    });

    return assessment;
  }

  /**
   * P12.08: Teacher records periodic qualitative subject observation
   */
  static async createObservation({
    studentId,
    classroomId,
    topicsMastered,
    strengths,
    areasForImprovement,
    recommendations,
    progressRating,
    actorUserId,
    actorRole,
  }: CreateObservationParams) {
    if (progressRating !== undefined && progressRating !== null) {
      if (progressRating < 1 || progressRating > 5) {
        throw new ProgressServiceError("L'évaluation globale doit être comprise entre 1 et 5 étoiles.", 400);
      }
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacherProfile: { include: { user: true } },
        student: { include: { parent: true } },
      },
    });

    if (!classroom) {
      throw new ProgressServiceError("Classe introuvable.", 404);
    }

    if (actorRole === UserRole.TEACHER && classroom.teacherProfile.userId !== actorUserId) {
      throw new ProgressServiceError("Accès refusé. Vous n'êtes pas l'enseignant de cette classe.", 403);
    }

    const observation = await prisma.$transaction(async (tx) => {
      const obs = await tx.subjectProgressObservation.create({
        data: {
          studentId,
          classroomId,
          teacherProfileId: classroom.teacherProfileId,
          subjectName: classroom.subjectName,
          topicsMastered: topicsMastered ? topicsMastered.trim() : null,
          strengths: strengths ? strengths.trim() : null,
          areasForImprovement: areasForImprovement ? areasForImprovement.trim() : null,
          recommendations: recommendations ? recommendations.trim() : null,
          progressRating: progressRating || null,
        },
      });

      // Notify parent
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.PROGRESS_OBSERVATION_RECORDED,
          recipientUserId: classroom.student.parent.userId,
          entityType: "SubjectProgressObservation",
          entityId: obs.id,
          title: "Bilan pédagogique ajouté",
          message: `Le professeur ${classroom.teacherProfile.user.fullName} a enregistré une synthèse de progression pour ${classroom.student.fullName} en ${classroom.subjectName}.`,
          linkUrl: `/parent/students/${studentId}/progress#observations`,
          priority: NotificationPriority.NORMAL,
          emailPayload: {
            subjectName: classroom.subjectName,
            studentName: classroom.student.fullName,
            studentId,
          },
        },
        tx
      );

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "OBSERVATION_RECORDED",
          entityType: "SubjectProgressObservation",
          entityId: obs.id,
          detailsJson: JSON.stringify({ studentId, classroomId, subjectName: classroom.subjectName }),
        },
      });

      return obs;
    });

    return observation;
  }

  /**
   * P12.18: Teacher Academic Progress List (/teacher/progress)
   */
  static async getTeacherProgressList(teacherUserId: string) {
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherUserId },
      select: { id: true },
    });

    if (!teacherProfile) {
      return [];
    }

    const classrooms = await prisma.classroom.findMany({
      where: {
        teacherProfileId: teacherProfile.id,
      },
      include: {
        student: {
          include: {
            parent: {
              include: {
                user: { select: { fullName: true, phoneNumber: true, email: true } },
              },
            },
            assessments: {
              where: { teacherProfileId: teacherProfile.id },
              orderBy: { assessmentDate: "desc" },
              take: 1,
            },
            homework: {
              where: { teacherProfileId: teacherProfile.id },
            },
          },
        },
        sessions: {
          where: { status: { not: SessionStatus.CANCELLED } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const studentsMap = new Map<string, any>();

    classrooms.forEach((c) => {
      if (!studentsMap.has(c.student.id)) {
        const pastSessions = c.sessions.filter(
          (s) =>
            s.status === SessionStatus.PARENT_APPROVED ||
            s.status === SessionStatus.TEACHER_COMPLETED
        );

        studentsMap.set(c.student.id, {
          studentId: c.student.id,
          classroomId: c.id,
          fullName: c.student.fullName,
          gradeLevel: c.student.gradeLevel,
          cycle: c.student.cycle,
          parentName: c.student.parent.user.fullName,
          parentPhone: c.student.parent.user.phoneNumber,
          subjectName: c.subjectName,
          completedSessionsCount: pastSessions.length,
          latestAssessment: c.student.assessments[0]
            ? {
                title: c.student.assessments[0].title,
                score: c.student.assessments[0].obtainedScore,
                maxScore: c.student.assessments[0].maxScore,
                percentage: c.student.assessments[0].percentage,
                date: c.student.assessments[0].assessmentDate.toISOString(),
              }
            : null,
          activeHomeworkCount: c.student.homework.filter((h) => h.status !== HomeworkStatus.COMPLETED).length,
        });
      }
    });

    return Array.from(studentsMap.values());
  }

  /**
   * P12.19 - P12.20: Administrator Academic Oversight (/admin/academic-progress)
   */
  static async getAdminAcademicProgress(filter?: { search?: string }) {
    const whereStudent: any = {};
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      whereStudent.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { gradeLevel: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.studentProfile.findMany({
      where: whereStudent,
      include: {
        parent: {
          include: {
            user: { select: { fullName: true, phoneNumber: true, email: true } },
          },
        },
        classrooms: {
          include: {
            teacherProfile: {
              include: { user: { select: { fullName: true } } },
            },
            sessions: {
              where: { status: { not: SessionStatus.CANCELLED } },
              include: { report: true },
            },
          },
        },
        assessments: true,
        homework: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    let totalMissingReports = 0;
    let totalCompletedSessions = 0;
    let totalActiveHomework = 0;
    let totalAssessmentsRecorded = 0;

    const studentSummaries = students.map((s) => {
      let missingReportsCount = 0;
      let completedSessionsCount = 0;

      s.classrooms.forEach((c) => {
        c.sessions.forEach((sess) => {
          const isPast = new Date(sess.scheduledStart) <= now;
          if (isPast && !sess.report && sess.status !== SessionStatus.CANCELLED) {
            missingReportsCount++;
          }
          if (sess.status === SessionStatus.PARENT_APPROVED || sess.status === SessionStatus.TEACHER_COMPLETED) {
            completedSessionsCount++;
          }
        });
      });

      totalMissingReports += missingReportsCount;
      totalCompletedSessions += completedSessionsCount;
      totalActiveHomework += s.homework.filter((h) => h.status !== HomeworkStatus.COMPLETED).length;
      totalAssessmentsRecorded += s.assessments.length;

      return {
        studentId: s.id,
        fullName: s.fullName,
        gradeLevel: s.gradeLevel,
        parentName: s.parent.user.fullName,
        parentContact: s.parent.user.phoneNumber || s.parent.user.email,
        classroomsCount: s.classrooms.length,
        completedSessionsCount,
        missingReportsCount,
        assessmentsCount: s.assessments.length,
        homeworkCount: s.homework.length,
      };
    });

    return {
      stats: {
        totalStudents: students.length,
        totalCompletedSessions,
        totalMissingReports,
        totalActiveHomework,
        totalAssessmentsRecorded,
      },
      students: studentSummaries,
    };
  }
}
