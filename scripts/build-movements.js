#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const movementsDir = path.join(dataDir, "movements");
const outputFile = path.join(dataDir, "movements.json");
const checkOnly = process.argv.includes("--check");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function movementFiles() {
  return fs.readdirSync(movementsDir)
    .filter(file => file.endsWith(".json"))
    .sort();
}

const meta = readJSON(path.join(dataDir, "meta.json"));
const anatomy = readJSON(path.join(dataDir, "anatomy.json"));
const movements = movementFiles().map(file => readJSON(path.join(movementsDir, file)));

const bundle = {
  ...meta,
  anatomy,
  movements
};
const output = `${JSON.stringify(bundle, null, 2)}\n`;

if (checkOnly) {
  const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, "utf8") : "";
  if (current !== output) {
    console.error("data/movements.json is stale. Run: node scripts/build-movements.js");
    process.exit(1);
  }
  console.log(`Verified data/movements.json against ${movements.length} movement files.`);
  process.exit(0);
}

fs.writeFileSync(outputFile, output);
console.log(`Built data/movements.json from ${movements.length} movement files.`);
