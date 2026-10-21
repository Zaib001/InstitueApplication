import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, UserRole, TeacherVerificationStatus } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateSecureResetToken, hashToken } from "@/lib/auth/tokens";

const prisma = new PrismaClient();

describe("Authentication Integration & Database Workflows", () => {
  const testParentEmail = `parent.test.${Date.now()}@monsieurfanyi.gn`;
  const testTeacherEmail = `teacher.test.${Date.now()}@monsieurfanyi.gn`;
  const testPassword = "PasswordSecure2026!";

  afterAll(async () => {
    // Clean up test records
    await prisma.user.deleteMany({
      where: {
        email: { in: [testParentEmail, testTeacherEmail] },
      },
    });
    await prisma.$disconnect();
  });

  it("P02.04: registers a parent, creates ParentProfile, and never stores plaintext password", async () => {
    const passwordHash = await hashPassword(testPassword);

    const user = await prisma.user.create({
      data: {
        fullName: "Parent Test Intégration",
        email: testParentEmail,
        phoneNumber: "620000001",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipé Centre",
          },
        },
      },
      include: {
        parentProfile: true,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.role).toBe(UserRole.PARENT);
    expect(user.passwordHash).not.toBe(testPassword);
    expect(user.passwordHash.startsWith("$2")).toBe(true);
    expect(user.parentProfile).toBeDefined();
    expect(user.parentProfile?.city).toBe("Conakry");
  });

  it("P02.05: registers a teacher with PENDING_REVIEW verification status", async () => {
    const passwordHash = await hashPassword(testPassword);

    const user = await prisma.user.create({
      data: {
        fullName: "Professeur Test Intégration",
        email: testTeacherEmail,
        phoneNumber: "620000002",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            city: "Conakry",
            verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
          },
        },
      },
      include: {
        teacherProfile: true,
      },
    });

    expect(user.id).toBeDefined();
    expect(user.role).toBe(UserRole.TEACHER);
    expect(user.teacherProfile?.verificationStatus).toBe(
      TeacherVerificationStatus.PENDING_REVIEW
    );
  });

  it("P02.04 & P02.05: enforces email uniqueness in PostgreSQL", async () => {
    const passwordHash = await hashPassword(testPassword);

    await expect(
      prisma.user.create({
        data: {
          fullName: "Doublon Test",
          email: testParentEmail,
          passwordHash,
          role: UserRole.PARENT,
        },
      })
    ).rejects.toThrow();
  });

  it("P02.06: authenticates credentials against database bcrypt hash", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testParentEmail },
    });

    expect(user).not.toBeNull();
    if (!user) return;

    const isMatch = await verifyPassword(testPassword, user.passwordHash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123!", user.passwordHash);
    expect(isWrongMatch).toBe(false);
  });

  it("P02.07: handles password reset token lifecycle and single-use enforcement", async () => {
    const user = await prisma.user.findUnique({
      where: { email: testParentEmail },
    });
    expect(user).not.toBeNull();
    if (!user) return;

    // 1. Generate reset token
    const { plainToken, tokenHash } = generateSecureResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    expect(resetToken.id).toBeDefined();
    expect(resetToken.usedAt).toBeNull();

    // 2. Verify token lookup via computed hash
    const foundToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(plainToken) },
    });
    expect(foundToken).not.toBeNull();
    expect(foundToken?.userId).toBe(user.id);

    // 3. Mark token as used upon successful reset
    const newPassword = "BrandNewPassword2026!";
    const newHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // 4. Verify old token cannot be reused
    const usedToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    expect(usedToken?.usedAt).not.toBeNull();

    // 5. Verify new password works and old password fails
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(await verifyPassword(newPassword, updatedUser!.passwordHash)).toBe(true);
    expect(await verifyPassword(testPassword, updatedUser!.passwordHash)).toBe(false);
  });
});
