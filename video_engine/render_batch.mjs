import { readFile, readdir, stat, writeFile } from "node:fs/promises";
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

function batchSummaryMarkdown(summary) {
  const failedTopics = summary.failedTopics.length
    ? summary.failedTopics.map((item) => `- ${item.topic}: ${item.score}/100 - ${item.status}`).join("\n")
    : "- None";
  const reasons = summary.commonFailureReasons.length
    ? summary.commonFailureReasons.map((item) => `- ${item.reason}: ${item.count}`).join("\n")
    : "- None";
  const rows = summary.videos
    .map((item) => `| ${item.topic} | ${item.score} | ${item.status} | ${item.ratingBand} |`)
    .join("\n");

  return `# UNLOAN Batch Readability Summary

## Results

- Total videos rendered: ${summary.totalVideosRendered}
- Production-ready videos: ${summary.productionReadyVideos}
- Not-ready videos: ${summary.notReadyVideos}
- Preview-only videos: ${summary.previewOnlyVideos}
- Average score: ${summary.averageScore}
- Lowest score: ${summary.lowestScore}

## Videos

| Topic | Score | Status | Rating Band |
| --- | ---: | --- | --- |
${rows}

## Failed Topics

${failedTopics}

## Common Failure Reasons

${reasons}
`;
}

async function main() {
  const source = path.resolve(ROOT, argValue("--source", "production/topics"));
  const outRoot = path.resolve(ROOT, argValue("--out-root", "publish_ready"));
  await stat(source);
  const packages = await findPackages(source);
  const limitInput = argValue("--limit", "");
  const limit = limitInput ? Number(limitInput) : packages.length;
  const dryRun = hasFlag("--dry-run");
  const mode = argValue("--mode", "production");
  const reports = [];

  for (const packagePath of packages.slice(0, limit)) {
    const relative = path.relative(ROOT, packagePath);
    const packageFolder = path.basename(path.dirname(packagePath));
    const outDir = path.join(outRoot, packageFolder);
    const args = ["video_engine/render.mjs", "--input", relative, "--out", path.relative(ROOT, outDir), "--mode", mode];
    if (dryRun) args.push("--dry-run");
    await runNode(args);
    const report = JSON.parse(await readFile(path.join(outDir, "readability_report.json"), "utf8"));
    reports.push({
      topic: JSON.parse(await readFile(packagePath, "utf8")).topic,
      score: report.score,
      status: report.status,
      ratingBand: report.ratingBand,
      productionReady: report.productionReady,
      hardFailures: report.hardFailures,
      failedChecks: report.failedChecks,
      report: path.relative(ROOT, path.join(outDir, "readability_report.json")).replace(/\\/g, "/"),
    });
  }

  const failureCounts = new Map();
  for (const report of reports.filter((item) => item.status === "Not Production Ready")) {
    for (const reason of [...report.hardFailures, ...report.failedChecks.map((item) => item.label)]) {
      failureCounts.set(reason, (failureCounts.get(reason) ?? 0) + 1);
    }
  }
  const scores = reports.map((report) => report.score);
  const summary = {
    mode,
    totalVideosRendered: reports.length,
    productionReadyVideos: reports.filter((report) => report.status === "Production Ready").length,
    notReadyVideos: reports.filter((report) => report.status === "Not Production Ready").length,
    previewOnlyVideos: reports.filter((report) => report.status === "Preview Only").length,
    averageScore: scores.length ? Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10 : 0,
    lowestScore: scores.length ? Math.min(...scores) : 0,
    failedTopics: reports.filter((report) => report.status === "Not Production Ready"),
    commonFailureReasons: [...failureCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((first, second) => second.count - first.count || first.reason.localeCompare(second.reason)),
    videos: reports,
  };
  await writeFile(path.join(outRoot, "batch_summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await writeFile(path.join(outRoot, "batch_summary.md"), `${batchSummaryMarkdown(summary).trimEnd()}\n`, "utf8");

  console.log(`Processed ${reports.length} production package(s).`);
  console.log(`Batch average: ${summary.averageScore}/100. Production ready: ${summary.productionReadyVideos}. Not ready: ${summary.notReadyVideos}. Preview only: ${summary.previewOnlyVideos}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
