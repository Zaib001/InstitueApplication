import { z } from "zod";

export const EducationCycleEnum = z.enum([
  "PRIMAIRE",
  "COLLEGE",
  "LYCEE",
  "SUPERIEUR",
  "AUTRE",
]);

export type EducationCycle = z.infer<typeof EducationCycleEnum>;

/**
 * Validation schema for updating Parent Profile personal information.
 * Protects privileged fields: role, email, password, etc.
 */
export const parentProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom doit comporter au moins 2 caractères.")
    .max(80, "Le nom ne peut pas dépasser 80 caractères."),
  phoneNumber: z
    .string()
    .trim()
    .min(8, "Numéro de téléphone invalide.")
    .max(25, "Numéro de téléphone trop long.")
    .regex(
      /^(\+?224)?[6][0-9]{8}$/,
      "Numéro Guinéen invalide (ex: +224 620 00 00 00 ou 620123456)."
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "La ville doit comporter au moins 2 caractères.")
    .max(60, "Nom de ville trop long.")
    .default("Conakry"),
  address: z
    .string()
    .trim()
    .max(200, "L'adresse ne peut pas dépasser 200 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type ParentProfileUpdateInput = z.infer<typeof parentProfileUpdateSchema>;

/**
 * Base object schema for creating or updating a Student Profile.
 * Minimizes sensitive child data collection while capturing academic needs.
 */
export const baseStudentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom de l'élève doit comporter au moins 2 caractères.")
    .max(80, "Le nom ne peut pas dépasser 80 caractères."),
  cycle: EducationCycleEnum.default("LYCEE"),
  customCycle: z
    .string()
    .trim()
    .max(120, "L'intitulé du cycle personnalisé ne peut dépasser 120 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  gradeLevel: z
    .string()
    .trim()
    .min(1, "Veuillez renseigner la classe ou le niveau scolaire.")
    .max(80, "Intitulé du niveau trop long."),
  schoolName: z
    .string()
    .trim()
    .max(120, "Le nom de l'établissement ne peut dépasser 120 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val) return true;
        const d = new Date(val);
        return !isNaN(d.getTime()) && d < new Date();
      },
      { message: "Date de naissance invalide." }
    ),
  supportNeeds: z
    .string()
    .trim()
    .max(1000, "Les besoins d'accompagnement ne peuvent dépasser 1000 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  preferredSubjects: z
    .array(z.string().trim())
    .max(15, "Maximum 15 matières cibles.")
    .default([]),
  customSubject: z
    .string()
    .trim()
    .max(120, "L'intitulé de la matière personnalisée ne peut dépasser 120 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000, "Les remarques éducatives ne peuvent dépasser 1000 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

/**
 * Validation schema for creating a Student Profile with refinement rules.
 */
export const studentCreateSchema = baseStudentSchema.superRefine((data, ctx) => {
  // If cycle is "AUTRE", customCycle is mandatory
  if (data.cycle === "AUTRE" && (!data.customCycle || data.customCycle.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customCycle"],
      message: "Veuillez préciser le cycle ou la formation spécifique (au moins 2 caractères).",
    });
  }

  // If preferredSubjects includes "Autre", customSubject is mandatory
  if (data.preferredSubjects && data.preferredSubjects.includes("Autre") && (!data.customSubject || data.customSubject.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customSubject"],
      message: "Veuillez préciser la matière ou la formation spécifique (au moins 2 caractères).",
    });
  }
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

/**
 * Validation schema for updating an existing Student Profile.
 */
export const studentUpdateSchema = baseStudentSchema.partial().superRefine((data, ctx) => {
  if (data.cycle === "AUTRE" && (!data.customCycle || data.customCycle.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customCycle"],
      message: "Veuillez préciser le cycle ou la formation spécifique (au moins 2 caractères).",
    });
  }

  if (data.preferredSubjects && data.preferredSubjects.includes("Autre") && (!data.customSubject || data.customSubject.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customSubject"],
      message: "Veuillez préciser la matière ou la formation spécifique (au moins 2 caractères).",
    });
  }
});
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
