#!/usr/bin/env node
/**
 * Production startup wrapper for Render (and containerized environments)
 * 1. Safely syncs Prisma schema (prisma db push) without needing SSH/Shell access
 * 2. Seeds essential master data (Subjects & Grade Levels) if not already present
 * 3. Bootstraps the initial admin account if ADMIN_BOOTSTRAP_PASSWORD is set
 * 4. Starts the Next.js production server on the assigned PORT
 */

import { spawnSync, spawn } from "child_process";

console.log("-------------------------------------------------------------");
console.log("🎓 Monsieur Fanyi — Production Startup Initialization");
console.log("-------------------------------------------------------------");

const hasDatabase = Boolean(process.env.DATABASE_URL);

if (hasDatabase) {
  console.log("📦 Synchronizing database schema with Prisma (db push)...");
  try {
    const dbPush = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    if (dbPush.status === 0) {
      console.log("✅ Database schema synchronized successfully.");
    } else {
      console.warn("⚠️ Database sync returned non-zero status. Continuing startup...");
    }
  } catch (err) {
    console.error("⚠️ Failed to execute prisma db push:", err);
  }

  console.log("🌱 Verifying and seeding master data (Subjects & Grade Levels)...");
  try {
    const seedMaster = spawnSync("npx", ["tsx", "scripts/seed-master-data.ts"], {
      stdio: "inherit",
      shell: true,
      env: process.env,
    });
    if (seedMaster.status === 0) {
      console.log("✅ Master data verified.");
    }
  } catch (err) {
    console.warn("⚠️ Master data seeding skipped or failed:", err);
  }

  if (process.env.ADMIN_BOOTSTRAP_PASSWORD) {
    console.log("🔐 Checking initial administrator bootstrap...");
    try {
      const adminBootstrap = spawnSync("npx", ["tsx", "scripts/bootstrap-admin.ts"], {
        stdio: "inherit",
        shell: true,
        env: process.env,
      });
      if (adminBootstrap.status === 0) {
        console.log("✅ Administrator status checked.");
      }
    } catch (err) {
      console.warn("⚠️ Admin bootstrap skipped or failed:", err);
    }
  }
} else {
  console.warn("⚠️ DATABASE_URL not set. Skipping database sync & seed.");
}

const port = process.env.PORT || 3000;
console.log(`🚀 Launching Next.js server on port ${port}...`);

const nextProcess = spawn("npx", ["next", "start", "-p", String(port), "-H", "0.0.0.0"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

const handleTermination = (signal) => {
  console.log(`Received ${signal}, forwarding to Next.js server...`);
  nextProcess.kill(signal);
};

process.on("SIGINT", () => handleTermination("SIGINT"));
process.on("SIGTERM", () => handleTermination("SIGTERM"));

nextProcess.on("close", (code) => {
  process.exit(code ?? 0);
});
