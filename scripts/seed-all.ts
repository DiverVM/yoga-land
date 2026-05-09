/**
 * Combined seed runner for all seeders.
 * Run via: npm run db:seed
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeeder(relativeFile: string) {
  const filePath = path.join(__dirname, relativeFile);
  await new Promise<void>((resolve, reject) => {
    const child = spawn("tsx", [filePath], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`Seeder failed (${relativeFile}) with exit code ${code}`),
      );
    });
  });
}

async function main() {
  await runSeeder("seed-products.ts");
  await runSeeder("seed-admin.ts");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
