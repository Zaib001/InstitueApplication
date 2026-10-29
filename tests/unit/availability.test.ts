import { describe, it, expect } from "vitest";
import {
  validateAvailabilitySlots,
  hasOverlappingSlots,
  AvailabilityInterval,
} from "@/lib/validation/availability";

describe("Availability Validation & Overlap Prevention (P03.08)", () => {
  it("accepts valid non-overlapping slots across different and same days", () => {
    const slots: AvailabilityInterval[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "10:00" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "12:00" }, // contiguous is allowed
      { dayOfWeek: 1, startTime: "14:00", endTime: "16:00" },
      { dayOfWeek: 2, startTime: "08:00", endTime: "10:00" },
      { dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
    ];

    const result = validateAvailabilitySlots(slots);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects and rejects overlapping slots on the same day", () => {
    const slots: AvailabilityInterval[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "10:30" },
      { dayOfWeek: 1, startTime: "09:30", endTime: "11:00" }, // overlaps by 1 hour
    ];

    const result = validateAvailabilitySlots(slots);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Chevauchement");
  });

  it("detects identical overlapping slots", () => {
    const slots: AvailabilityInterval[] = [
      { dayOfWeek: 3, startTime: "14:00", endTime: "16:00" },
      { dayOfWeek: 3, startTime: "14:00", endTime: "16:00" },
    ];

    expect(hasOverlappingSlots(slots)).toBe(true);
  });

  it("rejects invalid time formats", () => {
    const slots: AvailabilityInterval[] = [
      { dayOfWeek: 1, startTime: "8:00", endTime: "10:00" }, // missing leading zero
    ];

    const result = validateAvailabilitySlots(slots);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Format d'heure invalide");
  });

  it("rejects slots where startTime is after or equal to endTime", () => {
    const invertedSlots: AvailabilityInterval[] = [
      { dayOfWeek: 2, startTime: "16:00", endTime: "14:00" },
    ];

    const equalSlots: AvailabilityInterval[] = [
      { dayOfWeek: 2, startTime: "14:00", endTime: "14:00" },
    ];

    expect(validateAvailabilitySlots(invertedSlots).isValid).toBe(false);
    expect(validateAvailabilitySlots(equalSlots).isValid).toBe(false);
  });

  it("rejects invalid dayOfWeek (< 0 or > 6)", () => {
    const invalidDay: AvailabilityInterval[] = [
      { dayOfWeek: 7, startTime: "08:00", endTime: "10:00" },
    ];

    const result = validateAvailabilitySlots(invalidDay);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain("Jour invalide");
  });
});
