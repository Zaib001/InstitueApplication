import { describe, it, expect } from "vitest";
import {
  parentRegisterSchema,
  teacherRegisterSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";

describe("Authentication Validation Schemas", () => {
  describe("Parent Registration Schema", () => {
    it("accepts valid parent registration payload", () => {
      const valid = {
        fullName: "Fatoumata Camara",
        email: "fatoumata.camara@test.gn",
        phoneNumber: "620123456",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = parentRegisterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("accepts parent registration with optional empty phone", () => {
      const valid = {
        fullName: "Amadou Diallo",
        email: "amadou.diallo@test.gn",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = parentRegisterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const invalid = {
        fullName: "Fatoumata Camara",
        email: "fatoumata.camara@test.gn",
        password: "Password123!",
        confirmPassword: "DifferentPassword123!",
      };
      const result = parentRegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("ne correspondent pas");
      }
    });

    it("rejects invalid Guinean phone format", () => {
      const invalid = {
        fullName: "Fatoumata Camara",
        email: "fatoumata.camara@test.gn",
        phoneNumber: "12345678", // Must start with 6 and have 9 digits
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = parentRegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Teacher Registration Schema", () => {
    it("requires phone number for teacher accounts (Mobile Money payout)", () => {
      const invalid = {
        fullName: "Professeur Traore",
        email: "traore@test.gn",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = teacherRegisterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("accepts teacher with valid phone number", () => {
      const valid = {
        fullName: "Professeur Traore",
        email: "traore@test.gn",
        phoneNumber: "+224621987654",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = teacherRegisterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("Login Schema", () => {
    it("normalizes email to lowercase", () => {
      const result = loginSchema.safeParse({
        email: "TEST.USER@MonsieurFanyi.GN",
        password: "Password123!",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test.user@monsieurfanyi.gn");
      }
    });

    it("rejects empty password", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Reset Password Schema", () => {
    it("enforces password complexity and match", () => {
      const invalid = {
        token: "abcdef1234567890",
        password: "simple",
        confirmPassword: "simple",
      };
      const result = resetPasswordSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
