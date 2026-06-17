import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  BRAND,
  ENGINE_ROOT,
  OFFICIAL_LOGO,
  OUTPUT_ROOT,
  ROOT,
  SCENE_PLAN,
  SUPPORTED_CATEGORIES,
  VIDEO,
} from "./config.mjs";

function argValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function slugify(value) {
  return (
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "video"
  );
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\u20b9/g, "Rs ")
    .replace(/\u00e2\u201a\u00b9/g, "Rs ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text, maxChars) {
  const words = normalizeText(text).split(" ").filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 9);
}

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe", ...options });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${code}\n${stderr.trim()}`));
      }
    });
  });
}

async function requireFfmpeg() {
  try {
    await run("ffmpeg", ["-hide_banner", "-version"]);
  } catch {
    throw new Error("FFmpeg is required to render MP4 and PNG files. Install FFmpeg and rerun this command, or use --dry-run to generate templates only.");
  }
}

function validatePackage(pkg) {
  const errors = [];

  if (!pkg.topic) errors.push("Missing topic");
  if (!SUPPORTED_CATEGORIES.has(pkg.category)) errors.push(`Unsupported category: ${pkg.category}`);
  if (pkg.logo !== OFFICIAL_LOGO) errors.push(`Logo must be ${OFFICIAL_LOGO}`);
  if (!Array.isArray(pkg.slides) || pkg.slides.length < 6) errors.push("Package must include at least 6 slides");

  for (const plan of SCENE_PLAN) {
    const slide = pkg.slides?.find((item) => Number(item.scene) === plan.scene);
    if (!slide?.text) errors.push(`Missing text for Scene ${plan.scene}: ${plan.label}`);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production package:\n- ${errors.join("\n- ")}`);
  }
}

function slideFor(pkg, sceneNumber) {
  return pkg.slides.find((slide) => Number(slide.scene) === sceneNumber);
}

function sceneSvg(pkg, sceneNumber) {
  const slide = slideFor(pkg, sceneNumber);
  const plan = SCENE_PLAN[sceneNumber - 1];
  const isOutro = sceneNumber === 6;
  const title = sceneNumber === 1 ? pkg.thumbnail || pkg.topic : plan.label;
  const bodyLines = wrapText(slide.text, sceneNumber === 1 ? 22 : 30);
  const bodyFontSize = sceneNumber === 1 ? 74 : 58;
  const logoHref = pathToFileURL(path.join(ROOT, OFFICIAL_LOGO)).href;
  const sceneNumberText = String(sceneNumber).padStart(2, "0");

  const body = bodyLines
    .map((line, index) => `<text x="90" y="${650 + index * (bodyFontSize + 18)}" class="body">${escapeXml(line)}</text>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${VIDEO.width}" height="${VIDEO.height}" viewBox="0 0 ${VIDEO.width} ${VIDEO.height}">
  <style>
    .headline { font-family: ${BRAND.headlineFont}; font-size: 76px; font-weight: 800; fill: ${BRAND.secondary}; }
    .body { font-family: ${BRAND.bodyFont}; font-size: ${bodyFontSize}px; font-weight: 600; fill: ${BRAND.secondary}; }
    .meta { font-family: ${BRAND.bodyFont}; font-size: 34px; font-weight: 700; fill: ${BRAND.accent}; letter-spacing: 2px; }
    .small { font-family: ${BRAND.bodyFont}; font-size: 28px; font-weight: 500; fill: ${BRAND.secondary}; opacity: 0.82; }
    .disclaimer { font-family: ${BRAND.bodyFont}; font-size: 25px; font-weight: 500; fill: ${BRAND.secondary}; opacity: 0.74; }
  </style>
  <rect width="1080" height="1920" fill="${BRAND.primary}"/>
  <rect x="54" y="54" width="972" height="1812" rx="38" fill="none" stroke="${BRAND.accent}" stroke-width="4" opacity="0.88"/>
  <rect x="90" y="170" width="220" height="6" fill="${BRAND.accent}"/>
  <text x="90" y="245" class="meta">SCENE ${sceneNumberText} / ${escapeXml(plan.label.toUpperCase())}</text>
  <text x="90" y="390" class="headline">${escapeXml(title)}</text>
  <text x="90" y="475" class="small">${escapeXml(pkg.category)} | ${VIDEO.format}</text>
  ${body}
  ${isOutro ? `<text x="90" y="1510" class="small">${escapeXml(BRAND.tagline)}</text>` : ""}
  ${isOutro ? `<text x="90" y="1572" class="disclaimer">${escapeXml(pkg.compliance?.disclaimer || "Educational content only. This is not financial advice.")}</text>` : ""}
  <image href="${logoHref}" x="720" y="1640" width="260" height="120" preserveAspectRatio="xMidYMid meet"/>
  <text x="90" y="1768" class="small">${escapeXml(BRAND.name)} | ${escapeXml(BRAND.tagline)}</text>
</svg>`;
}

function captionText(pkg) {
  const lines = SCENE_PLAN.map((plan) => normalizeText(slideFor(pkg, plan.scene).text));
  return [
    ...lines,
    "",
    `CTA: ${normalizeText(pkg.cta || slideFor(pkg, 6).text)}`,
    pkg.compliance?.disclaimer || "Educational content only. This is not financial advice.",
  ].join("\n");
}

function previewHtml(pkg, sceneFiles) {
  const cards = sceneFiles
    .map((file, index) => `<article class="scene-card"><img src="scenes/${escapeXml(path.basename(file))}" alt="Scene ${index + 1}"><p>Scene ${index + 1}</p></article>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeXml(pkg.topic)} Video Preview</title>
  <link rel="stylesheet" href="../../templates/styles.css">
</head>
<body>
  <main>
    <h1>${escapeXml(pkg.topic)}</h1>
    <p>${escapeXml(pkg.category)} | ${escapeXml(BRAND.tagline)}</p>
    <section class="scene-grid">
      ${cards}
    </section>
  </main>
</body>
</html>`;
}

async function svgToPng(svgPath, pngPath) {
  await run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", svgPath, "-frames:v", "1", pngPath]);
}

async function renderVideoFromPngs(scenePngs, outPath, duration, fps) {
  const concatPath = path.join(path.dirname(outPath), "concat.txt");
  const concatLines = [];
  for (const png of scenePngs) {
    const ffmpegPath = path.resolve(png).replace(/\\/g, "/").replace(/'/g, "'\\''");
    concatLines.push(`file '${ffmpegPath}'`);
    concatLines.push(`duration ${duration}`);
  }
  concatLines.push(`file '${path.resolve(scenePngs.at(-1)).replace(/\\/g, "/").replace(/'/g, "'\\''")}'`);
  await writeFile(concatPath, `${concatLines.join("\n")}\n`, "utf8");

  await run("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-vf",
    `fps=${fps},scale=${VIDEO.width}:${VIDEO.height},format=yuv420p`,
    "-movflags",
    "+faststart",
    outPath,
  ]);
}

async function renderPackage(inputPath, options) {
  const packagePath = path.resolve(ROOT, inputPath);
  const pkg = JSON.parse(await readFile(packagePath, "utf8"));
  validatePackage(pkg);

  const logoPath = path.join(ROOT, OFFICIAL_LOGO);
  if (!(await fileExists(logoPath))) {
    throw new Error(`Missing official logo asset: ${OFFICIAL_LOGO}`);
  }

  const outDir = path.resolve(ROOT, options.out || path.join(OUTPUT_ROOT, slugify(pkg.topic)));
  const scenesDir = path.join(outDir, "scenes");
  await ensureDir(scenesDir);

  const sceneSvgs = [];
  const scenePngs = [];
  for (const plan of SCENE_PLAN) {
    const svgPath = path.join(scenesDir, `scene_${String(plan.scene).padStart(2, "0")}.svg`);
    const pngPath = path.join(scenesDir, `scene_${String(plan.scene).padStart(2, "0")}.png`);
    await writeFile(svgPath, sceneSvg(pkg, plan.scene), "utf8");
    sceneSvgs.push(svgPath);
    scenePngs.push(pngPath);
  }

  await writeFile(path.join(outDir, "caption.txt"), `${captionText(pkg)}\n`, "utf8");
  await writeFile(path.join(outDir, "preview.html"), previewHtml(pkg, sceneSvgs), "utf8");

  const manifest = {
    topic: pkg.topic,
    category: pkg.category,
    sourcePackage: path.relative(ROOT, packagePath).replace(/\\/g, "/"),
    logo: OFFICIAL_LOGO,
    output: path.relative(ROOT, outDir).replace(/\\/g, "/"),
    format: VIDEO.format,
    scenes: SCENE_PLAN,
    renderer: "ffmpeg",
    socialApisConnected: false,
  };
  await writeFile(path.join(outDir, "render_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (options.dryRun) {
    return { outDir, rendered: false };
  }

  await requireFfmpeg();
  for (let index = 0; index < sceneSvgs.length; index += 1) {
    await svgToPng(sceneSvgs[index], scenePngs[index]);
  }
  await copyFile(scenePngs[0], path.join(outDir, "thumbnail.png"));
  await renderVideoFromPngs(scenePngs, path.join(outDir, "video.mp4"), options.duration, options.fps);

  return { outDir, rendered: true };
}

async function main() {
  const input = argValue("--input");
  if (!input || hasFlag("--help")) {
    console.log([
      "UNLOAN Video Engine",
      "",
      "Usage:",
      "  node video_engine/render.mjs --input production/topics/2026-01-06-02-rule-of-72/production_package.json",
      "  node video_engine/render.mjs --input pilot_launch/rule_of_72/production_package.json --out video_engine/outputs/rule_of_72",
      "  node video_engine/render.mjs --input production/topics/2026-01-06-02-rule-of-72/production_package.json --dry-run",
    ].join("\n"));
    return;
  }

  const result = await renderPackage(input, {
    out: argValue("--out"),
    duration: Number(argValue("--duration", VIDEO.sceneDurationSeconds)),
    fps: Number(argValue("--fps", VIDEO.fps)),
    dryRun: hasFlag("--dry-run"),
  });

  console.log(result.rendered ? `Rendered video package: ${result.outDir}` : `Generated render templates: ${result.outDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
