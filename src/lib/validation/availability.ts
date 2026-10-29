export interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export type AvailabilityInterval = AvailabilitySlot;

export interface AvailabilityValidationResult {
  valid: boolean;
  isValid: boolean;
  error?: string;
  errors: string[];
}

/**
 * Checks if any two availability slots overlap on the same day.
 */
export function hasOverlappingSlots(slots: AvailabilitySlot[]): boolean {
  const byDay: Record<number, AvailabilitySlot[]> = {};
  for (const slot of slots) {
    if (!byDay[slot.dayOfWeek]) {
      byDay[slot.dayOfWeek] = [];
    }
    byDay[slot.dayOfWeek].push(slot);
  }

  for (const dayStr of Object.keys(byDay)) {
    const day = Number(dayStr);
    const daySlots = byDay[day];

    daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < daySlots.length - 1; i++) {
      const current = daySlots[i];
      const next = daySlots[i + 1];

      // If current ends after next starts, they overlap (contiguous endTime == startTime is valid)
      if (current.endTime > next.startTime) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates a list of weekly availability slots.
 * Ensures:
 * 1. Valid dayOfWeek (0-6)
 * 2. Valid time formats ("HH:MM")
 * 3. startTime < endTime (duration > 0)
 * 4. No overlapping intervals on the same day of the week
 */
export function validateAvailabilitySlots(slots: AvailabilitySlot[]): AvailabilityValidationResult {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const errors: string[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      errors.push(`Jour invalide (${slot.dayOfWeek}). Doit être entre 0 et 6.`);
    }

    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
      errors.push(`Format d'heure invalide (${slot.startTime} - ${slot.endTime}). Format attendu : HH:MM.`);
    }

    if (slot.startTime >= slot.endTime) {
      errors.push(`L'heure de fin (${slot.endTime}) doit être strictement postérieure à l'heure de début (${slot.startTime}).`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      isValid: false,
      error: errors[0],
      errors,
    };
  }

  // Check for overlaps on same day
  const byDay: Record<number, AvailabilitySlot[]> = {};
  for (const slot of slots) {
    if (!byDay[slot.dayOfWeek]) {
      byDay[slot.dayOfWeek] = [];
    }
    byDay[slot.dayOfWeek].push(slot);
  }

  for (const dayStr of Object.keys(byDay)) {
    const day = Number(dayStr);
    const daySlots = byDay[day];

    daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    for (let i = 0; i < daySlots.length - 1; i++) {
      const current = daySlots[i];
      const next = daySlots[i + 1];

      if (current.endTime > next.startTime) {
        const overlapErr = `Chevauchement d'horaires détecté pour le même jour : [${current.startTime} - ${current.endTime}] chevauche [${next.startTime} - ${next.endTime}].`;
        errors.push(overlapErr);
        return {
          valid: false,
          isValid: false,
          error: overlapErr,
          errors,
        };
      }
    }
  }

  return {
    valid: true,
    isValid: true,
    errors: [],
  };
}
