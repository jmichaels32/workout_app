# Movement Data Workflow

Movement data is source-controlled per movement so multiple agents can work in parallel without editing the same JSON array.

## Source Files

```text
data/meta.json
data/anatomy.json
data/movements/<movement_id>.json
data/research/<movement_id>.json
```

`data/movements.json` is generated for the app. Do not hand-edit it.

## Agent Ownership

Each movement agent owns exactly two files:

```text
data/movements/<movement_id>.json
data/research/<movement_id>.json
```

Agents should not edit `index.html`, `data/movements.json`, shared anatomy, or another movement's files unless explicitly assigned.

If a movement uses a muscle that is not already in `data/anatomy.json`, the agent must stop and escalate that anatomy import as part of the same movement task. The movement is not complete until every visible primary, secondary, and support muscle has a local mesh mapping.

## Movement File Contract

Each movement file must include:

- `id`, `name`, `aliases`, `family`, `equipment`, `variantType`, `variant`
- `description`
- `communityRating`
- `tags`
- `ratings`
- `muscles`
- `evidence`

Every visible muscle role must cite one or more IDs from `evidence.studies`.

Every visible muscle role must also resolve to `data/anatomy.json` and that anatomy entry must point to existing files under `assets/bodyparts3d/`. Use the validator as the gate; do not rely on visual inspection to catch missing meshes.

## Research Record Contract

Each research file tracks what was already checked:

- `movementId`
- `status`
- `lastReviewed`
- `researchedBy`
- `evidenceStudyIds`
- `searchedQueries`
- `reviewedFiles`
- `excludedSources`
- `notes`

Use `reviewedFiles` for papers, PDFs, source URLs, local docs, datasets, or downloaded files that were actually reviewed. Use `excludedSources` for sources that were inspected but not used.

## Build And Validate

Run this before handing off movement data:

```bash
node scripts/validate-movements.js
node scripts/build-movements.js
node scripts/validate-movements.js
```

The app reads the generated bundle:

```text
data/movements.json
```
