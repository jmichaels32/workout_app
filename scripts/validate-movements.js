#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const movementsDir = path.join(dataDir, "movements");
const researchDir = path.join(dataDir, "research");

const TRAINING_RATINGS = [
  "hypertrophy",
  "strength",
  "joint_resilience",
  "athletic_transfer",
  "control",
  "fatigue_efficiency"
];
const METADATA_RATINGS = ["setup", "ease", "progression", "support"];
const REQUIRED_RATINGS = [...TRAINING_RATINGS, ...METADATA_RATINGS];
const MUSCLE_GROUPS = ["primary", "secondary", "support"];

const errors = [];
let anatomy = null;
let anatomyIndex = null;

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${relative(file)}: invalid JSON: ${error.message}`);
    return null;
  }
}

function relative(file) {
  return path.relative(root, file);
}

function requireField(object, field, file) {
  if (object?.[field] === undefined || object?.[field] === null || object?.[field] === "") {
    errors.push(`${relative(file)}: missing required field "${field}"`);
  }
}

function scoreFor(value) {
  return Number(typeof value === "object" && value !== null ? value.score : value);
}

function validateRating(value, key, file) {
  const score = scoreFor(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    errors.push(`${relative(file)}: ratings.${key}.score must be a number from 0 to 100`);
  }
  if (typeof value === "object" && value !== null && !value.rationale) {
    errors.push(`${relative(file)}: ratings.${key}.rationale is required`);
  }
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function anatomyNamesFor(muscle) {
  return [
    muscle?.name,
    muscle?.displayName,
    ...(muscle?.aliases || [])
  ].filter(Boolean);
}

function buildAnatomyIndex(file) {
  if (!Array.isArray(anatomy?.muscles) || !anatomy.muscles.length) {
    errors.push(`${relative(file)}: muscles must be a non-empty array`);
    return new Map();
  }

  const meshBase = anatomy.meshBase || "./assets/bodyparts3d/";
  const meshRoot = path.resolve(root, meshBase);
  const index = new Map();
  const seenIds = new Set();

  anatomy.muscles.forEach((muscle, indexNumber) => {
    if (!muscle?.id) errors.push(`${relative(file)}: muscles[${indexNumber}].id is required`);
    if (!muscle?.name) errors.push(`${relative(file)}: muscles[${indexNumber}].name is required`);
    if (muscle?.id) {
      if (seenIds.has(muscle.id)) errors.push(`${relative(file)}: duplicate anatomy muscle id "${muscle.id}"`);
      seenIds.add(muscle.id);
    }
    if (!Array.isArray(muscle?.meshFiles) || !muscle.meshFiles.length) {
      errors.push(`${relative(file)}: muscles[${indexNumber}].meshFiles must be non-empty`);
    } else {
      muscle.meshFiles.forEach(meshFile => {
        const fullPath = path.join(meshRoot, meshFile);
        if (!fs.existsSync(fullPath)) {
          errors.push(`${relative(file)}: ${muscle.name} references missing mesh "${meshFile}"`);
        }
      });
    }
    anatomyNamesFor(muscle).forEach(name => {
      const normalized = normalizeName(name);
      if (normalized) index.set(normalized, muscle);
    });
  });

  return index;
}

function anatomyMuscleForName(name) {
  const normalized = normalizeName(name);
  return anatomyIndex?.get(normalized) || null;
}

function validateMovement(file, movement, seenIds) {
  ["id", "name", "family", "equipment", "variantType", "variant", "description"].forEach(field =>
    requireField(movement, field, file)
  );

  if (movement?.id) {
    const expectedFile = `${movement.id}.json`;
    if (path.basename(file) !== expectedFile) {
      errors.push(`${relative(file)}: filename must match id (${expectedFile})`);
    }
    if (seenIds.has(movement.id)) errors.push(`${relative(file)}: duplicate movement id "${movement.id}"`);
    seenIds.add(movement.id);
  }

  if (!Array.isArray(movement?.tags) || !movement.tags.length) {
    errors.push(`${relative(file)}: tags must be a non-empty array`);
  } else {
    const seenTags = new Set();
    movement.tags.forEach((tag, index) => {
      if (!tag.label || !tag.group) errors.push(`${relative(file)}: tags[${index}] requires label and group`);
      const tagKey = `${normalizeName(tag.group)}:${normalizeName(tag.label)}`;
      if (seenTags.has(tagKey)) errors.push(`${relative(file)}: duplicate tag "${tag.group}/${tag.label}"`);
      seenTags.add(tagKey);
    });
  }

  REQUIRED_RATINGS.forEach(key => {
    if (!movement?.ratings || movement.ratings[key] === undefined) {
      errors.push(`${relative(file)}: missing ratings.${key}`);
      return;
    }
    validateRating(movement.ratings[key], key, file);
  });

  const studies = movement?.evidence?.studies || [];
  const studyIds = new Set(studies.map(study => study.id));
  if (!movement?.evidence || !Array.isArray(studies) || !studies.length) {
    errors.push(`${relative(file)}: evidence.studies must be a non-empty array`);
  }
  if (studyIds.size !== studies.length) {
    errors.push(`${relative(file)}: evidence.studies contains duplicate IDs`);
  }
  studies.forEach((study, index) => {
    ["id", "type", "shortCitation", "finding", "citation", "url", "relevance"].forEach(field => {
      if (!study[field]) errors.push(`${relative(file)}: evidence.studies[${index}].${field} is required`);
    });
  });

  const seenMuscles = new Map();
  MUSCLE_GROUPS.forEach(group => {
    const muscles = movement?.muscles?.[group];
    if (!Array.isArray(muscles)) {
      errors.push(`${relative(file)}: muscles.${group} must be an array`);
      return;
    }
    muscles.forEach((muscle, index) => {
      if (!muscle.name) errors.push(`${relative(file)}: muscles.${group}[${index}].name is required`);
      const muscleKey = normalizeName(muscle.name);
      if (seenMuscles.has(muscleKey)) {
        errors.push(`${relative(file)}: muscle "${muscle.name}" appears in both ${seenMuscles.get(muscleKey)} and ${group}`);
      }
      seenMuscles.set(muscleKey, group);
      if (muscle.name && !anatomyMuscleForName(muscle.name)) {
        errors.push(`${relative(file)}: muscles.${group}[${index}].name "${muscle.name}" has no local anatomy mesh mapping`);
      }
      if (!muscle.evidenceShort && !muscle.evidence) {
        errors.push(`${relative(file)}: muscles.${group}[${index}] requires evidenceShort or evidence`);
      }
      if (!Array.isArray(muscle.sourceIds) || !muscle.sourceIds.length) {
        errors.push(`${relative(file)}: muscles.${group}[${index}].sourceIds must be non-empty`);
      } else {
        muscle.sourceIds.forEach(sourceId => {
          if (!studyIds.has(sourceId)) {
            errors.push(`${relative(file)}: muscles.${group}[${index}] references missing study "${sourceId}"`);
          }
        });
      }
    });
  });

  validateResearchRecord(movement.id, studyIds);
}

function validateResearchRecord(movementId, studyIds) {
  if (!movementId) return;
  const file = path.join(researchDir, `${movementId}.json`);
  if (!fs.existsSync(file)) {
    errors.push(`${relative(file)}: research record is required`);
    return;
  }
  const record = readJSON(file);
  if (!record) return;
  if (record.movementId !== movementId) errors.push(`${relative(file)}: movementId must be "${movementId}"`);
  ["status", "lastReviewed", "evidenceStudyIds", "searchedQueries", "reviewedFiles", "excludedSources", "notes"].forEach(field =>
    requireField(record, field, file)
  );
  if (Array.isArray(record.evidenceStudyIds)) {
    record.evidenceStudyIds.forEach(sourceId => {
      if (!studyIds.has(sourceId)) {
        errors.push(`${relative(file)}: evidenceStudyIds references missing study "${sourceId}"`);
      }
    });
  }
}

function main() {
  ["meta.json", "anatomy.json"].forEach(file => {
    const fullPath = path.join(dataDir, file);
    if (!fs.existsSync(fullPath)) errors.push(`${relative(fullPath)}: missing file`);
    else if (file === "anatomy.json") anatomy = readJSON(fullPath);
    else readJSON(fullPath);
  });
  if (anatomy) anatomyIndex = buildAnatomyIndex(path.join(dataDir, "anatomy.json"));

  if (!fs.existsSync(movementsDir)) {
    errors.push(`${relative(movementsDir)}: missing movement directory`);
  }
  if (!fs.existsSync(researchDir)) {
    errors.push(`${relative(researchDir)}: missing research directory`);
  }

  const seenIds = new Set();
  const files = fs.existsSync(movementsDir)
    ? fs.readdirSync(movementsDir).filter(file => file.endsWith(".json")).sort()
    : [];
  if (!files.length) errors.push(`${relative(movementsDir)}: no movement files found`);
  files.forEach(file => {
    const fullPath = path.join(movementsDir, file);
    const movement = readJSON(fullPath);
    if (movement) validateMovement(fullPath, movement, seenIds);
  });

  if (fs.existsSync(researchDir)) {
    fs.readdirSync(researchDir)
      .filter(file => file.endsWith(".json"))
      .forEach(file => {
        const movementId = path.basename(file, ".json");
        if (!seenIds.has(movementId)) {
          errors.push(`${relative(path.join(researchDir, file))}: has no matching movement file`);
        }
      });
  }

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  console.log(`Validated ${files.length} movement files.`);
}

main();
