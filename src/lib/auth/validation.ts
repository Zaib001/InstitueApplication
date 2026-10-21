import { z } from "zod";

export const parentRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Le nom complet doit comporter au moins 2 caractères.")
      .max(100, "Le nom ne doit pas dépasser 100 caractères."),
    email: z
      .string()
      .email("Veuillez fournir une adresse email valide.")
      .max(150, "L'email ne doit pas dépasser 150 caractères.")
      .transform((val) => val.trim().toLowerCase()),
    phoneNumber: z
      .string()
      .regex(
        /^(?:\+224|00224)?[6][0-9]{8}$/,
        "Veuillez renseigner un numéro guinéen valide (ex: 620123456 ou +224620123456)."
      )
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Le mot de passe doit comporter au moins 8 caractères.")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule.")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const teacherRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Le nom complet doit comporter au moins 2 caractères.")
      .max(100, "Le nom ne doit pas dépasser 100 caractères."),
    email: z
      .string()
      .email("Veuillez fournir une adresse email valide.")
      .max(150, "L'email ne doit pas dépasser 150 caractères.")
      .transform((val) => val.trim().toLowerCase()),
    phoneNumber: z.string().regex(
      /^(?:\+224|00224)?[6][0-9]{8}$/,
      "Veuillez renseigner un numéro guinéen valide (ex: 620123456 ou +224620123456)."
    ),
    password: z
      .string()
      .min(8, "Le mot de passe doit comporter au moins 8 caractères.")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule.")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .email("Veuillez fournir une adresse email valide.")
    .transform((val) => val.trim().toLowerCase()),
  password: z.string().min(1, "Veuillez renseigner votre mot de passe."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Veuillez fournir une adresse email valide.")
    .transform((val) => val.trim().toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "Jeton de réinitialisation invalide ou manquant."),
    password: z
      .string()
      .min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères.")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule.")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit comporter au moins 2 caractères.")
    .max(100, "Le nom ne doit pas dépasser 100 caractères.")
    .optional(),
  phoneNumber: z
    .string()
    .regex(
      /^(?:\+224|00224)?[6][0-9]{8}$/,
      "Veuillez renseigner un numéro guinéen valide (ex: 620123456)."
    )
    .optional()
    .or(z.literal("")),
  address: z.string().max(200, "L'adresse ne doit pas dépasser 200 caractères.").optional(),
  city: z.string().max(100).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Veuillez fournir votre mot de passe actuel."),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères.")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une lettre majuscule.")
      .regex(/[a-z]/, "Le mot de passe doit contenir au moins une lettre minuscule.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les nouveaux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
