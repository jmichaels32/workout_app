# Movement Research Protocol

Use this before adding or changing a movement's muscle map.

## Goal

Turn exercise evidence into a compact app classification:

- Primary: intended target and best-supported mover.
- Secondary: meaningful movers that assist the lift but are not the main target.
- Support: muscles with meaningful stabilizing/control role, especially joint/scapular/core support.

Do not classify a muscle only because it is anatomically nearby.

## Evidence priority

1. Direct EMG study of the exact movement and close variations.
2. Systematic review/meta-analysis of the movement family.
3. Biomechanics or kinematic studies explaining joint action, moment arms, load path, or stability demand.
4. Closely related movement studies when exact studies do not exist.
5. Anatomy/clinical reasoning only as a fallback, clearly marked as inference.

EMG means electromyography. EKG is heart electrical activity and is not the right search term for exercise muscle activation.

## Search recipe

Search in this order:

- `"[movement]" EMG pectoralis anterior deltoid triceps`
- `"[movement]" electromyography muscle activation`
- `"[movement family]" systematic review electromyography`
- `"[movement]" biomechanics kinematics joint moment`
- `"[movement]" rotator cuff serratus anterior trapezius EMG`
- `"[movement]" grip width incline load tempo EMG`

Prefer PubMed, PMC, journal pages, DOI pages, university repositories, and full-text PDFs from universities or publishers. Avoid using blogs, social posts, or video explanations as primary evidence.

## Extraction checklist

For every useful paper, record:

- Exact exercise variant: machine/free weight/cable/bodyweight, angle, grip, stance, bench angle.
- Participants: trained/untrained, sex, sample size, sport background.
- Load: percent 1RM, RM target, absolute load, velocity/tempo, fatigue condition.
- Muscles measured: exact heads/regions, surface vs fine-wire EMG.
- Normalization: MVIC/MVC, peak dynamic normalization, or other.
- Outcome: mean EMG, peak EMG, phase-specific EMG, or timing.
- Main conclusion for app classification.
- Limits: small sample, no exact machine match, no deep muscle measurement, no longitudinal adaptation.

## Classification rule

Assign roles conservatively:

- Primary: direct movement-family evidence plus biomechanics agree.
- Secondary: measured contribution is meaningful, but either lower than target or dependent on grip/angle/load.
- Support: evidence shows control/stability contribution, or biomechanics strongly require joint/scapular stabilization.
- Unknown: evidence is weak, contradictory, or not measured.

When studies conflict, expose the variable that explains the conflict when possible: grip width, bench angle, load, fatigue, tempo, range of motion, or machine path.

## Data-entry template

```text
Movement:
Variant assumptions:

Primary:
- Muscle:
  Evidence:
  Source IDs:

Secondary:
- Muscle:
  Evidence:
  Source IDs:

Support:
- Muscle:
  Evidence:
  Source IDs:

Open questions:
- 

Sources:
- Title, year, URL
```

## Repository data rule

Each movement must be entered in its own source file:

```text
data/movements/<movement_id>.json
```

Do not hand-edit `data/movements.json`. It is a generated bundle for the browser. After changing source files, run:

```bash
node scripts/validate-movements.js
node scripts/build-movements.js
node scripts/build-movements.js --check
```

Every movement entry should include:

- `tags`: compact region, equipment, pattern, and adaptation labels.
- `ratings`: 0-100 scores plus rationale text for each score.
- `description`: a short prose walkthrough of setup and execution for the main card.
- `muscles`: primary, secondary, and support roles, with an evidence statement and source IDs for every visible muscle.
- `evidence`: professional summary, interpretation limits, and a study register containing the full citation, DOI when available, URL, relevance, and how the study was used.

Do not add a visible muscle role unless the JSON entry cites a source or explicitly marks the claim as anatomical inference.

## Anatomy mesh coverage rule

After finalizing primary, secondary, and support muscles, verify every listed muscle resolves to `data/anatomy.json`.

- If the muscle is already mapped, confirm its `meshFiles` exist under `assets/bodyparts3d/`.
- If the muscle is absent, import the smallest usable open-source mesh from BodyParts3D first; if BodyParts3D does not contain that muscle, use Z-Anatomy and record the source object/file in `data/anatomy.json`.
- Do not leave a movement with a synthetic fallback muscle ID, missing local mesh, or "mesh import pending" state.
- Run `node scripts/validate-movements.js`; missing muscle mappings must be treated as blockers, not cosmetic follow-up work.

## Tag taxonomy

Tags are browsing filters, not exhaustive descriptors. Use reusable macro buckets that can hold multiple movements over time.

- Region tags: use macro buckets first: `Upper body`, `Core`, `Lower body`, `Misc`. More specific region tags should sit under those buckets, such as `Chest`, `Back`, `Shoulders`, `Hamstrings`, `Quads`, `Glutes`.
- Equipment tags: the meaningful object, station, or broad modality required, such as `Bar`, `Dumbbell`, `Bench`, `Machine`, `Cable`, `Calisthenics`.
- Pattern tags: broad movement families that group multiple entries, such as `Push`, `Pull`, `Knee flexion`.

Avoid tags that are redundant, posture-only, or effectively one movement: `Free weight` when `Bar` or `Dumbbell` is already present, `Seated`, `Standing`, `Prone`, `Floor`, `Isolation`, `Unilateral`, or specific exercise names like `Lunge`. Use ratings and movement detail text for those properties instead of filter tags.

## Research record rule

Every movement must also have a companion research record:

```text
data/research/<movement_id>.json
```

Use it to record what has already been searched or reviewed so future agents do not repeat work:

- `evidenceStudyIds`: study IDs used in the movement's `evidence.studies` register.
- `searchedQueries`: search strings already tried.
- `reviewedFiles`: papers, PDFs, local docs, datasets, or source files already reviewed.
- `excludedSources`: sources considered but rejected, with a short reason.
- `notes`: unresolved questions, inference boundaries, and follow-up work.

## Rating review

Every movement should get 0-100 ratings. Higher is always better. Score globally across all exercises, not relative to one muscle group.

Treat the score as positive signal magnitude, not a school grade. A neutral or irrelevant dimension should be near `0`, not `50`. Do not give a movement credit for a dimension unless it meaningfully helps fill that bar in a program.

Training dimensions describe what the movement builds:

- Hypertrophy: local muscle-building stimulus and target-muscle loading quality.
- Strength: high-force production and clean progressive overload for force expression.
- Joint resilience: controlled loading for joints, tendons, connective tissue, and tolerance through useful range.
- Athletic transfer: carryover to real-world or sport-like coordination, unilateral loading, gait, balance, and force transfer.
- Motor control: skill, balance, bracing, coordination, positional awareness, and self-stabilization demand. Use the JSON key `control`; the visible label is `Motor Control`.
- Fatigue efficiency: useful stimulus per recovery cost. Higher means less systemic, joint, or unrelated fatigue leakage.

Metadata dimensions describe usability and constraint quality:

- Setup: 100 means lowest setup friction. Score from equipment availability, adjustment count, loading/unloading time, warm-up complexity, and repeatability.
- Ease: 100 means easiest to learn and repeat with good technique. Score from technical complexity, coordination demand, balance demand, range-of-motion constraints, and self-organization demand.
- Progression: 100 means easiest to progressively overload. Score from load increment granularity, safe load addition, setup repeatability, and how well performance maps to a trackable number.
- Support: 100 means most externally supported/stable. Score from machine guidance, body bracing, fixed path, balance demand, and how much stabilizing skill is required.

The app's composite score is the raw sum of training dimensions only. Setup metadata is displayed separately and does not contribute to the composite. It is not weighted.

Global anchors:

- 90-100: elite positive signal; one of the best global anchors for that dimension.
- 70-89: major positive signal; the movement clearly fills that bar.
- 50-69: useful positive signal, but with meaningful tradeoffs or narrower scope.
- 30-49: weak or highly specific positive signal.
- 1-29: incidental contribution; visible enough to mention but not a good reason to choose the movement.
- 0: no meaningful positive contribution to that dimension, or a net-negative quality represented as zero under the current nonnegative schema.

Use the full scale. Low scores are not failures; they are useful signal for workout construction because each dimension is meant to behave like a bar that a program can intentionally fill or leave empty.

`Motor Control` is distinct from `Athletic Transfer` and metadata `Support`: motor control scores the user's internal coordination/stabilization demand, athletic transfer scores carryover to sport-like or real-world force expression, and support scores how much the environment stabilizes the movement for the user.

Rating evidence order:

1. Direct studies comparing machine/free-weight variants, stability demands, force output, or EMG under different stability conditions.
2. Exercise mechanics: guided path vs free path, seated/back-supported vs unsupported, bilateral vs unilateral, fixed machine increments.
3. Coaching/common-practice inference when no direct paper exists. Mark this as inference.

Do not pretend these are lab-measured absolutes. They are structured product scores derived from evidence plus explicit engineering judgment.

## App rule

Only add a muscle to the visible movement card when we can explain why it is there in one sentence. If we need a vague label like "nearby support muscles", the data is not ready for the UI yet.
