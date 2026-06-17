import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./config.mjs";
import { spawn } from "node:child_process";

function hasFlag(name) {
  return process.argv.includes(name);
}

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Render failed with exit code ${code}`));
    });
  });
}

async function findPackages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const packages = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      packages.push(...(await findPackages(fullPath)));
    } else if (entry.isFile() && entry.name === "production_package.json") {
      packages.push(fullPath);
    }
  }
  return packages;
}

async function main() {
  const source = path.resolve(ROOT, argValue("--source", "production/topics"));
  const outRoot = path.resolve(ROOT, argValue("--out-root", "publish_ready"));
  await stat(source);
  const packages = await findPackages(source);
  const limitInput = argValue("--limit", "");
  const limit = limitInput ? Number(limitInput) : packages.length;
  const dryRun = hasFlag("--dry-run");

  for (const packagePath of packages.slice(0, limit)) {
    const relative = path.relative(ROOT, packagePath);
    const packageFolder = path.basename(path.dirname(packagePath));
    const outDir = path.join(outRoot, packageFolder);
    const args = ["video_engine/render.mjs", "--input", relative, "--out", path.relative(ROOT, outDir)];
    if (dryRun) args.push("--dry-run");
    await runNode(args);
  }

  console.log(`Processed ${Math.min(limit, packages.length)} production package(s).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
