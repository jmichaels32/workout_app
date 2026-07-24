#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const movementsDir = path.join(dataDir, "movements");

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

fs.writeFileSync(
  path.join(dataDir, "movements.json"),
  `${JSON.stringify(bundle, null, 2)}\n`
);

console.log(`Built data/movements.json from ${movements.length} movement files.`);
