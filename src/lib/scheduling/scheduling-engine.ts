import { prisma } from "@/lib/db/prisma";
import {
  ClassroomStatus,
  LessonAttendance,
  PackageStatus,
  SessionStatus,
  UserRole,
  NotificationEventType,
  NotificationPriority,
} from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";
import { SessionAllocationBreakdown } from "@/lib/pricing/pricing-engine";

export class SchedulingEngineError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "SchedulingEngineError";
    this.statusCode = statusCode;
  }
}

export interface AvailabilitySlotInput {
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  startTime: string; // "HH:MM"
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingSession?: {
    id: string;
    classroomId: string;
    subjectName: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    status: SessionStatus;
  } | null;
  message?: string;
}

export interface PlanPackageSessionsParams {
  classroomId: string;
  startDate: string | Date;
  recurringSlots: AvailabilitySlotInput[];
  userId: string;
  userRole: UserRole;
  notes?: string;
}

export interface RescheduleSessionParams {
  sessionId: string;
  newStart: string | Date;
  newEnd?: string | Date;
  durationMinutes?: number;
  reason: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface CancelSessionParams {
  sessionId: string;
  reason: string;
  actorUserId: string;
  actorRole: UserRole;
}

export interface RecordAttendanceParams {
  sessionId: string;
  attendanceStatus: LessonAttendance;
  actualStart?: string | Date | null;
  actualEnd?: string | Date | null;
  actualDurationMinutes?: number | null;
  notes?: string | null;
  actorUserId: string;
  actorRole: UserRole;
}

export interface CalendarFilterParams {
  userId: string;
  userRole: UserRole;
  classroomId?: string;
  teacherProfileId?: string;
  studentId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  status?: SessionStatus;
}

/**
 * Domain Service for Classroom Scheduling, Calendar Management, Attendance, and Conflicts
 */
export class SchedulingEngine {
  /**
   * Guinea (Africa/Conakry) runs strictly on UTC+0 all year round (no daylight saving).
   * Validates and returns canonical Date objects.
   */
  static parseGuineaDate(dateInput: string | Date): Date {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      throw new SchedulingEngineError("Format de date invalide.", 400);
    }
    return d;
  }

  /**
   * Checks if a teacher has any overlapping confirmed sessions in any classroom.
   * Adjacent sessions (start === otherEnd or end === otherStart) are strictly valid.
   */
  static async checkTeacherConflicts(
    teacherProfileId: string,
    start: Date,
    end: Date,
    excludeSessionId?: string
  ): Promise<ConflictCheckResult> {
    if (start >= end) {
      return {
        hasConflict: true,
        message: "L'heure de début doit être strictement antérieure à l'heure de fin.",
      };
    }

    const conflicting = await prisma.lessonSession.findFirst({
      where: {
        id: excludeSessionId ? { not: excludeSessionId } : undefined,
        status: { not: SessionStatus.CANCELLED },
        classroom: {
          teacherProfileId,
        },
        // Strict overlap interval: (StartA < EndB) and (EndA > StartB)
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
      },
      include: {
        classroom: {
          select: {
            id: true,
            subjectName: true,
          },
        },
      },
    });

    if (conflicting) {
      const formatTime = (d: Date) =>
        d.toLocaleTimeString("fr-GN", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Conakry" });
      const formatDate = (d: Date) =>
        d.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" });

      return {
        hasConflict: true,
        conflictingSession: {
          id: conflicting.id,
          classroomId: conflicting.classroomId,
          subjectName: conflicting.classroom.subjectName,
          scheduledStart: conflicting.scheduledStart,
          scheduledEnd: conflicting.scheduledEnd,
          status: conflicting.status,
        },
        message: `Chevauchement avec une autre séance de ${conflicting.classroom.subjectName} le ${formatDate(
          conflicting.scheduledStart
        )} de ${formatTime(conflicting.scheduledStart)} à ${formatTime(conflicting.scheduledEnd)}.`,
      };
    }

    return { hasConflict: false };
  }

  /**
   * Batch generation of lesson sessions from an agreed TutoringPackage.
   * Maps every planned session deterministically to its Phase 09 per-session financial allocation.
   */
  static async planSessionsFromPackage({
    classroomId,
    startDate,
    recurringSlots,
    userId,
    userRole,
    notes,
  }: PlanPackageSessionsParams) {
    // 1. Verify classroom & authorization
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacherProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        student: {
          include: {
            parent: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        packages: {
          orderBy: { version: "desc" },
          take: 1,
        },
        _count: {
          select: {
            sessions: {
              where: { status: { not: SessionStatus.CANCELLED } },
            },
          },
        },
      },
    });

    if (!classroom) {
      throw new SchedulingEngineError("Classe introuvable.", 404);
    }

    // Role authorization
    if (userRole === UserRole.TEACHER && classroom.teacherProfile.userId !== userId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas l'enseignant de cette classe.", 403);
    }
    if (userRole === UserRole.PARENT && classroom.student.parent.userId !== userId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas le parent de cette classe.", 403);
    }

    const latestPkg = classroom.packages[0];
    if (!latestPkg) {
      throw new SchedulingEngineError(
        "Aucun forfait tarifaire validé n'est associé à cette classe. Veuillez d'abord configurer le forfait.",
        400
      );
    }

    const totalSessions = latestPkg.sessionsCount;
    const existingActiveCount = classroom._count.sessions;
    const remainingToSchedule = totalSessions - existingActiveCount;

    if (remainingToSchedule <= 0) {
      throw new SchedulingEngineError(
        `Le nombre total de séances prévues par le forfait (${totalSessions}) a déjà été planifié.`,
        400
      );
    }

    if (!recurringSlots || recurringSlots.length === 0) {
      throw new SchedulingEngineError("Veuillez renseigner au moins un créneau récurrent par semaine.", 400);
    }

    // Parse allocations from Phase 09 package
    let allocations: SessionAllocationBreakdown[] = [];
    try {
      allocations = latestPkg.allocationsJson ? JSON.parse(latestPkg.allocationsJson) : [];
    } catch {
      allocations = [];
    }

    // Sort slots by dayOfWeek asc, then startTime
    const sortedSlots = [...recurringSlots].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    const startDateTime = this.parseGuineaDate(startDate);
    const durationMinutes = latestPkg.minutesPerSession || 60;
    const isClassroomFunded = classroom.status === ClassroomStatus.ACTIVE && latestPkg.status === PackageStatus.ACTIVE;

    // Generate upcoming dates matching recurringSlots
    const plannedDates: { start: Date; end: Date; sequence: number }[] = [];
    const currentDate = new Date(startDateTime);
    // Rewind or advance to current date midnight
    currentDate.setUTCHours(0, 0, 0, 0);

    const maxDaysToScan = 365; // scan up to 1 year ahead
    let daysScanned = 0;

    while (plannedDates.length < remainingToSchedule && daysScanned < maxDaysToScan) {
      const dayOfWeek = currentDate.getUTCDay();

      for (const slot of sortedSlots) {
        if (slot.dayOfWeek === dayOfWeek) {
          const [hours, mins] = slot.startTime.split(":").map(Number);
          const sessionStart = new Date(currentDate);
          sessionStart.setUTCHours(hours, mins, 0, 0);

          // If session is strictly in the future of the initial startDateTime
          if (sessionStart.getTime() >= startDateTime.getTime()) {
            const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60000);

            // Check for conflict
            const conflict = await this.checkTeacherConflicts(
              classroom.teacherProfileId,
              sessionStart,
              sessionEnd
            );

            if (conflict.hasConflict) {
              throw new SchedulingEngineError(
                `Impossible de planifier : ${conflict.message}`,
                409
              );
            }

            plannedDates.push({
              start: sessionStart,
              end: sessionEnd,
              sequence: existingActiveCount + plannedDates.length + 1,
            });

            if (plannedDates.length >= remainingToSchedule) break;
          }
        }
      }

      // Next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      daysScanned++;
    }

    if (plannedDates.length < remainingToSchedule) {
      throw new SchedulingEngineError(
        `Impossible de trouver suffisamment de créneaux sur l'année pour ${remainingToSchedule} séances. Ajoutez des créneaux hebdomadaires.`,
        400
      );
    }

    // Persist all generated sessions in a single transaction
    const createdSessions = await prisma.$transaction(async (tx) => {
      const records = [];

      for (let i = 0; i < plannedDates.length; i++) {
        const item = plannedDates[i];
        const allocIndex = item.sequence - 1;
        const alloc = allocations[allocIndex] || {
          sessionIndex: item.sequence,
          allocatedAmountGnf: latestPkg.baseSessionRateGnf,
          platformCommissionGnf: Math.round(latestPkg.baseSessionRateGnf * 0.15),
          teacherNetGnf: Math.round(latestPkg.baseSessionRateGnf * 0.85),
        };

        const session = await tx.lessonSession.create({
          data: {
            classroomId: classroom.id,
            packageId: latestPkg.id,
            sessionSequence: item.sequence,
            title: notes || `Séance #${item.sequence} — ${classroom.subjectName}`,
            scheduledStart: item.start,
            scheduledEnd: item.end,
            durationMinutes,
            attendanceStatus: LessonAttendance.PRESENT,
            allocatedAmountGnf: alloc.allocatedAmountGnf,
            platformCommissionGnf: alloc.platformCommissionGnf,
            teacherNetGnf: alloc.teacherNetGnf,
            isFunded: isClassroomFunded,
            status: SessionStatus.SCHEDULED,
          },
          include: {
            classroom: {
              include: {
                student: {
                  select: {
                    id: true,
                    fullName: true,
                    gradeLevel: true,
                    parent: {
                      select: {
                        id: true,
                        user: { select: { fullName: true, phoneNumber: true } },
                      },
                    },
                  },
                },
                teacherProfile: {
                  select: {
                    id: true,
                    user: { select: { fullName: true, phoneNumber: true, email: true } },
                  },
                },
              },
            },
          },
        });

        records.push(session);
      }

      // Send in-app notification to Parent and Teacher
      const recipientIds = [classroom.teacherProfile.userId, classroom.student.parent.userId];
      for (const recId of recipientIds) {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.SCHEDULE_CREATED,
            recipientUserId: recId,
            entityType: "Classroom",
            entityId: classroom.id,
            title: "Planning de cours établi",
            message: `${plannedDates.length} séances de ${classroom.subjectName} ont été planifiées pour ${classroom.student.fullName}.`,
            linkUrl: recId === classroom.teacherProfile.userId ? "/teacher/calendar" : "/parent/calendar",
            priority: NotificationPriority.NORMAL,
          },
          tx
        );
      }

      // Log audit
      await tx.auditLog.create({
        data: {
          userId,
          action: "SESSIONS_BATCH_SCHEDULED",
          entityType: "Classroom",
          entityId: classroom.id,
          detailsJson: JSON.stringify({
            classroomId: classroom.id,
            sessionsCount: records.length,
            packageId: latestPkg.id,
            isFunded: isClassroomFunded,
          }),
        },
      });

      return records;
    });

    return {
      success: true,
      sessionsCount: createdSessions.length,
      packageId: latestPkg.id,
      isFunded: isClassroomFunded,
      sessions: createdSessions,
    };
  }

  /**
   * Reschedule an existing session with validation, conflict prevention, and allocation preservation.
   */
  static async rescheduleSession({
    sessionId,
    newStart,
    newEnd,
    durationMinutes,
    reason,
    actorUserId,
    actorRole,
  }: RescheduleSessionParams) {
    if (!reason || reason.trim().length < 5) {
      throw new SchedulingEngineError("Veuillez indiquer un motif de report d'au moins 5 caractères.", 400);
    }

    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: true,
            student: { include: { parent: true } },
          },
        },
      },
    });

    if (!session) {
      throw new SchedulingEngineError("Séance introuvable.", 404);
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new SchedulingEngineError("Impossible de reprogrammer une séance déjà annulée.", 400);
    }
    if (session.status === SessionStatus.TEACHER_COMPLETED || session.status === SessionStatus.PARENT_APPROVED) {
      throw new SchedulingEngineError("Impossible de reprogrammer une séance déjà effectuée ou validée.", 400);
    }

    // Authorization check
    if (actorRole === UserRole.TEACHER && session.classroom.teacherProfile.userId !== actorUserId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas l'enseignant de cette séance.", 403);
    }
    if (actorRole === UserRole.PARENT && session.classroom.student.parent.userId !== actorUserId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas le parent associé à cette séance.", 403);
    }

    const start = this.parseGuineaDate(newStart);
    let end: Date;
    if (newEnd) {
      end = this.parseGuineaDate(newEnd);
    } else {
      const dur = durationMinutes || session.durationMinutes || 60;
      end = new Date(start.getTime() + dur * 60000);
    }

    if (start >= end) {
      throw new SchedulingEngineError("L'heure de début doit précéder l'heure de fin.", 400);
    }

    // Conflict check on teacher
    const conflict = await this.checkTeacherConflicts(
      session.classroom.teacherProfileId,
      start,
      end,
      session.id
    );

    if (conflict.hasConflict) {
      throw new SchedulingEngineError(
        `Impossible de reprogrammer : ${conflict.message}`,
        409
      );
    }

    const updatedDuration = Math.round((end.getTime() - start.getTime()) / 60000);

    // Save with audit preservation
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          rescheduledFromStart: session.scheduledStart,
          rescheduledFromEnd: session.scheduledEnd,
          rescheduleReason: reason.trim(),
          rescheduledById: actorUserId,
          scheduledStart: start,
          scheduledEnd: end,
          durationMinutes: updatedDuration,
          status: SessionStatus.RESCHEDULED,
          // Exact financial allocation remains strictly immutable
        },
      });

      // Notify the counterpart
      const counterpartId =
        actorRole === UserRole.TEACHER
          ? session.classroom.student.parent.userId
          : session.classroom.teacherProfile.userId;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.SCHEDULE_CHANGED,
          recipientUserId: counterpartId,
          entityType: "LessonSession",
          entityId: sessionId,
          title: "Séance reprogrammée",
          message: `La séance de ${session.classroom.subjectName} a été reportée au ${start.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" })}. Motif : ${reason}`,
          linkUrl: actorRole === UserRole.TEACHER ? "/parent/calendar" : "/teacher/calendar",
          priority: NotificationPriority.HIGH,
          emailPayload: {
            oldTime: session.scheduledStart.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" }),
            newTime: start.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" }),
            reason,
          },
        },
        tx
      );

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "SESSION_RESCHEDULED",
          entityType: "LessonSession",
          entityId: sessionId,
          detailsJson: JSON.stringify({
            previousStart: session.scheduledStart,
            previousEnd: session.scheduledEnd,
            newStart: start,
            newEnd: end,
            reason,
          }),
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Cancel an upcoming session with cancellation reason and audit trail.
   */
  static async cancelSession({
    sessionId,
    reason,
    actorUserId,
    actorRole,
  }: CancelSessionParams) {
    if (!reason || reason.trim().length < 5) {
      throw new SchedulingEngineError("Veuillez indiquer un motif d'annulation explicite.", 400);
    }

    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: true,
            student: { include: { parent: true } },
          },
        },
      },
    });

    if (!session) {
      throw new SchedulingEngineError("Séance introuvable.", 404);
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new SchedulingEngineError("Cette séance est déjà annulée.", 400);
    }
    if (session.status === SessionStatus.TEACHER_COMPLETED || session.status === SessionStatus.PARENT_APPROVED) {
      throw new SchedulingEngineError("Impossible d'annuler une séance déjà réalisée ou validée.", 400);
    }

    // Authorization
    if (actorRole === UserRole.TEACHER && session.classroom.teacherProfile.userId !== actorUserId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas l'enseignant de cette séance.", 403);
    }
    if (actorRole === UserRole.PARENT && session.classroom.student.parent.userId !== actorUserId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas le parent associé à cette séance.", 403);
    }

    const cancelled = await prisma.$transaction(async (tx) => {
      const res = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: actorUserId,
          cancellationReason: reason.trim(),
        },
      });

      // Notify the other participant
      const counterpartId =
        actorRole === UserRole.TEACHER
          ? session.classroom.student.parent.userId
          : session.classroom.teacherProfile.userId;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.LESSON_CANCELLED,
          recipientUserId: counterpartId,
          entityType: "LessonSession",
          entityId: sessionId,
          title: "Séance annulée",
          message: `La séance de ${session.classroom.subjectName} prévue le ${session.scheduledStart.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" })} a été annulée. Motif : ${reason}`,
          linkUrl: actorRole === UserRole.TEACHER ? "/parent/calendar" : "/teacher/calendar",
          priority: NotificationPriority.HIGH,
          emailPayload: {
            sessionDate: session.scheduledStart.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" }),
            reason,
          },
        },
        tx
      );

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "SESSION_CANCELLED",
          entityType: "LessonSession",
          entityId: sessionId,
          detailsJson: JSON.stringify({
            scheduledStart: session.scheduledStart,
            reason,
          }),
        },
      });

      return res;
    });

    return cancelled;
  }

  /**
   * Record lesson attendance, actual duration, and teacher observations.
   * Financial invariant: Actual duration does NOT alter agreed package price.
   */
  static async recordAttendance({
    sessionId,
    attendanceStatus,
    actualStart,
    actualEnd,
    actualDurationMinutes,
    notes,
    actorUserId,
    actorRole,
  }: RecordAttendanceParams) {
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            teacherProfile: true,
            student: { include: { parent: true } },
          },
        },
      },
    });

    if (!session) {
      throw new SchedulingEngineError("Séance introuvable.", 404);
    }

    if (session.status === SessionStatus.CANCELLED) {
      throw new SchedulingEngineError("Impossible d'enregistrer la présence pour une séance annulée.", 400);
    }

    // Role check: Only teacher or admin can record attendance
    if (actorRole === UserRole.TEACHER && session.classroom.teacherProfile.userId !== actorUserId) {
      throw new SchedulingEngineError("Accès refusé. Vous n'êtes pas l'enseignant de cette séance.", 403);
    }
    if (actorRole === UserRole.PARENT) {
      throw new SchedulingEngineError(
        "Les parents ne peuvent pas enregistrer la présence directement ; ils valident la séance lors de la validation parentale.",
        403
      );
    }

    let actStart: Date | null = null;
    let actEnd: Date | null = null;
    let actDur = actualDurationMinutes || session.durationMinutes;

    if (actualStart) {
      actStart = this.parseGuineaDate(actualStart);
    }
    if (actualEnd) {
      actEnd = this.parseGuineaDate(actualEnd);
    }
    if (actStart && actEnd) {
      actDur = Math.max(1, Math.round((actEnd.getTime() - actStart.getTime()) / 60000));
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          attendanceStatus,
          actualStart: actStart,
          actualEnd: actEnd,
          actualDurationMinutes: actDur,
          attendanceNotes: notes ? notes.trim() : session.attendanceNotes,
          attendanceRecordedAt: new Date(),
          attendanceRecordedById: actorUserId,
          // If teacher is recording attendance and session is in progress, advance status if applicable
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorUserId,
          action: "ATTENDANCE_RECORDED",
          entityType: "LessonSession",
          entityId: sessionId,
          detailsJson: JSON.stringify({
            attendanceStatus,
            actualDurationMinutes: actDur,
          }),
        },
      });

      return res;
    });

    return updated;
  }

  /**
   * Fetch calendar sessions with multi-tenant filtering.
   */
  static async getCalendarSessions({
    userId,
    userRole,
    classroomId,
    teacherProfileId,
    studentId,
    startDate,
    endDate,
    status,
  }: CalendarFilterParams) {
    const whereClause: any = {};

    // 1. Role boundaries
    if (userRole === UserRole.TEACHER) {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!teacherProfile) return [];
      whereClause.classroom = { teacherProfileId: teacherProfile.id };
    } else if (userRole === UserRole.PARENT) {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!parentProfile) return [];
      whereClause.classroom = {
        student: { parentId: parentProfile.id },
      };
    } else if (userRole === UserRole.ADMIN) {
      // Admin can filter by teacherProfileId, studentId, or classroomId
      whereClause.classroom = {};
      if (teacherProfileId) whereClause.classroom.teacherProfileId = teacherProfileId;
      if (studentId) whereClause.classroom.studentId = studentId;
    }

    // Specific classroom filter
    if (classroomId) {
      whereClause.classroomId = classroomId;
    }

    // Date range
    if (startDate || endDate) {
      whereClause.scheduledStart = {};
      if (startDate) whereClause.scheduledStart.gte = this.parseGuineaDate(startDate);
      if (endDate) whereClause.scheduledStart.lte = this.parseGuineaDate(endDate);
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    const sessions = await prisma.lessonSession.findMany({
      where: whereClause,
      include: {
        classroom: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                gradeLevel: true,
                parent: {
                  select: {
                    id: true,
                    user: { select: { fullName: true, phoneNumber: true } },
                  },
                },
              },
            },
            teacherProfile: {
              select: {
                id: true,
                user: { select: { fullName: true, phoneNumber: true, email: true } },
              },
            },
            packages: {
              orderBy: { version: "desc" },
              take: 1,
              select: {
                id: true,
                pricingType: true,
                totalAmountGnf: true,
                sessionsCount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    });

    return sessions;
  }
}
