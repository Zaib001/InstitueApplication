import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/monsieur_fanyi?schema=public"),
  AUTH_SECRET: z.string().min(16).default("dev_fanyi_secret_key_session_guinea_2026_xyz"),
  DEFAULT_PLATFORM_COMMISSION_PERCENT: z.coerce.number().int().min(1).max(50).default(15),
  PAYMENT_MOCK_ENABLED: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("true"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedConfig: EnvConfig;

try {
  parsedConfig = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.warn("Avertissement de configuration d'environnement:", error.format());
  }
  // En cas d'exécution en environnement de test ou build initial sans env complet
  parsedConfig = envSchema.parse({});
}

export const env = parsedConfig;
