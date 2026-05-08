import { promisify } from "node:util";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptAsync = promisify(scrypt);
const SALT_BYTES = 16;
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derivedHash = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  const storedHash = Buffer.from(hash, "hex");
  if (derivedHash.length !== storedHash.length) return false;
  return timingSafeEqual(derivedHash, storedHash);
}
