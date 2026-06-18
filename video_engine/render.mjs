import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  BRAND,
  DESIGN_TOKENS,
  OFFICIAL_LOGO,
  OUTPUT_ROOT,
  ROOT,
  SCENE_PLAN,
  VIDEO,
  loadPreset,
} from "./config.mjs";
import {
  validatePackageStructure,
  validateReadableScenes,
} from "./validation/readability.mjs";
import {
  calculateReadabilityScore,
  printScoreSummary,
  readabilityReportMarkdown,
} from "./validation/readability_score.mjs";
import {
  buildTextHierarchy,
  normalizeText,
  wrapByWordCount,
} from "./utils/text_hierarchy.mjs";

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

function simplifySceneText(text, sceneNumber, duration, pkg) {
  const density = DESIGN_TOKENS.density;
  const hierarchy = buildTextHierarchy(text, {
    keyMaxWords: density.headline_max_words,
    supportMaxWords: density.support_max_words,
    totalMaxWords: Math.min(density.total_max_words, Math.floor(duration * 4)),
    topic: pkg.topic,
    category: pkg.category,
    scene: sceneNumber,
  });

  if (sceneNumber === 6) {
    return {
      keyMessage: hierarchy.keyMessage,
      supportMessage: BRAND.tagline,
      simplified: hierarchy.simplified,
      hierarchySource: hierarchy.source,
    };
  }

  return {
    keyMessage: hierarchy.keyMessage,
    supportMessage: hierarchy.supportMessage,
    simplified: hierarchy.simplified,
    hierarchySource: hierarchy.source,
  };
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

function slideFor(pkg, sceneNumber) {
  return pkg.slides.find((slide) => Number(slide.scene) === sceneNumber);
}

function buildScenes(pkg, durationOverride = 0) {
  return SCENE_PLAN.map((plan) => {
    const slide = slideFor(pkg, plan.scene);
    const duration = durationOverride > 0 ? durationOverride : plan.duration;
    const simplified = simplifySceneText(slide.text, plan.scene, duration, pkg);
    return {
      ...plan,
      ...simplified,
      duration,
      originalText: normalizeText(slide.text),
    };
  });
}

function sceneSvg(pkg, scene, preset) {
  const isOutro = scene.scene === 6;
  const density = DESIGN_TOKENS.density;
  const layout = DESIGN_TOKENS.layout;
  const keyLines = wrapByWordCount(scene.keyMessage, density.headline_words_per_line, density.headline_max_lines);
  const supportLines = wrapByWordCount(scene.supportMessage, density.support_words_per_line, density.support_max_lines);
  const type = DESIGN_TOKENS.typography;
  const logoHref = pathToFileURL(path.join(ROOT, OFFICIAL_LOGO)).href;
  const supportY = layout.key_y + keyLines.length * layout.key_line_gap + layout.support_gap;
  const keyMessage = keyLines
    .map((line, index) => `<text x="${layout.key_x}" y="${layout.key_y + index * layout.key_line_gap}" class="key-message">${escapeXml(line)}</text>`)
    .join("\n");
  const supportMessage = supportLines
    .map((line, index) => `<text x="${layout.key_x}" y="${supportY + index * layout.support_line_gap}" class="support-message">${escapeXml(line)}</text>`)
    .join("\n");
  const debugLabel = preset.show_scene_numbers
    ? `<text x="110" y="210" class="debug">SCENE ${scene.scene} / ${escapeXml(scene.label.toUpperCase())}</text>`
    : "";
  const categoryLabel = preset.show_category_label
    ? `<text x="110" y="390" class="category">${escapeXml(scene.label.toUpperCase())}</text>`
    : "";
  const debugBorder = preset.show_debug_boundaries
    ? `<rect x="90" y="120" width="900" height="1680" fill="none" stroke="${BRAND.negative}" stroke-width="3" stroke-dasharray="16 12"/>`
    : "";
  const footerBranding = isOutro || preset.show_footer_branding_on_every_scene
    ? `<text x="110" y="1540" class="tagline">${escapeXml(BRAND.tagline)}</text>
  <text x="110" y="1600" class="disclaimer">${escapeXml(pkg.compliance?.disclaimer || "Educational content only. This is not financial advice.")}</text>
  <image href="${logoHref}" x="700" y="1515" width="260" height="140" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${VIDEO.width}" height="${VIDEO.height}" viewBox="0 0 ${VIDEO.width} ${VIDEO.height}">
  <style>
    .key-message { font-family: ${BRAND.headlineFont}; font-size: ${isOutro ? type.cta_preferred : type.headline_preferred}px; font-weight: 800; fill: ${BRAND.secondary}; text-anchor: start; }
    .support-message { font-family: ${BRAND.bodyFont}; font-size: ${type.secondary_preferred}px; font-weight: 500; fill: ${isOutro ? BRAND.accent : BRAND.secondary}; opacity: 0.92; text-anchor: start; }
    .category { font-family: ${BRAND.bodyFont}; font-size: ${type.supporting_preferred}px; font-weight: 700; fill: ${BRAND.accent}; }
    .tagline { font-family: ${BRAND.bodyFont}; font-size: ${type.supporting_preferred}px; font-weight: 700; fill: ${BRAND.secondary}; }
    .disclaimer { font-family: ${BRAND.bodyFont}; font-size: ${type.disclaimer_preferred}px; font-weight: 500; fill: ${BRAND.secondary}; opacity: 0.78; }
    .debug { font-family: Arial, sans-serif; font-size: 28px; font-weight: 700; fill: ${BRAND.negative}; }
  </style>
  <rect width="1080" height="1920" fill="${BRAND.primary}"/>
  <rect x="${layout.panel_x}" y="${layout.panel_y}" width="${layout.panel_width}" height="${layout.panel_height}" rx="22" fill="${BRAND.panel}" stroke="${BRAND.accent}" stroke-width="2" opacity="0.98"/>
  <rect x="${layout.key_x}" y="390" width="150" height="7" fill="${BRAND.accent}"/>
  ${categoryLabel}
  ${keyMessage}
  ${supportMessage}
  ${footerBranding}
  ${debugLabel}
  ${debugBorder}
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

function previewHtml(pkg, sceneFiles, preset) {
  const cards = sceneFiles
    .map((file, index) => `<article class="scene-card"><img src="scenes/${escapeXml(path.basename(file))}" alt="Scene ${index + 1}"><p>Scene ${index + 1}</p></article>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeXml(pkg.topic)} Video Preview</title>
  <style>
    body { margin: 0; padding: 32px; background: ${BRAND.primary}; color: ${BRAND.secondary}; font-family: Arial, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; }
    .scene-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; }
    .scene-card { border: 1px solid ${BRAND.accent}; padding: 12px; }
    .scene-card img { display: block; width: 100%; aspect-ratio: 9 / 16; object-fit: cover; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeXml(pkg.topic)}</h1>
    <p>${escapeXml(pkg.category)} | ${escapeXml(BRAND.tagline)} | ${escapeXml(preset.name)} mode</p>
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

async function renderVideoFromPngs(scenePngs, scenes, outPath, fps) {
  const concatPath = path.join(path.dirname(outPath), "concat.txt");
  const concatLines = [];
  for (let index = 0; index < scenePngs.length; index += 1) {
    const png = scenePngs[index];
    const ffmpegPath = path.resolve(png).replace(/\\/g, "/").replace(/'/g, "'\\''");
    concatLines.push(`file '${ffmpegPath}'`);
    concatLines.push(`duration ${scenes[index].duration}`);
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
  const preset = loadPreset(options.mode);
  const structureReport = validatePackageStructure(pkg);
  for (const warning of structureReport.warnings) console.warn(`PACKAGE WARNING: ${warning}`);
  const fatalStructureErrors = structureReport.errors.filter((error) => !error.startsWith("Logo path must be exactly"));
  if (fatalStructureErrors.length > 0) {
    throw new Error(`Invalid production package:\n- ${fatalStructureErrors.join("\n- ")}`);
  }
  const scenes = buildScenes(pkg, options.duration);
  const readabilityReport = validateReadableScenes(scenes, DESIGN_TOKENS, preset);
  const scoreReport = calculateReadabilityScore({
    pkg,
    scenes,
    tokens: DESIGN_TOKENS,
    preset,
    validation: {
      errors: [...structureReport.errors, ...readabilityReport.errors],
      warnings: [...structureReport.warnings, ...readabilityReport.warnings],
    },
  });
  printScoreSummary(pkg, scoreReport);

  const logoPath = path.join(ROOT, OFFICIAL_LOGO);
  if (!(await fileExists(logoPath))) {
    throw new Error(`Missing official logo asset: ${OFFICIAL_LOGO}`);
  }

  const outDir = path.resolve(ROOT, options.out || path.join(OUTPUT_ROOT, slugify(pkg.topic)));
  const scenesDir = path.join(outDir, "scenes");
  await ensureDir(scenesDir);

  const sceneSvgs = [];
  const scenePngs = [];
  for (const scene of scenes) {
    const svgPath = path.join(scenesDir, `scene_${String(scene.scene).padStart(2, "0")}.svg`);
    const pngPath = path.join(scenesDir, `scene_${String(scene.scene).padStart(2, "0")}.png`);
    await writeFile(svgPath, sceneSvg(pkg, scene, preset), "utf8");
    sceneSvgs.push(svgPath);
    scenePngs.push(pngPath);
  }

  await writeFile(path.join(outDir, "caption.txt"), `${captionText(pkg)}\n`, "utf8");
  await writeFile(path.join(outDir, "preview.html"), previewHtml(pkg, sceneSvgs, preset), "utf8");
  await writeFile(path.join(outDir, "readability_report.json"), `${JSON.stringify(scoreReport, null, 2)}\n`, "utf8");
  await writeFile(path.join(outDir, "readability_report.md"), `${readabilityReportMarkdown(pkg, scoreReport).trimEnd()}\n`, "utf8");

  const manifest = {
    topic: pkg.topic,
    category: pkg.category,
    sourcePackage: path.relative(ROOT, packagePath).replace(/\\/g, "/"),
    logo: OFFICIAL_LOGO,
    output: path.relative(ROOT, outDir).replace(/\\/g, "/"),
    format: VIDEO.format,
    mode: preset.name,
    productionStatus: scoreReport.status,
    readabilityScore: scoreReport.score,
    productionReady: scoreReport.productionReady,
    totalDurationSeconds: scenes.reduce((total, scene) => total + scene.duration, 0),
    scenes: scenes.map(({ originalText, ...scene }) => scene),
    readability: {
      errors: scoreReport.hardFailures,
      warnings: scoreReport.warnings,
      designTokens: "video_engine/design_tokens.json",
      reportJson: "readability_report.json",
      reportMarkdown: "readability_report.md",
    },
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
  await renderVideoFromPngs(scenePngs, scenes, path.join(outDir, "video.mp4"), options.fps);

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
      "  node video_engine/render.mjs --input pilot_launch/rule_of_72/production_package.json --mode debug --dry-run",
      "  node video_engine/render.mjs --input production/topics/2026-01-06-02-rule-of-72/production_package.json --dry-run",
    ].join("\n"));
    return;
  }

  const result = await renderPackage(input, {
    out: argValue("--out"),
    duration: Number(argValue("--duration", "0")),
    fps: Number(argValue("--fps", VIDEO.fps)),
    mode: argValue("--mode", "production"),
    dryRun: hasFlag("--dry-run"),
  });

  console.log(result.rendered ? `Rendered video package: ${result.outDir}` : `Generated render templates: ${result.outDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
