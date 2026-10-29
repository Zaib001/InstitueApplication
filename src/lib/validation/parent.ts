import { z } from "zod";

export const EducationCycleEnum = z.enum([
  "PRIMAIRE",
  "COLLEGE",
  "LYCEE",
  "SUPERIEUR",
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
 * Validation schema for creating a Student Profile.
 * Minimizes sensitive child data collection while capturing academic needs.
 */
export const studentCreateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Le nom de l'élève doit comporter au moins 2 caractères.")
    .max(80, "Le nom ne peut pas dépasser 80 caractères."),
  cycle: EducationCycleEnum.default("LYCEE"),
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
  notes: z
    .string()
    .trim()
    .max(1000, "Les remarques éducatives ne peuvent dépasser 1000 caractères.")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

/**
 * Validation schema for updating an existing Student Profile.
 */
export const studentUpdateSchema = studentCreateSchema.partial();
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
