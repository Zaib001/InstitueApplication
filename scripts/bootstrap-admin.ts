import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Monsieur Fanyi — Admin Bootstrap ===");

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@monsieurfanyi.gn";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME || "Administrateur National Monsieur Fanyi";

  if (!password) {
    console.error("ERREUR : La variable d'environnement ADMIN_BOOTSTRAP_PASSWORD n'est pas définie.");
    process.exit(1);
  }

  // 1. Check if an admin account already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (existingAdmin) {
    console.log(`[BOOTSTRAP IGNORÉ] Un compte administrateur existe déjà : ${existingAdmin.email} (ID: ${existingAdmin.id})`);
    console.log("Pour des raisons de sécurité, aucun compte admin supplémentaire n'a été créé.");
    return;
  }

  // 2. Hash password with bcryptjs (12 rounds)
  const passwordHash = await bcrypt.hash(password, 12);

  // 3. Create the initial administrator
  const admin = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      fullName,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // 4. Record audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "INITIAL_ADMIN_BOOTSTRAPPED",
      entityType: "User",
      entityId: admin.id,
      detailsJson: JSON.stringify({ email: admin.email, fullName: admin.fullName }),
    },
  });

  console.log(`[SUCCÈS] Compte Administrateur initial créé avec succès !`);
  console.log(`  - ID : ${admin.id}`);
  console.log(`  - Nom : ${admin.fullName}`);
  console.log(`  - Email : ${admin.email}`);
  console.log(`  - Rôle : ${admin.role}`);
}

main()
  .catch((e) => {
    console.error("Erreur critique lors du bootstrap de l'administrateur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
