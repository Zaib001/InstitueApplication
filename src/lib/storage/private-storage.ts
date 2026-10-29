import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "storage", "private-documents");

// Ensure private uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface StoredFileResult {
  storedFileName: string;
  absolutePath: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256: string;
}

/**
 * Validates and securely saves a private document.
 * Returns unique unpredictable file identifier and metadata.
 */
export async function savePrivateDocument(
  file: File | Blob,
  originalFileName: string
): Promise<StoredFileResult> {
  const mimeType = file.type || "application/octet-stream";

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Format de fichier non autorisé (${mimeType}). Formats acceptés : PDF, JPEG, PNG, WEBP.`
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("Le fichier dépasse la taille maximale autorisée de 5 Mo.");
  }

  // Calculate SHA256 checksum
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

  // Determine safe extension
  const ext = path.extname(originalFileName).toLowerCase() || ".pdf";
  const safeExt = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(ext)
    ? ext
    : ".pdf";

  // Generate unpredictable unique storage name
  const storedFileName = `doc_${crypto.randomUUID()}${safeExt}`;
  const absolutePath = path.join(UPLOADS_DIR, storedFileName);

  // Write file to private disk outside public web root
  await fs.promises.writeFile(absolutePath, buffer);

  return {
    storedFileName,
    absolutePath,
    fileSizeBytes: buffer.length,
    mimeType,
    sha256,
  };
}

/**
 * Retrieves a private document stream or buffer securely.
 * Checks for path traversal and existence.
 */
export async function getPrivateDocument(
  storedFileName: string
): Promise<{ buffer: Buffer; absolutePath: string } | null> {
  // Prevent directory traversal
  const safeBaseName = path.basename(storedFileName);
  const absolutePath = path.join(UPLOADS_DIR, safeBaseName);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(absolutePath);
  return { buffer, absolutePath };
}

/**
 * Safely removes a private document from disk.
 */
export async function deletePrivateDocument(storedFileName: string): Promise<boolean> {
  try {
    const safeBaseName = path.basename(storedFileName);
    const absolutePath = path.join(UPLOADS_DIR, safeBaseName);
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
