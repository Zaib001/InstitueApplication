import { z } from "zod";
import { TutoringMode, RequestStatus } from "@prisma/client";

export const TutoringModeEnum = z.enum(["HOME", "ONLINE", "HYBRID"]);
export const BudgetTypeEnum = z.enum(["MONTHLY", "HOURLY"]);

export const FREQUENCY_OPTIONS = [
  { value: "1_WEEKLY", labelFr: "1 séance par semaine (4 séances / mois)", labelEn: "1 session per week (4 sessions / month)" },
  { value: "2_WEEKLY", labelFr: "2 séances par semaine (8 séances / mois — Standard)", labelEn: "2 sessions per week (8 sessions / month — Standard)" },
  { value: "3_WEEKLY", labelFr: "3 séances par semaine (12 séances / mois — Renforcé)", labelEn: "3 sessions per week (12 sessions / month — Intensive)" },
  { value: "WEEKEND", labelFr: "Week-ends uniquement (Samedi & Dimanche)", labelEn: "Weekends only (Saturday & Sunday)" },
  { value: "INTENSIVE", labelFr: "Stage intensif préparatoire aux examens", labelEn: "Intensive exam preparation crash course" },
  { value: "CUSTOM", labelFr: "Rythme sur-mesure", labelEn: "Custom schedule" },
];

export const CONAKRY_COMMUNES = [
  "Ratoma",
  "Dixinn",
  "Matoto",
  "Kaloum",
  "Matam",
  "Sanoyah",
  "Kagbélen",
  "Dubréka",
  "Coyah",
  "Kindia",
  "Autre ville de Guinée",
];

/**
 * Base schema representing all possible fields for a tutoring request.
 */
export const baseTutoringRequestSchema = z.object({
  studentId: z
    .string()
    .min(1, "Veuillez sélectionner l'enfant concerné par cette demande."),
  subjectId: z.string().optional().nullable(),
  subjectName: z
    .string()
    .trim()
    .max(100, "Le nom de la matière est trop long.")
    .default(""),
  customSubject: z
    .string()
    .trim()
    .max(120, "La matière personnalisée ne peut dépasser 120 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  cycle: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .or(z.literal("")),
  customCycle: z
    .string()
    .trim()
    .max(120, "Le cycle personnalisé ne peut dépasser 120 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  gradeLevelName: z
    .string()
    .trim()
    .max(100, "L'intitulé de la classe est trop long.")
    .default(""),
  mode: TutoringModeEnum.default("HOME"),
  frequency: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .or(z.literal("")),
  preferredSchedule: z
    .string()
    .trim()
    .max(255, "Les créneaux souhaités ne peuvent dépasser 255 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  sessionDurationMinutes: z.coerce
    .number()
    .int()
    .min(30, "La durée minimum est de 30 minutes.")
    .max(360, "La durée maximum est de 6 heures.")
    .default(120),
  budgetGnf: z.coerce
    .number()
    .int()
    .min(0, "Le budget ne peut pas être négatif.")
    .default(800000),
  budgetType: BudgetTypeEnum.default("MONTHLY"),
  city: z.string().trim().max(100).default("Conakry"),
  commune: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal("")),
  neighborhood: z
    .string()
    .trim()
    .max(150, "Le quartier ne peut pas dépasser 150 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  locationAddress: z
    .string()
    .trim()
    .max(255, "L'adresse ne peut pas dépasser 255 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  learningGoals: z
    .string()
    .trim()
    .max(2000, "Les objectifs pédagogiques ne peuvent dépasser 2000 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(3000, "La description ne peut pas dépasser 3000 caractères.")
    .optional()
    .default(""),
  notes: z
    .string()
    .trim()
    .max(1500, "Les remarques ne peuvent pas dépasser 1500 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * Validation schema for saving a DRAFT request.
 * Permissive: allows parents to save partial inputs and resume later.
 */
export const tutoringRequestDraftSchema = baseTutoringRequestSchema.partial({
  subjectName: true,
  gradeLevelName: true,
  frequency: true,
  commune: true,
  neighborhood: true,
});

export type TutoringRequestDraftInput = z.infer<typeof tutoringRequestDraftSchema>;

/**
 * Strict validation schema required before a request can be PUBLISHED (status -> OPEN).
 * Ensures all pedagogical, geographical, and budgetary details are valid.
 */
export const tutoringRequestPublishSchema = baseTutoringRequestSchema.superRefine(
  (data, ctx) => {
    // 1. Student required
    if (!data.studentId || data.studentId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["studentId"],
        message: "Veuillez sélectionner l'enfant concerné.",
      });
    }

    // 2. Subject name required
    if (!data.subjectName || data.subjectName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjectName"],
        message: "Veuillez sélectionner ou préciser la matière d'enseignement.",
      });
    }

    // 3. Custom subject refinement if "Autre"
    if (
      data.subjectName === "Autre" &&
      (!data.customSubject || data.customSubject.trim().length < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customSubject"],
        message: "Veuillez préciser l'intitulé de la matière personnalisée (au moins 2 caractères).",
      });
    }

    // 4. Grade level required
    if (!data.gradeLevelName || data.gradeLevelName.trim().length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gradeLevelName"],
        message: "Veuillez indiquer la classe ou le niveau d'enseignement.",
      });
    }

    // 5. Custom cycle refinement if "AUTRE"
    if (
      data.cycle === "AUTRE" &&
      (!data.customCycle || data.customCycle.trim().length < 2)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customCycle"],
        message: "Veuillez préciser la formation ou le cycle personnalisé (au moins 2 caractères).",
      });
    }

    // 6. In-home location requirements
    if (data.mode === "HOME") {
      if (
        (!data.commune || data.commune.trim().length < 2) &&
        (!data.neighborhood || data.neighborhood.trim().length < 2)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["commune"],
          message: "Pour les cours à domicile, veuillez renseigner la commune ou le quartier.",
        });
      }
    }

    // 7. Budget validation (must be at least 50 000 GNF for publication)
    if (!data.budgetGnf || data.budgetGnf < 50000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetGnf"],
        message: "Le budget indiqué doit être d'au moins 50 000 GNF.",
      });
    }
  }
);

export type TutoringRequestPublishInput = z.infer<typeof tutoringRequestPublishSchema>;

