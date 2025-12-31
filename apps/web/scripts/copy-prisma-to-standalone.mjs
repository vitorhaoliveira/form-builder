import fs from "node:fs";
import path from "node:path";

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

// Procura .prisma/client (pnpm pode guardar em lugares diferentes)
const candidates = [
  path.resolve("node_modules/.prisma/client"),
  path.resolve("../../node_modules/.prisma/client"),
];

// fallback: dentro do store do pnpm
function findInPnpmStore() {
  const pnpmDir = path.resolve("../../node_modules/.pnpm");
  if (!exists(pnpmDir)) return null;
  const entries = fs.readdirSync(pnpmDir, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const e of entries) {
    const candidate = path.join(pnpmDir, e.name, "node_modules", ".prisma", "client");
    if (exists(candidate)) return candidate;
  }
  return null;
}

let src = candidates.find(exists) || findInPnpmStore();
if (!src) {
  console.error("❌ Could not find Prisma engines folder (.prisma/client).");
  process.exit(1);
}

// ... (encontra src)
const dest1 = path.resolve(".prisma/client"); // ✅ runtime procura aqui: /var/task/apps/web/.prisma/client
const dest2 = path.resolve(".next/standalone/apps/web/.prisma/client"); // ✅ mantém no standalone também

copyDir(src, dest1);
copyDir(src, dest2);

console.log("✅ Copied Prisma engines from:", src);
console.log("✅ Into (runtime path):", dest1);
console.log("✅ Into (standalone):", dest2);
