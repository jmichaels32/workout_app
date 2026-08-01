export const MOVEMENT_DATA_URL = "./data/movements.json";
export const WORKOUT_STORAGE_KEY = "workout_app.workouts.v1";
export const WORKOUT_TEMPLATE_STORAGE_KEY = "workout_app.workout_templates.v1";
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
export const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
export const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric"
});

export const ROLE_GROUPS = [
  { key: "primary", label: "Primary", className: "primary", viewerRole: "primary" },
  { key: "secondary", label: "Secondary", className: "secondary", viewerRole: "secondary" },
  { key: "support", label: "Support", className: "support", viewerRole: "support" }
];

export const WORKOUT_HEATMAP_ROLE_POINTS = { primary: 3, secondary: 2, support: 1 };
export const WORKOUT_HEATMAP_POINTS_PER_MOVEMENT = 6;
export const TRAINING_RATINGS = {
  hypertrophy: "Hypertrophy",
  strength: "Strength",
  joint_resilience: "Joint Resilience",
  athletic_transfer: "Athletic Transfer",
  control: "Motor Control",
  fatigue_efficiency: "Fatigue Efficiency"
};
export const METADATA_RATINGS = {
  setup: "Setup",
  ease: "Ease",
  progression: "Progression",
  support: "Support"
};
export const RATING_COLORS = {
  composite: "var(--score-composite)",
  training: "var(--score-training)",
  metadata: "var(--score-metadata)",
  hypertrophy: "var(--score-training)",
  strength: "var(--score-training)",
  joint_resilience: "var(--score-training)",
  athletic_transfer: "var(--score-training)",
  control: "var(--score-training)",
  fatigue_efficiency: "var(--score-training)",
  setup: "var(--score-metadata)",
  ease: "var(--score-metadata)",
  progression: "var(--score-metadata)",
  support: "var(--score-metadata)"
};

export const TAG_GROUP_LABELS = {
  region: "Muscle group",
  equipment: "Equipment",
  pattern: "Pattern",
  library: "Library"
};
export const TAG_GROUP_ORDER = ["region", "equipment", "pattern"];
export const REGION_MACRO_ORDER = ["Upper body", "Core", "Lower body", "Misc"];
export const REGION_HIERARCHY = {
  "Upper body": ["Chest", "Back", "Shoulders", "Arms"],
  "Core": ["Abs", "Obliques"],
  "Lower body": ["Quads", "Hamstrings", "Glutes", "Adductors", "Calves"],
  "Misc": []
};
export const WRAP_HINTS = {
  quadriceps: "Quadri&shy;ceps",
  hamstrings: "Ham&shy;strings",
  gastrocnemius: "Gastro&shy;cnemius",
  semitendinosus: "Semi&shy;tendinosus",
  semimembranosus: "Semi&shy;membranosus",
  latissimus: "Latis&shy;simus",
  pectoralis: "Pector&shy;alis",
  stabilizers: "stabil&shy;izers",
  brachioradialis: "Brachio&shy;radialis"
};
export const SORT_LABELS = {
  composite: "Composite",
  training: "Training",
  metadata: "Setup"
};
export const SORT_DIRECTIONS = {
  none: "No sorting",
  desc: "High to low",
  asc: "Low to high"
};

export const MAX_WORKOUTS_PER_DAY = 3;
export const WORKOUT_COLOR_OPTIONS = [
  { label: "Volt", value: "#c8ff00" },
  { label: "Blue", value: "#7ec8ff" },
  { label: "Purple", value: "#9b7cff" },
  { label: "Coral", value: "#ff7f6e" },
  { label: "Gold", value: "#ffd84d" },
  { label: "Slate", value: "#9aa3ad" }
];
export const DEFAULT_PROGRESSIONS = {
  compound: { label: "Compound", sets: 3, repMin: 8, repMax: 12, loadStep: 5, rirTarget: 2 },
  isolation: { label: "Isolation", sets: 3, repMin: 10, repMax: 15, loadStep: 5, rirTarget: 2 },
  bodyweight: { label: "Bodyweight", sets: 3, repMin: 8, repMax: 20, loadStep: 0, rirTarget: 2 }
};
export const REP_GROUP_SIZE = 5;
export const REP_GROUP_THRESHOLD = 12;
export const REP_GROUP_TAIL = REP_GROUP_THRESHOLD - REP_GROUP_SIZE;
