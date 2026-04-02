import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const SECRET = process.env.ENCRYPTION_SECRET!;

function getKey(): Buffer {
  return crypto.createHash("sha256").update(SECRET).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  const [ivHex, encHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function safeDecrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    return decrypt(text);
  } catch {
    return null;
  }
}
