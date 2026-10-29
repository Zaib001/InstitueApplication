import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Seeding Master Data: Subjects & Grade Levels (Guinée) ===");

  const subjects = [
    { name: "Mathématiques", category: "Sciences Exactes" },
    { name: "Français & Littérature", category: "Langues & Humanités" },
    { name: "Physique-Chimie", category: "Sciences Physiques" },
    { name: "Sciences de la Vie et de la Terre (SVT)", category: "Sciences Naturelles" },
    { name: "Anglais", category: "Langues Vivantes" },
    { name: "Histoire-Géographie", category: "Sciences Humaines" },
    { name: "Philosophie", category: "Humanités" },
    { name: "Informatique & Numérique", category: "Technologies" },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { name: s.name },
      update: { category: s.category, isActive: true },
      create: { name: s.name, category: s.category, isActive: true },
    });
  }

  const gradeLevels = [
    { name: "Primaire (CP - CM2)", cycle: "PRIMAIRE", orderIndex: 1 },
    { name: "Collège (7ème - 10ème / BEPC)", cycle: "COLLEGE", orderIndex: 2 },
    { name: "Lycée (11ème - Terminale / BAC)", cycle: "LYCEE", orderIndex: 3 },
    { name: "Supérieur & Préparation Concours", cycle: "SUPERIEUR", orderIndex: 4 },
  ];

  for (const g of gradeLevels) {
    await prisma.gradeLevel.upsert({
      where: { name: g.name },
      update: { cycle: g.cycle, orderIndex: g.orderIndex },
      create: { name: g.name, cycle: g.cycle, orderIndex: g.orderIndex },
    });
  }

  console.log("Master data successfully seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
