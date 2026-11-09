import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";
import { validateAvailabilitySlots } from "@/lib/validation/availability";

describe("Teacher Availability System & Validation", () => {
  let testTeacherUserId: string;
  let testTeacherProfileId: string;

  beforeAll(async () => {
    // Create test user and teacher profile
    const testUser = await prisma.user.create({
      data: {
        email: `teacher.avail.${Date.now()}@monsieurfanyi.gn`,
        fullName: "Prof. Sékou Availability Test",
        passwordHash: "$2b$10$abcdefghijklmnopqrstuvwxyz123456",
        role: UserRole.TEACHER,
        phoneNumber: "629998877",
        isActive: true,
      },
    });
    testTeacherUserId = testUser.id;

    const profile = await prisma.teacherProfile.create({
      data: {
        userId: testUser.id,
        bio: "Test teacher availability profile",
        city: "Conakry",
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });
    testTeacherProfileId = profile.id;
  });

  afterAll(async () => {
    await prisma.availability.deleteMany({
      where: { teacherProfileId: testTeacherProfileId },
    });
    await prisma.teacherProfile.deleteMany({
      where: { userId: testTeacherUserId },
    });
    await prisma.user.deleteMany({
      where: { id: testTeacherUserId },
    });
  });

  it("P10.A1: validates non-overlapping weekly availability slots", () => {
    const validSlots = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
      { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
    ];

    const result = validateAvailabilitySlots(validSlots);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("P10.A2: rejects overlapping slots on the same day", () => {
    const overlappingSlots = [
      { dayOfWeek: 1, startTime: "10:00", endTime: "14:00" },
      { dayOfWeek: 1, startTime: "13:00", endTime: "16:00" }, // Overlaps 13:00 - 14:00
    ];

    const result = validateAvailabilitySlots(overlappingSlots);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("P10.A3: rejects slots where endTime is before or equal to startTime", () => {
    const invalidTimeSlots = [
      { dayOfWeek: 2, startTime: "16:00", endTime: "14:00" },
    ];

    const result = validateAvailabilitySlots(invalidTimeSlots);
    expect(result.isValid).toBe(false);
  });

  it("P10.A4: persists and updates teacher availability in PostgreSQL", async () => {
    const slots = [
      { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
      { dayOfWeek: 2, startTime: "14:00", endTime: "18:00" },
      { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" },
    ];

    // Delete existing and re-create atomically
    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { teacherProfileId: testTeacherProfileId },
      });
      await tx.availability.createMany({
        data: slots.map((s) => ({
          teacherProfileId: testTeacherProfileId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isRecurring: true,
        })),
      });
    });

    const persisted = await prisma.availability.findMany({
      where: { teacherProfileId: testTeacherProfileId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    expect(persisted).toHaveLength(3);
    expect(persisted[0].dayOfWeek).toBe(1);
    expect(persisted[0].startTime).toBe("14:00");
    expect(persisted[0].endTime).toBe("18:00");
    expect(persisted[2].dayOfWeek).toBe(6);
    expect(persisted[2].startTime).toBe("09:00");
    expect(persisted[2].endTime).toBe("17:00");
  });
});

