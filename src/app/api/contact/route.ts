import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const contactSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom complet doit comporter au moins 2 caractères.")
    .max(120, "Le nom est trop long."),
  email: z
    .string()
    .email("Veuillez renseigner une adresse email valide.")
    .max(150, "L'adresse email est trop longue."),
  subject: z
    .string()
    .min(3, "L'objet du message doit comporter au moins 3 caractères.")
    .max(200, "L'objet est trop long."),
  message: z
    .string()
    .min(10, "Le message doit comporter au moins 10 caractères.")
    .max(3000, "Le message ne peut pas dépasser 3 000 caractères."),
  website: z.string().optional(), // Honeypot spam trap
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Honeypot check: If the hidden 'website' field is populated, a bot filled it
    if (body.website && body.website.trim() !== "") {
      return NextResponse.json(
        {
          success: true,
          message: "Votre message a été transmis avec succès.",
        },
        { status: 200 }
      );
    }

    const parseResult = contactSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || "Données de formulaire invalides." },
        { status: 400 }
      );
    }

    const { fullName, email, subject, message } = parseResult.data;

    await prisma.contactInquiry.create({
      data: {
        fullName,
        email,
        subject,
        message,
        status: "NEW",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Votre message a bien été transmis à la direction Monsieur Fanyi. Notre équipe vous répondra par email à " +
        email +
        " sous 24 à 48 heures.",
    });
  } catch (error) {
    console.error("Error processing contact inquiry:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ultérieurement." },
      { status: 500 }
    );
  }
}

